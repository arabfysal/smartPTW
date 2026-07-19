import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePermit, useFacilities, useAssets, useLocations, useUsers, useDocuments, useJSA } from '@/shared/api/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { StatusBadge } from '@/shared/ui/status-badge';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { PendingWith } from '@/shared/ui/pending-with';
import { PermitTimeline } from './PermitTimeline';
import { HSEReviewPanel } from './actions/HSEReviewPanel';
import { OperationalReviewPanel } from './actions/OperationalReviewPanel';
import { ContractorAcceptancePanel } from './actions/ContractorAcceptancePanel';
import { FinalApprovalPanel } from './actions/FinalApprovalPanel';
import { MonitoringPanel } from './actions/MonitoringPanel';
import { CompletionPanel, ChecklistCard, COMPLETION_REQUEST_ITEMS } from './actions/CompletionPanel';
import { PermitPrintView } from './PermitPrintView';
import { CompletionCertificate } from './CompletionCertificate';
import { JSAPreview } from '@/features/jsa/JSAPreview';
import { JSAAmendPanel } from '@/features/jsa/JSAAmendPanel';
import { useAppStore } from '@/shared/store';
import { usePermitActions } from '@/shared/hooks/usePermitActions';
import { canPerform } from '@/shared/permissions';
import { permitPendingWith } from '@/shared/state-machine/permitMachine';
import { Eye, FileCheck, Check, Printer, Award } from 'lucide-react';
import type { Permit, JSA } from '@/entities/types';

function DraftPanel({ permit }: { permit: Permit }) {
  const role = useAppStore((s) => s.currentRole);
  const { transitionPermit, isPending } = usePermitActions();
  const { data: docs } = useDocuments(permit.id);

  const canSubmit = canPerform(permit.status, role, 'submit');
  const uploaded = new Set(docs?.map((d) => d.type) ?? []);
  const missing = permit.requiredDocuments.filter((d) => !uploaded.has(d));

  return (
    <Card>
      <CardHeader><CardTitle>Documents & Submission</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          {permit.requiredDocuments.map((d) => (
            <div key={d} className="flex items-center gap-2 text-sm p-2 rounded border border-border">
              {uploaded.has(d)
                ? <Check size={14} className="text-nnpc-green" />
                : <span className="w-3.5 h-3.5 rounded-full border-2 border-nnpc-gold" />}
              <span>{d}</span>
            </div>
          ))}
        </div>
        {canSubmit && (
          <Button
            onClick={() => transitionPermit(permit, 'hseReview', 'permit_submitted', 'All documents verified — submitted for HSE review', ['HSE Officer'])}
            disabled={isPending || missing.length > 0}
          >
            Submit for HSE Review
          </Button>
        )}
        {missing.length > 0 && (
          <p className="text-xs text-nnpc-red">All documents are required before submission ({missing.length} outstanding).</p>
        )}
      </CardContent>
    </Card>
  );
}

function SuspendedPanel({ permit, jsa }: { permit: Permit; jsa: JSA | undefined }) {
  const role = useAppStore((s) => s.currentRole);
  const { transitionPermit, isPending } = usePermitActions();
  const [amended, setAmended] = useState(false);
  const canRevalidate = canPerform(permit.status, role, 'revalidate');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-nnpc-red">Permit Suspended — Morning Revalidation</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Permits suspend automatically at 18:00 daily per NNPC policy (or on a safety event). The FSC Owner
            visits the site each morning, reviews today's conditions (weather, adjacent work, site changes) and may
            amend the JSA before revalidating. If the JSA is amended, the Contractor must accept the changes
            before work resumes.
          </p>
          {canRevalidate && !amended && (
            <Button
              onClick={() => transitionPermit(permit, 'active', 'revalidation_complete',
                'Morning site visit done — no JSA changes required. Permit revalidated by FSC Owner.',
                ['Applicant', 'Contractor', 'HSE Officer'])}
              disabled={isPending}
            >
              Revalidate & Reactivate (no JSA changes)
            </Button>
          )}
          {canRevalidate && amended && (
            <Button
              onClick={() => transitionPermit(permit, 'contractorAcceptance', 'revalidation_jsa_amended',
                'JSA amended during morning revalidation — Contractor must accept the updated conditions before work resumes.',
                ['Contractor'])}
              disabled={isPending}
            >
              Send to Contractor for Re-acceptance
            </Button>
          )}
        </CardContent>
      </Card>
      {canRevalidate && jsa && (
        <JSAAmendPanel
          jsa={jsa}
          permit={permit}
          onAmended={() => setAmended(true)}
          title="Morning Site Visit — Amend JSA for Today"
          description="Record today's conditions from your site visit. Saving amendments requires the Contractor to re-accept before the permit reactivates."
        />
      )}
    </div>
  );
}

