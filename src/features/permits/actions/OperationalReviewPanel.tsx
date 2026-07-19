import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Textarea } from '@/shared/ui/textarea';
import { Input } from '@/shared/ui/input';
import { usePermitActions } from '@/shared/hooks/usePermitActions';
import { useAppStore } from '@/shared/store';
import {
  usePermits, useSIMOPSAssessments, useIsolationCertificates, useGasTests,
} from '@/shared/api/queries';
import type { Permit } from '@/entities/types';
import { canPerform } from '@/shared/permissions';
import { checkSIMOPSConflicts } from '@/features/system-intelligence/deriveIntelligence';
import { AlertTriangle, ShieldCheck, Check, Clock } from 'lucide-react';

function GateBadge({ status }: { status: 'notRequired' | 'missing' | 'submitted' | 'approved' | 'expired' }) {
  if (status === 'notRequired') return <Badge variant="secondary">Not Required</Badge>;
  if (status === 'missing') return <Badge variant="warning">Awaiting Job Owner</Badge>;
  if (status === 'submitted') return <Badge variant="warning">Submitted — FSC Approval Pending</Badge>;
  if (status === 'expired') return <Badge variant="destructive">Expired — Retest Required</Badge>;
  return <Badge variant="success">Approved</Badge>;
}

/**
 * FSC Operational Review. The JOB OWNER (applicant) prepares and submits the
 * SIMOPS assessment, Isolation/LOTO and Gas Test where applicable; the
 * FSC OWNER approves each gate and closes the review.
 */
