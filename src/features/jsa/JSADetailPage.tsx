import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useJSA, useJSAReviews, useFacilities, useAssets, useLocations, useUsers, useUpdateJSA } from '@/shared/api/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { StatusBadge } from '@/shared/ui/status-badge';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { PendingWith } from '@/shared/ui/pending-with';
import { JSAPreview } from './JSAPreview';
import { JSAFormTable } from './JSAFormTable';
import { useAppStore } from '@/shared/store';
import { usePermitActions } from '@/shared/hooks/usePermitActions';
import { jsaPendingWith } from '@/shared/state-machine/permitMachine';
import { canPerformJSA } from '@/shared/permissions';
import { Eye, FileCheck, Check, Minus, Circle } from 'lucide-react';
import type { JSA, JSARow } from '@/entities/types';

const JSA_STAGES = [
  { key: 'draft', label: 'Draft (Applicant)' },
  { key: 'fscReview', label: 'FSC Owner Review' },
  { key: 'hseReview', label: 'HSE Endorsement' },
  { key: 'approved', label: 'Approved — Raise PTW' },
];

function JSATimeline({ status }: { status: string }) {
  const idx = JSA_STAGES.findIndex((s) => s.key === status);
  return (
    <div className="space-y-1">
      {JSA_STAGES.map((s, i) => {
        const isCurrent = i === idx;
        const isPast = i < idx;
        return (
          <div key={s.key} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              isCurrent ? 'bg-primary text-primary-foreground' :
              isPast ? 'bg-nnpc-green-light text-nnpc-green' :
              'bg-muted text-muted-foreground'
            }`}>
              {isPast ? <Check size={12} /> : isCurrent ? <Circle size={8} fill="currentColor" /> : <Minus size={8} />}
            </div>
            <span className={`text-sm ${isCurrent ? 'font-medium' : isPast ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewPanel({ jsa }: { jsa: JSA }) {
  const role = useAppStore((s) => s.currentRole);
  const currentUser = useAppStore((s) => s.currentUser);
  const { transitionJSA, createSubRecord, isPending } = usePermitActions();
  const [comment, setComment] = useState('');
  const navigate = useNavigate();

  const canFSCApprove = canPerformJSA(jsa.status, role, 'fsc_approve');
  const canHSEEndorse = canPerformJSA(jsa.status, role, 'hse_endorse');
  const canAmend = canPerformJSA(jsa.status, role, 'fsc_amend') || canPerformJSA(jsa.status, role, 'hse_amend');
  const canRaise = canPerformJSA(jsa.status, role, 'raise_permit') && !jsa.permitId;

  async function saveReview(status: 'approved' | 'amendmentRequired') {
    await createSubRecord('jsaReviews', {
      id: `jrev-${Date.now()}`,
      jsaId: jsa.id,
      reviewerRole: role as 'FSC Owner' | 'HSE Officer',
      reviewerId: currentUser?.id ?? '',
      status,
      comments: comment,
      requestedAmendments: status === 'amendmentRequired' ? comment : '',
      reviewedAt: new Date().toISOString(),
    });
  }

  async function handleFSCApprove() {
    await saveReview('approved');
    await transitionJSA(jsa, 'hseReview', 'jsa_fsc_approved',
      'FSC Owner approved — forwarded to HSE for endorsement', ['HSE Officer'],
      { fscReviewedBy: currentUser?.id ?? '', fscReviewedAt: new Date().toISOString() });
  }

  async function handleHSEEndorse() {
    await saveReview('approved');
    await transitionJSA(jsa, 'approved', 'jsa_hse_endorsed',
      'HSE endorsed — applicant may now raise the PTW', ['Applicant'],
      { hseApprovedBy: currentUser?.id ?? '', hseApprovedAt: new Date().toISOString() });
  }

  async function handleAmend() {
    await saveReview('amendmentRequired');
    await transitionJSA(jsa, 'draft', 'jsa_amendment_requested',
      `${role} requested amendment: ${comment}`, ['Applicant']);
  }

  if (jsa.status === 'approved') {
    return (
      <Card className="border-l-4 border-l-nnpc-green">
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-nnpc-green-dark">
            <FileCheck size={18} className="text-nnpc-green" />
            <span className="font-medium">JSA approved by FSC Owner & HSE.</span>
            {jsa.permitId
              ? <span className="text-muted-foreground">PTW raised: <Link className="text-primary underline" to={`/permits/${jsa.permitId}`}>view permit</Link></span>
              : <span className="text-muted-foreground">The applicant can now raise the Permit to Work.</span>}
          </div>
          {canRaise && (
            <Button onClick={() => navigate(`/permits/create?jsa=${jsa.id}`)}>
              Raise PTW from this JSA
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!canFSCApprove && !canHSEEndorse && !canAmend) return null;

  return (
    <Card className="border-l-4 border-l-nnpc-gold">
      <CardHeader>
        <CardTitle>{canFSCApprove ? 'FSC Owner Review' : 'HSE Endorsement'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Use the <strong>Preview JSA</strong> button above to see the filled NNPC JSA form before deciding.
        </p>
        <Textarea
          label="Comments"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Review comments..."
        />
        <div className="flex gap-2">
          {canFSCApprove && (
            <Button onClick={handleFSCApprove} disabled={isPending}>Approve — Forward to HSE</Button>
          )}
          {canHSEEndorse && (
            <Button onClick={handleHSEEndorse} disabled={isPending}>Endorse JSA</Button>
          )}
          {canAmend && (
            <Button variant="destructive" onClick={handleAmend} disabled={isPending || !comment}>
              Request Amendment
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DraftPanel({ jsa }: { jsa: JSA }) {
  const role = useAppStore((s) => s.currentRole);
  const { transitionJSA, isPending } = usePermitActions();
  const updateJSA = useUpdateJSA();
  const [rows, setRows] = useState<JSARow[]>(jsa.rows);
  const canEdit = canPerformJSA(jsa.status, role, 'edit');

  if (!canEdit) return null;

  async function handleResubmit() {
    await updateJSA.mutateAsync({ id: jsa.id, rows });
    await transitionJSA({ ...jsa, rows }, 'fscReview', 'jsa_submitted', 'JSA (re)submitted for FSC Owner review', ['FSC Owner']);
  }

  return (
    <Card className="border-l-4 border-l-nnpc-gold">
      <CardHeader><CardTitle>Edit & Submit JSA</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <JSAFormTable rows={rows} onChange={setRows} />
        <Button onClick={handleResubmit} disabled={isPending || updateJSA.isPending}>
          Submit for FSC Review
        </Button>
      </CardContent>
    </Card>
  );
}

export function JSADetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: jsa, isLoading } = useJSA(id!);
  const { data: reviews } = useJSAReviews(id!);
  const { data: facilities } = useFacilities();
  const { data: assets } = useAssets();
  const { data: locations } = useLocations();
  const { data: users } = useUsers();
  const [showPreview, setShowPreview] = useState(false);

  if (isLoading) return <div className="text-muted-foreground">Loading JSA...</div>;
  if (!jsa) return <div className="text-destructive">JSA not found.</div>;

  const facility = facilities?.find((f) => f.id === jsa.facilityId);
  const asset = assets?.find((a) => a.id === jsa.assetId);
  const location = locations?.find((l) => l.id === jsa.locationId);
  const applicant = users?.find((u) => u.id === jsa.applicantId);
  const pending = jsaPendingWith(jsa.status);
  const pendingActor = users?.find((u) => u.role === pending.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{jsa.serialNo}</h1>
          <StatusBadge status={jsa.status} />
        </div>
        <Button variant="outline" onClick={() => setShowPreview(true)}>
          <Eye size={16} className="mr-1" /> Preview JSA
        </Button>
      </div>

      <PendingWith pending={pending} actorName={pendingActor?.name} />

      <div className="grid lg:grid-cols-[1fr_250px] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid sm:grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Facility:</span> {facility?.name}</div>
                <div><span className="text-muted-foreground">Asset:</span> {asset?.name}</div>
                <div><span className="text-muted-foreground">Location:</span> {location?.name}</div>
                <div><span className="text-muted-foreground">Prepared by:</span> {applicant?.name}</div>
                <div><span className="text-muted-foreground">Execution:</span> {jsa.inHouseOrContractor}</div>
                <div><span className="text-muted-foreground">Risk:</span> <span className={`font-medium ${jsa.riskCategory === 'Critical' || jsa.riskCategory === 'High' ? 'text-nnpc-red' : ''}`}>{jsa.riskCategory}</span></div>
                <div><span className="text-muted-foreground">Start:</span> {new Date(jsa.scheduledStart).toLocaleString()}</div>
                <div><span className="text-muted-foreground">End:</span> {new Date(jsa.scheduledEnd).toLocaleString()}</div>
              </div>
              <p className="pt-2 border-t border-border"><span className="text-muted-foreground">Job:</span> {jsa.jobDescription}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                {jsa.gasTestRequired && <Badge variant="warning">Gas Test Required (at PTW stage)</Badge>}
                {jsa.isolationRequired && <Badge variant="warning">Isolation / LOTO Required</Badge>}
                {!jsa.simopsRequired && <Badge variant="success">No SIMOPS Conflict</Badge>}
                {jsa.toolboxTalkRequired && <Badge variant="secondary">Toolbox Talk</Badge>}
              </div>
            </CardContent>
          </Card>

          {/* Review history */}
          {reviews && reviews.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Review History</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {reviews.sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt)).map((r) => (
                  <div key={r.id} className="p-3 bg-muted rounded-lg text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{r.reviewerRole}</span>
                      <Badge variant={r.status === 'approved' ? 'success' : 'warning'}>
                        {r.status === 'approved' ? 'Approved' : 'Amendment Requested'}
                      </Badge>
                    </div>
                    {r.comments && <p className="text-muted-foreground mt-1">{r.comments}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action panels */}
          {jsa.status === 'draft' ? <DraftPanel jsa={jsa} /> : <ReviewPanel jsa={jsa} />}

          {/* JSA table (read-only view) */}
          {jsa.status !== 'draft' && (
            <Card>
              <CardHeader><CardTitle>Hazard Analysis ({jsa.rows.length} steps)</CardTitle></CardHeader>
              <CardContent>
                <JSAFormTable rows={jsa.rows} onChange={() => {}} readOnly />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <Card className="sticky top-20">
            <CardHeader className="pb-2"><CardTitle className="text-sm">JSA Progress</CardTitle></CardHeader>
            <CardContent>
              <JSATimeline status={jsa.status} />
            </CardContent>
          </Card>
        </div>
      </div>

      {showPreview && <JSAPreview jsa={jsa} onClose={() => setShowPreview(false)} />}
    </div>
  );
}
