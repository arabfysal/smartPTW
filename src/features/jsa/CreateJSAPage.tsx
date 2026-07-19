import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Textarea } from '@/shared/ui/textarea';
import { JSAFormTable } from './JSAFormTable';
import { deriveIntelligence } from '@/features/system-intelligence/deriveIntelligence';
import { useFacilities, useAssets, useLocations, useWorkTypeRules, usePermits, useCreateJSA, useCreateAuditEntry, useCreateNotification } from '@/shared/api/queries';
import { useAppStore } from '@/shared/store';
import { Check, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { JSARow } from '@/entities/types';

const STEPS = ['Job Details', 'Nature of Work', 'JSA Form', 'Review & Submit'];

export function CreateJSAPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const [step, setStep] = useState(0);

  const [facilityId, setFacilityId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [inHouse, setInHouse] = useState<'In-House' | 'Contractor'>('In-House');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([]);
  const [rows, setRows] = useState<JSARow[]>([]);
  const [stopWork, setStopWork] = useState(
    'Gas alarm activation; weather deterioration (lightning/high wind); loss of communication; any unplanned release; emergency siren.',
  );
  const [comments, setComments] = useState('');
  const [rowsSeeded, setRowsSeeded] = useState('');

  const { data: facilities } = useFacilities();
  const { data: assets } = useAssets(facilityId || undefined);
  const { data: locations } = useLocations(facilityId || undefined);
  const { data: rules } = useWorkTypeRules();
  const { data: allPermits } = usePermits();
  const createJSA = useCreateJSA();
  const createAudit = useCreateAuditEntry();
  const createNotif = useCreateNotification();

  const intelligence = useMemo(() => {
    if (!rules || selectedWorkTypes.length === 0 || !locationId || !assetId) return null;
    return deriveIntelligence(selectedWorkTypes, rules, {
      locationId,
      assetId,
      scheduledStart: scheduledStart || new Date().toISOString(),
      scheduledEnd: scheduledEnd || new Date(Date.now() + 8 * 3600000).toISOString(),
      allPermits: allPermits ?? [],
    });
  }, [selectedWorkTypes, rules, locationId, assetId, scheduledStart, scheduledEnd, allPermits]);

  // Auto-populate JSA rows when the work type selection changes (allowing later edits)
  useEffect(() => {
    if (!intelligence) return;
    const key = selectedWorkTypes.slice().sort().join(',');
    if (key !== rowsSeeded) {
      setRows(intelligence.jsaRows);
      setRowsSeeded(key);
    }
  }, [intelligence, selectedWorkTypes, rowsSeeded]);

  function toggleWorkType(id: string) {
    setSelectedWorkTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return !!facilityId && !!assetId && !!locationId && !!scheduledStart && !!scheduledEnd && jobDescription.trim().length > 5;
      case 1: return selectedWorkTypes.length > 0;
      case 2: return rows.length > 0 && rows.every((r) => r.jobStep && r.controls);
      default: return true;
    }
  }

  async function handleSubmit(asDraft: boolean) {
    if (!intelligence || !currentUser) return;
    const now = new Date().toISOString();
    const facility = facilities?.find((f) => f.id === facilityId);
    const serial = `JSA-${facility?.shortCode ?? 'NNPC'}-2026-${String(Date.now()).slice(-4)}`;
    const status = asDraft ? 'draft' : 'fscReview';

    const jsa = await createJSA.mutateAsync({
      id: `jsa-${Date.now()}`,
      serialNo: serial,
      applicantId: currentUser.id,
      inHouseOrContractor: inHouse,
      emergencyNo: '0700-NNPC-HSE (0700-6672-473)',
      jobDescription,
      facilityId,
      assetId,
      locationId,
      natureOfWork: selectedWorkTypes,
      scheduledStart: new Date(scheduledStart).toISOString(),
      scheduledEnd: new Date(scheduledEnd).toISOString(),
      riskCategory: intelligence.riskCategory,
      requiredPPE: intelligence.requiredPPE,
      requiredCertificates: intelligence.requiredCertificates,
      requiredDocuments: intelligence.requiredDocuments,
      gasTestRequired: intelligence.gasTestRequired,
      isolationRequired: intelligence.isolationRequired,
      simopsRequired: intelligence.simopsRequired,
      toolboxTalkRequired: intelligence.toolboxTalkRequired,
      rows,
      stopWorkConditions: stopWork,
      comments,
      status,
      fscReviewedBy: null,
      fscReviewedAt: null,
      hseApprovedBy: null,
      hseApprovedAt: null,
      permitId: null,
      createdAt: now,
      updatedAt: now,
      history: [
        { stage: 'draft', at: now, byUserId: currentUser.id, note: 'JSA prepared by job owner' },
        ...(asDraft ? [] : [{ stage: 'fscReview', at: now, byUserId: currentUser.id, note: 'Submitted for FSC Owner review' }]),
      ],
    });

    await createAudit.mutateAsync({
      id: `aud-${Date.now()}`,
      permitId: jsa.id,
      actorId: currentUser.id,
      action: asDraft ? 'jsa_saved_draft' : 'jsa_submitted',
      detail: `${serial} ${asDraft ? 'saved as draft' : 'submitted for FSC review'}`,
      at: now,
    });

    if (!asDraft) {
      await createNotif.mutateAsync({
        id: `ntf-${Date.now()}`,
        role: 'FSC Owner',
        permitId: jsa.id,
        message: `${serial}: JSA submitted for your review — ${jobDescription.slice(0, 60)}`,
        read: false,
        createdAt: now,
      });
    }

    navigate(`/jsas/${jsa.id}`);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Start Job Safety Analysis</h1>
        <p className="text-sm text-muted-foreground">Every PTW starts with an approved JSA. Fill the NNPC JSA in-platform — the permit is raised after approval.</p>
      </div>

      {/* Stepper */}
      <div className="flex flex-wrap items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                i === step ? 'bg-primary text-primary-foreground'
                : i < step ? 'bg-nnpc-green-light text-nnpc-green-dark'
                : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < step ? <Check size={12} /> : <span className="w-4 text-center">{i + 1}</span>}
              <span>{s}</span>
            </button>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 0: Job details */}
      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>Job & Location Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Facility</label>
                <select
                  value={facilityId}
                  onChange={(e) => { setFacilityId(e.target.value); setAssetId(''); setLocationId(''); }}
                  className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                >
                  <option value="">Select facility...</option>
                  {facilities?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">In-House / Contractor</label>
                <select
                  value={inHouse}
                  onChange={(e) => setInHouse(e.target.value as 'In-House' | 'Contractor')}
                  className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                >
                  <option value="In-House">In-House</option>
                  <option value="Contractor">Contractor</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Asset / Equipment</label>
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                  disabled={!facilityId}
                >
                  <option value="">Select asset...</option>
                  {assets?.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Work Location</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                  disabled={!facilityId}
                >
                  <option value="">Select location...</option>
                  {locations?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Scheduled Start</label>
                <input
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Scheduled End</label>
                <input
                  type="datetime-local"
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
                  className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                />
              </div>
            </div>
            <Textarea
              label="Job Description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Describe the job to be performed..."
            />
          </CardContent>
        </Card>
      )}

      {/* Step 1: Nature of Work */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Nature of Work (select one or more — the JSA auto-populates)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {rules?.map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggleWorkType(r.id)}
                  className={`p-3 rounded-lg border text-left text-sm transition-colors cursor-pointer ${
                    selectedWorkTypes.includes(r.id)
                      ? 'border-primary bg-nnpc-green-light text-nnpc-green-dark font-medium'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{r.label}</span>
                    {selectedWorkTypes.includes(r.id) && <Check size={16} className="text-primary" />}
                  </div>
                  <span className={`text-xs ${r.baseRiskCategory === 'Critical' || r.baseRiskCategory === 'High' ? 'text-nnpc-red' : r.baseRiskCategory === 'Medium' ? 'text-nnpc-gold' : 'text-muted-foreground'}`}>
                    {r.baseRiskCategory} Risk
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: JSA Form */}
      {step === 2 && intelligence && (
        <div className="space-y-4">
          {/* Requirements summary */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={intelligence.riskCategory === 'Critical' || intelligence.riskCategory === 'High' ? 'destructive' : intelligence.riskCategory === 'Medium' ? 'warning' : 'success'}>
                  {intelligence.riskCategory} Risk
                </Badge>
                {intelligence.gasTestRequired && <Badge variant="warning">Gas Test Required</Badge>}
                {intelligence.isolationRequired && <Badge variant="warning">Isolation / LOTO Required</Badge>}
                {intelligence.toolboxTalkRequired && <Badge variant="secondary">Toolbox Talk Required</Badge>}
              </div>
              {intelligence.simopsRequired ? (
                <div className="flex items-center gap-2 text-sm text-nnpc-red">
                  <AlertTriangle size={16} />
                  SIMOPS conflict detected with another permit at this location — SIMOPS assessment will be required.
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-nnpc-green font-medium">
                  <ShieldCheck size={16} />
                  No SIMOPS conflict detected at this location and time.
                  {!intelligence.isolationRequired && ' No isolation required.'}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>JSA Hazard Analysis (auto-populated — edit as needed)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <JSAFormTable rows={rows} onChange={setRows} />
              <Textarea
                label="Stop Work Conditions"
                value={stopWork}
                onChange={(e) => setStopWork(e.target.value)}
              />
              <Textarea
                label="Comments (optional)"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Any additional comments..."
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && intelligence && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Review & Submit JSA</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid sm:grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Facility:</span> {facilities?.find((f) => f.id === facilityId)?.name}</div>
                <div><span className="text-muted-foreground">Asset:</span> {assets?.find((a) => a.id === assetId)?.name}</div>
                <div><span className="text-muted-foreground">Location:</span> {locations?.find((l) => l.id === locationId)?.name}</div>
                <div><span className="text-muted-foreground">Execution:</span> {inHouse}</div>
                <div><span className="text-muted-foreground">Schedule:</span> {new Date(scheduledStart).toLocaleString()} → {new Date(scheduledEnd).toLocaleString()}</div>
                <div><span className="text-muted-foreground">Work Types:</span> {selectedWorkTypes.map((id) => rules?.find((r) => r.id === id)?.label).join(', ')}</div>
              </div>
              <p className="pt-2 border-t border-border"><span className="text-muted-foreground">Job:</span> {jobDescription}</p>
              <p><span className="text-muted-foreground">JSA steps:</span> {rows.length} job steps analysed</p>
              <p className="text-xs text-muted-foreground pt-2">
                On submission, this JSA goes to the <strong>FSC Owner</strong> for review, then to the <strong>HSE Officer</strong> for endorsement.
                Once approved it returns to you to raise the Permit to Work.
              </p>
            </CardContent>
          </Card>
          <JSAFormTable rows={rows} onChange={setRows} readOnly />
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
            Next
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSubmit(true)} disabled={createJSA.isPending}>
              Save as Draft
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={createJSA.isPending}>
              {createJSA.isPending ? 'Submitting...' : 'Submit for FSC Review'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