function ActivePanel({ permit }: { permit: Permit }) {
  const role = useAppStore((s) => s.currentRole);
  const { transitionPermit, createSubRecord, isPending } = usePermitActions();
  const currentUser = useAppStore((s) => s.currentUser);
  const canRequest = canPerform(permit.status, role, 'request_completion');

  async function handleRequestCompletion(checked: string[]) {
    await createSubRecord('completions', {
      permitId: permit.id,
      confirmedBy: currentUser?.id ?? '',
      checklist: checked.map((item) => ({ item, done: true })),
      completedAt: new Date().toISOString(),
    });
    await transitionPermit(permit, 'completionPending', 'completion_requested',
      `Work completion requested by ${role} — awaiting HSE site verification`, ['HSE Officer', 'FSC Owner']);
  }

  return (
    <div className="space-y-4">
      <MonitoringPanel permit={permit} />
      {canRequest && (
        <ChecklistCard
          title="Request Work Completion"
          subtitle="Complete this checklist to request completion. HSE will verify on site, then the FSC Owner closes out the permit."
          items={COMPLETION_REQUEST_ITEMS}
          onComplete={handleRequestCompletion}
          canAct
          isPending={isPending}
          buttonLabel="Request Work Completion"
        />
      )}
    </div>
  );
}

function ActionPanel({ permit, jsa }: { permit: Permit; jsa: JSA | undefined }) {
  const role = useAppStore((s) => s.currentRole);
  const canAmendJSA = canPerform(permit.status, role, 'amend_jsa');

  switch (permit.status) {
    case 'draft':
      return <DraftPanel permit={permit} />;
    case 'hseReview':
      return (
        <div className="space-y-4">
          <HSEReviewPanel permit={permit} />
          {canAmendJSA && jsa && (
            <JSAAmendPanel
              jsa={jsa}
              permit={permit}
              title="Review / Amend Approved JSA (current-day hazards)"
            />
          )}
        </div>
      );
    case 'fscOperationalReview':
      return (
        <div className="space-y-4">
          <OperationalReviewPanel permit={permit} />
          {canAmendJSA && jsa && (
            <JSAAmendPanel
              jsa={jsa}
              permit={permit}
              title="Review / Amend Approved JSA (current-day hazards)"
            />
          )}
        </div>
      );
    case 'contractorAcceptance':
      return <ContractorAcceptancePanel permit={permit} />;
    case 'finalApproval':
      return <FinalApprovalPanel permit={permit} />;
    case 'active':
      return <ActivePanel permit={permit} />;
    case 'suspended':
      return <SuspendedPanel permit={permit} jsa={jsa} />;
    case 'completionPending':
    case 'fscCloseout':
      return <CompletionPanel permit={permit} />;
    case 'closed':
      return (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-nnpc-green">
              <Badge variant="outline">Archived</Badge>
              <span className="text-sm">This permit is closed and read-only. The completion certificate is available above.</span>
            </div>
          </CardContent>
        </Card>
      );
    default:
      return null;
  }
}

const PRINTABLE_STATUSES = ['active', 'suspended', 'completionPending', 'fscCloseout', 'closed'];

