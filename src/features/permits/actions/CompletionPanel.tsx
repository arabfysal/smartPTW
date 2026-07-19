import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { usePermitActions } from '@/shared/hooks/usePermitActions';
import { useAppStore } from '@/shared/store';
import { useCompletionsRecord } from '@/shared/api/queries';
import type { Permit } from '@/entities/types';
import { canPerform } from '@/shared/permissions';
import { Check } from 'lucide-react';

export const COMPLETION_REQUEST_ITEMS = [
  'Work scope completed',
  'Tools & equipment removed',
  'Waste cleared and disposed',
  'Area housekeeping done',
  'Isolations ready for removal',
];
const HSE_VERIFY_ITEMS = [
  'Post-work site visit conducted',
  'Site restored and safe',
  'Isolations removed / normalised',
  'Barricades and signage removed',
  'No residual hazards or environmental issues',
];
const FSC_CLOSEOUT_ITEMS = [
  'HSE verification reviewed',
  'All permit conditions met',
  'Documentation complete',
  'Monitoring events resolved',
  'Records archived — completion certificate issued',
];

export function ChecklistCard({ title, subtitle, items, onComplete, canAct, isPending, buttonLabel, waitingText }: {
  title: string; subtitle?: string; items: string[]; onComplete: (checked: string[]) => void;
  canAct: boolean; isPending: boolean; buttonLabel: string; waitingText?: string;
}) {
  const [checked, setChecked] = useState<string[]>([]);

  function toggle(item: string) {
    setChecked((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
  }

  if (!canAct) {
    return (
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">{waitingText ?? 'Awaiting action.'}</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => toggle(item)}
            className="flex items-center gap-3 w-full p-2 rounded border border-border text-sm text-left transition-colors hover:bg-muted cursor-pointer"
          >
            <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${checked.includes(item) ? 'bg-nnpc-green text-white' : 'border-2 border-muted-foreground/30'}`}>
              {checked.includes(item) && <Check size={12} />}
            </div>
            <span>{item}</span>
          </button>
        ))}
        <Button onClick={() => onComplete(checked)} disabled={isPending || checked.length !== items.length}>
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Completion chain: Contractor/Applicant requested completion → HSE Officer
 * verifies after a site visit → FSC Owner (facility owner) performs the final
 * closeout & archive, which issues the Work Completion Certificate.
 */
export function CompletionPanel({ permit }: { permit: Permit }) {
  const role = useAppStore((s) => s.currentRole);
  const currentUser = useAppStore((s) => s.currentUser);
  const { transitionPermit, createSubRecord, isPending } = usePermitActions();
  const { data: completions } = useCompletionsRecord(permit.id);

  async function handleHSEVerify(checked: string[]) {
    await createSubRecord('siteVerifications', {
      permitId: permit.id,
      verifiedBy: currentUser?.id ?? '',
      checklist: checked.map((item) => ({ item, done: true })),
      verifiedAt: new Date().toISOString(),
    });
    await transitionPermit(permit, 'fscCloseout', 'hse_verified_completion',
      'HSE verified completion on site — awaiting FSC Owner closeout', ['FSC Owner']);
  }

  async function handleFSCCloseout(_checked: string[]) {
    const now = new Date().toISOString();
    await createSubRecord('closeouts', {
      permitId: permit.id,
      hseClosedBy: 'usr-003',
      hseClosedAt: now,
      fscClosedBy: currentUser?.id ?? '',
      fscClosedAt: now,
      archivedRefs: [
        { name: 'Permit Record', type: 'permit', ref: permit.id },
        { name: 'Completion Certificate', type: 'certificate', ref: `${permit.permitNumber}-certificate` },
      ],
    });
    await transitionPermit(permit, 'closed', 'permit_closed',
      'FSC Owner closeout complete — permit archived; completion certificate issued',
      ['Applicant', 'Contractor', 'HSE Officer']);
  }

  if (permit.status === 'completionPending') {
    const request = completions?.[0];
    return (
      <div className="space-y-4">
        {request && (
          <Card>
            <CardContent className="p-4 text-sm">
              <p className="font-medium mb-1">Completion requested — checklist signed by the performing team:</p>
              <div className="flex flex-wrap gap-2">
                {request.checklist.map((c) => (
                  <span key={c.item} className="inline-flex items-center gap-1 text-xs bg-nnpc-green-light text-nnpc-green-dark px-2 py-0.5 rounded">
                    <Check size={11} /> {c.item}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        <ChecklistCard
          title="HSE Completion Verification"
          subtitle="Visit the site and verify before approving. Approval forwards the permit to the FSC Owner for closeout."
          items={HSE_VERIFY_ITEMS}
          onComplete={handleHSEVerify}
          canAct={canPerform(permit.status, role, 'hse_verify_completion')}
          isPending={isPending}
          buttonLabel="Verify & Forward to FSC Owner"
          waitingText="Awaiting HSE Officer post-work site verification."
        />
      </div>
    );
  }

  if (permit.status === 'fscCloseout') {
    return (
      <ChecklistCard
        title="FSC Owner Closeout & Archive"
        subtitle="Final closeout by the facility owner. Closing issues the Work Completion Certificate."
        items={FSC_CLOSEOUT_ITEMS}
        onComplete={handleFSCCloseout}
        canAct={canPerform(permit.status, role, 'fsc_closeout')}
        isPending={isPending}
        buttonLabel="Close Out, Archive & Issue Certificate"
        waitingText="Awaiting FSC Owner final closeout."
      />
    );
  }

  return null;
}