export function OperationalReviewPanel({ permit }: { permit: Permit }) {
  const role = useAppStore((s) => s.currentRole);
  const currentUser = useAppStore((s) => s.currentUser);
  const { transitionPermit, createSubRecord, updateSubRecord, notify, isPending } = usePermitActions();

  const { data: allPermits } = usePermits();
  const { data: simopsData } = useSIMOPSAssessments(permit.id);
  const { data: isolationData } = useIsolationCertificates(permit.id);
  const { data: gasTestData } = useGasTests(permit.id);

  const [simopsForm, setSimopsForm] = useState({ interfaceRisks: '', combinedHazards: '', sequencingPlan: '', commsPlan: '' });
  const [isolationType, setIsolationType] = useState<'electrical' | 'mechanical' | 'process'>('electrical');
  const [isolationPoints, setIsolationPoints] = useState('');
  const [gasReadings, setGasReadings] = useState({ o2: '', lel: '', h2s: '', co: '', other: '' });
  const [gasValidHours, setGasValidHours] = useState('4');

  const conflicts = useMemo(() => {
    if (!allPermits) return [];
    return checkSIMOPSConflicts(
      permit.locationId, permit.assetId,
      permit.scheduledStart, permit.scheduledEnd,
      permit.id, allPermits,
    );
  }, [allPermits, permit]);
  const conflictPermits = allPermits?.filter((p) => conflicts.includes(p.id)) ?? [];
  const simopsNeeded = permit.simopsRequired || conflicts.length > 0;

  const latestSimops = simopsData?.slice().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  const latestIso = isolationData?.slice().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  const latestGas = gasTestData?.slice().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  const gasExpired = latestGas && new Date(latestGas.validUntil) <= new Date();

  const simopsGate = !simopsNeeded ? 'notRequired' : !latestSimops ? 'missing' : latestSimops.status === 'approved' ? 'approved' : 'submitted';
  const isoGate = !permit.isolationRequired ? 'notRequired' : !latestIso ? 'missing' : latestIso.status === 'approved' ? 'approved' : 'submitted';
  const gasGate = !permit.gasTestRequired ? 'notRequired' : !latestGas ? 'missing' : gasExpired ? 'expired' : latestGas.status === 'approved' ? 'approved' : 'submitted';

  const allComplete =
    (simopsGate === 'notRequired' || simopsGate === 'approved') &&
    (isoGate === 'notRequired' || isoGate === 'approved') &&
    (gasGate === 'notRequired' || gasGate === 'approved');

  const isJobOwner = canPerform(permit.status, role, 'gate_submit');
  const isFSC = canPerform(permit.status, role, 'gate_approve');

  // ---- Job owner submissions ----
  async function submitSimops() {
    await createSubRecord('simopsAssessments', {
      id: `sim-${Date.now()}`, permitId: permit.id, relatedPermitIds: conflicts,
      ...simopsForm, status: 'submitted',
      submittedBy: currentUser?.id ?? '', submittedAt: new Date().toISOString(),
      approvedBy: null, approvedAt: null,
    });
    await notify(['FSC Owner'], permit.id, `${permit.permitNumber}: SIMOPS assessment submitted — approval required.`);
  }

  async function submitIsolation() {
    await createSubRecord('isolationCertificates', {
      id: `iso-${Date.now()}`, permitId: permit.id, type: isolationType,
      isolationPoints, lotoVerified: true, status: 'submitted',
      submittedBy: currentUser?.id ?? '', submittedAt: new Date().toISOString(),
      approvedBy: null, approvedAt: null,
    });
    await notify(['FSC Owner'], permit.id, `${permit.permitNumber}: Isolation/LOTO submitted — approval required.`);
  }

  async function submitGasTest() {
    const now = new Date();
    const validUntil = new Date(now.getTime() + parseInt(gasValidHours || '4') * 3600000);
    await createSubRecord('gasTests', {
      id: `gas-${Date.now()}`, permitId: permit.id,
      readings: gasReadings, testedAt: now.toISOString(), validUntil: validUntil.toISOString(),
      status: 'submitted', submittedBy: currentUser?.id ?? '', submittedAt: now.toISOString(),
      approvedBy: null, approvedAt: null,
    });
    await notify(['FSC Owner'], permit.id, `${permit.permitNumber}: Gas test results submitted — approval required.`);
  }

  // ---- FSC approvals ----
  async function approveGate(resource: string, id: string, label: string) {
    await updateSubRecord(resource, id, {
      status: 'approved', approvedBy: currentUser?.id ?? '', approvedAt: new Date().toISOString(),
    } as never);
    await notify(['Applicant'], permit.id, `${permit.permitNumber}: ${label} approved by FSC Owner.`);
  }

  async function handleCloseReview() {
    await createSubRecord('fscReviews', {
      id: `fsc-${Date.now()}`, permitId: permit.id, reviewerId: currentUser?.id ?? '',
      conflicts: conflictPermits.map((p) => ({ type: 'location', detail: `Same location as ${p.permitNumber}`, relatedPermitId: p.id })),
      decision: 'approved', reviewedAt: new Date().toISOString(),
    });
    await transitionPermit(permit, 'contractorAcceptance', 'operational_review_closed',
      'Operational review completed — all gates approved', ['Contractor']);
  }

  const inputCls = 'h-9 rounded-md border border-input bg-card px-3 text-sm';

  return (
    <div className="space-y-4">
      {/* Conflict scan */}
      <Card className="border-l-4 border-l-nnpc-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={18} /> FSC Operational Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conflicts.length > 0 ? (
            <div className="bg-nnpc-red/10 border border-nnpc-red/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-nnpc-red mb-1">
                <AlertTriangle size={16} /> SIMOPS Conflicts Detected ({conflicts.length})
              </div>
              {conflictPermits.map((p) => (
                <p key={p.id} className="text-xs text-muted-foreground">{p.permitNumber} — {p.natureOfWork.join(', ')} ({p.status})</p>
              ))}
            </div>
          ) : (
            <div className="bg-nnpc-green-light rounded-lg p-3 flex items-center gap-2 text-sm text-nnpc-green-dark font-medium">
              <Check size={16} /> No SIMOPS conflict detected — no simultaneous operations at this location.
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            The <strong>job owner</strong> submits each applicable gate below; the <strong>FSC Owner</strong> approves them and closes the review.
          </p>
        </CardContent>
      </Card>

      {/* SIMOPS gate */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">SIMOPS Assessment</span>
            <GateBadge status={simopsGate} />
          </div>
        </CardHeader>
        {simopsNeeded && (
          <CardContent className="space-y-3">
            {latestSimops && (
              <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
                <p><span className="font-medium">Interface risks:</span> {latestSimops.interfaceRisks}</p>
                <p><span className="font-medium">Sequencing:</span> {latestSimops.sequencingPlan}</p>
              </div>
            )}
            {isJobOwner && simopsGate === 'missing' && (
              <>
                <Textarea label="Interface Risks" value={simopsForm.interfaceRisks} onChange={(e) => setSimopsForm((f) => ({ ...f, interfaceRisks: e.target.value }))} />
                <Textarea label="Combined Hazards" value={simopsForm.combinedHazards} onChange={(e) => setSimopsForm((f) => ({ ...f, combinedHazards: e.target.value }))} />
                <Textarea label="Work Sequencing Plan" value={simopsForm.sequencingPlan} onChange={(e) => setSimopsForm((f) => ({ ...f, sequencingPlan: e.target.value }))} />
                <Textarea label="Communication Plan" value={simopsForm.commsPlan} onChange={(e) => setSimopsForm((f) => ({ ...f, commsPlan: e.target.value }))} />
                <Button onClick={submitSimops} disabled={isPending}>Submit SIMOPS Assessment</Button>
              </>
            )}
            {isFSC && simopsGate === 'submitted' && latestSimops && (
              <Button onClick={() => approveGate('simopsAssessments', latestSimops.id, 'SIMOPS assessment')} disabled={isPending}>
                Approve SIMOPS Assessment
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {/* Isolation gate */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Isolation / LOTO</span>
            <GateBadge status={isoGate} />
          </div>
        </CardHeader>
        {permit.isolationRequired && (
          <CardContent className="space-y-3">
            {latestIso && (
              <div className="p-3 bg-muted rounded-lg text-xs">
                <p><span className="font-medium">Type:</span> {latestIso.type} · <span className="font-medium">LOTO verified:</span> {latestIso.lotoVerified ? 'Yes' : 'No'}</p>
                <p><span className="font-medium">Isolation points:</span> {latestIso.isolationPoints}</p>
              </div>
            )}
            {isJobOwner && isoGate === 'missing' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Isolation Type</label>
                  <select value={isolationType} onChange={(e) => setIsolationType(e.target.value as typeof isolationType)} className={inputCls}>
                    <option value="electrical">Electrical</option>
                    <option value="mechanical">Mechanical</option>
                    <option value="process">Process</option>
                  </select>
                </div>
                <Textarea label="Isolation Points (breakers, valves, blinds...)" value={isolationPoints} onChange={(e) => setIsolationPoints(e.target.value)} />
                <div className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-nnpc-green" /> LOTO applied and verified at points listed
                </div>
                <Button onClick={submitIsolation} disabled={isPending || !isolationPoints}>Submit Isolation / LOTO</Button>
              </>
            )}
            {isFSC && isoGate === 'submitted' && latestIso && (
              <Button onClick={() => approveGate('isolationCertificates', latestIso.id, 'Isolation/LOTO')} disabled={isPending}>
                Approve Isolation Certificate
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {/* Gas test gate */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Gas Testing</span>
            <GateBadge status={gasGate} />
          </div>
        </CardHeader>
        {permit.gasTestRequired && (
          <CardContent className="space-y-3">
            {latestGas && (
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p>O2: {latestGas.readings.o2} | LEL: {latestGas.readings.lel} | H2S: {latestGas.readings.h2s} | CO: {latestGas.readings.co}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={12} />
                  Tested: {new Date(latestGas.testedAt).toLocaleString()} · Valid until: {new Date(latestGas.validUntil).toLocaleString()}
                </p>
                {gasExpired && <p className="text-nnpc-red text-xs font-medium">Expired — job owner must retest.</p>}
              </div>
            )}
            {isJobOwner && (gasGate === 'missing' || gasGate === 'expired') && (
              <>
                <p className="text-xs text-muted-foreground">Enter the readings from the authorised gas tester's instrument. Expiry is monitored — a retest alert is raised before expiry.</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="O2 (%)" value={gasReadings.o2} onChange={(e) => setGasReadings((r) => ({ ...r, o2: e.target.value }))} placeholder="20.9%" />
                  <Input label="LEL (%)" value={gasReadings.lel} onChange={(e) => setGasReadings((r) => ({ ...r, lel: e.target.value }))} placeholder="0%" />
                  <Input label="H2S (ppm)" value={gasReadings.h2s} onChange={(e) => setGasReadings((r) => ({ ...r, h2s: e.target.value }))} placeholder="0 ppm" />
                  <Input label="CO (ppm)" value={gasReadings.co} onChange={(e) => setGasReadings((r) => ({ ...r, co: e.target.value }))} placeholder="0 ppm" />
                </div>
                <Input label="Valid for (hours)" value={gasValidHours} onChange={(e) => setGasValidHours(e.target.value)} />
                <Button onClick={submitGasTest} disabled={isPending || !gasReadings.o2 || !gasReadings.lel}>
                  Submit Gas Test Results
                </Button>
              </>
            )}
            {isFSC && gasGate === 'submitted' && latestGas && (
              <Button onClick={() => approveGate('gasTests', latestGas.id, 'Gas test')} disabled={isPending}>
                Approve Gas Test
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {/* Close review */}
      {isFSC && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm">
                {allComplete ? (
                  <span className="text-nnpc-green font-medium">All gates cleared — ready to close review</span>
                ) : (
                  <span className="text-nnpc-gold font-medium">Gates outstanding — cannot close review yet</span>
                )}
              </div>
              <Button onClick={handleCloseReview} disabled={isPending || !allComplete}>
                Close Operational Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