export function PermitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: permit, isLoading } = usePermit(id!);
  const { data: facilities } = useFacilities();
  const { data: assets } = useAssets();
  const { data: locations } = useLocations();
  const { data: users } = useUsers();
  const { data: jsa } = useJSA(permit?.jsaId ?? '');
  const [showJSA, setShowJSA] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  if (isLoading) return <div className="text-muted-foreground">Loading permit...</div>;
  if (!permit) return <div className="text-destructive">Permit not found.</div>;

  const facility = facilities?.find((f) => f.id === permit.facilityId);
  const asset = assets?.find((a) => a.id === permit.assetId);
  const location = locations?.find((l) => l.id === permit.locationId);
  const applicant = users?.find((u) => u.id === permit.applicantId);
  const pending = permitPendingWith(permit.status);
  const pendingActor = users?.find((u) => u.role === pending.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{permit.permitNumber}</h1>
          <StatusBadge status={permit.status} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {jsa && (
            <Button variant="outline" size="sm" onClick={() => setShowJSA(true)}>
              <Eye size={14} className="mr-1" /> Preview JSA
            </Button>
          )}
          {PRINTABLE_STATUSES.includes(permit.status) && (
            <Button variant="outline" size="sm" onClick={() => setShowPrint(true)}>
              <Printer size={14} className="mr-1" /> Print Permit
            </Button>
          )}
          {permit.status === 'closed' && (
            <Button size="sm" onClick={() => setShowCertificate(true)}>
              <Award size={14} className="mr-1" /> Completion Certificate
            </Button>
          )}
          <span className="text-sm text-muted-foreground">Applicant: {applicant?.name ?? permit.applicantId}</span>
        </div>
      </div>

      <PendingWith pending={pending} actorName={pendingActor?.name} />

      <div className="grid lg:grid-cols-[1fr_250px] gap-6">
        <div className="space-y-6 min-w-0">
          {/* Details */}
          <Card>
            <CardHeader><CardTitle>Permit Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Facility:</span> {facility?.name}</div>
                <div><span className="text-muted-foreground">Asset:</span> {asset?.name}</div>
                <div><span className="text-muted-foreground">Location:</span> {location?.name}</div>
                <div><span className="text-muted-foreground">Risk:</span> <span className={`font-medium ${permit.riskCategory === 'Critical' || permit.riskCategory === 'High' ? 'text-nnpc-red' : 'text-foreground'}`}>{permit.riskCategory}</span></div>
                <div><span className="text-muted-foreground">Start:</span> {new Date(permit.scheduledStart).toLocaleString()}</div>
                <div><span className="text-muted-foreground">End:</span> {new Date(permit.scheduledEnd).toLocaleString()}</div>
              </div>
              {jsa && (
                <div className="flex items-center gap-2 pt-1">
                  <FileCheck size={14} className="text-nnpc-green" />
                  <span className="text-muted-foreground">JSA:</span>
                  <Link to={`/jsas/${jsa.id}`} className="text-primary hover:underline">{jsa.serialNo}</Link>
                  <Badge variant="success">Approved</Badge>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Work Types:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {permit.natureOfWork.map((w) => <Badge key={w} variant="secondary">{w}</Badge>)}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
                <Badge variant={permit.gasTestRequired ? 'warning' : 'secondary'}>Gas Test: {permit.gasTestRequired ? 'Required' : 'N/A'}</Badge>
                <Badge variant={permit.isolationRequired ? 'warning' : 'secondary'}>Isolation: {permit.isolationRequired ? 'Required' : 'N/A'}</Badge>
                <Badge variant={permit.simopsRequired ? 'warning' : 'success'}>SIMOPS: {permit.simopsRequired ? 'Required' : 'No Conflict'}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader><CardTitle>Requirements</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Required PPE</span>
                <div className="flex flex-wrap gap-1">
                  {permit.requiredPPE.map((ppe) => <span key={ppe} className="bg-muted px-2 py-0.5 rounded text-xs">{ppe}</span>)}
                </div>
              </div>
              {permit.requiredCertificates.length > 0 && (
                <div>
                  <span className="text-muted-foreground block mb-1">Required Certificates</span>
                  <div className="flex flex-wrap gap-1">
                    {permit.requiredCertificates.map((c) => <span key={c} className="bg-muted px-2 py-0.5 rounded text-xs">{c}</span>)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Panel */}
          <ActionPanel permit={permit} jsa={jsa} />

          {/* History */}
          <Card>
            <CardHeader><CardTitle>History</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {permit.history.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm py-2 border-b border-border last:border-0">
                    <span className="text-muted-foreground shrink-0 text-xs">{new Date(h.at).toLocaleString()}</span>
                    <StatusBadge status={h.stage} />
                    <span className="text-muted-foreground">{h.note}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Timeline */}
        <div className="hidden lg:block">
          <Card className="sticky top-20">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Workflow Progress</CardTitle></CardHeader>
            <CardContent>
              <PermitTimeline currentStatus={permit.status} permit={permit} />
            </CardContent>
          </Card>
        </div>
      </div>

      {showJSA && jsa && <JSAPreview jsa={jsa} onClose={() => setShowJSA(false)} />}
      {showPrint && <PermitPrintView permit={permit} onClose={() => setShowPrint(false)} />}
      {showCertificate && <CompletionCertificate permit={permit} onClose={() => setShowCertificate(false)} />}
    </div>
  );
}
