import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { usePermitActions } from '@/shared/hooks/usePermitActions';
import { useAppStore } from '@/shared/store';
import type { Permit } from '@/entities/types';
import { canPerform } from '@/shared/permissions';
import { Check } from 'lucide-react';

const HSE_CHECKLIST = [
  'Worksite readiness verified',
  'Personnel competency confirmed',
  'PPE requirements met',
  'Barricading in place',
  'Equipment condition satisfactory',
  'Emergency arrangements confirmed',
  'Environmental controls in place',
  'Gas testing requirements reviewed',
  'Rescue arrangements confirmed',
  'Isolation requirements reviewed',
];

/** HSE Officer can ENDORSE or REJECT the permit — always with comments */
export function HSEReviewPanel({ permit }: { permit: Permit }) {
  const role = useAppStore((s) => s.currentRole);
  const { transitionPermit, createSubRecord, isPending } = usePermitActions();
  const currentUser = useAppStore((s) => s.currentUser);
  const [checklist, setChecklist] = useState(HSE_CHECKLIST.map((item) => ({ item, passed: false })));
  const [comments, setComments] = useState('');

  const canAct = canPerform(permit.status, role, 'hse_endorse');
  const allChecked = checklist.every((c) => c.passed);

  function toggleItem(idx: number) {
    setChecklist((prev) => prev.map((c, i) => i === idx ? { ...c, passed: !c.passed } : c));
  }

  async function handleDecision(decision: 'approved' | 'rejected') {
    await createSubRecord('hseReviews', {
      id: `hse-${Date.now()}`,
      permitId: permit.id,
      inspectorId: currentUser?.id ?? '',
      checklist,
      decision,
      comments,
      reviewedAt: new Date().toISOString(),
    });

    if (decision === 'approved') {
      await transitionPermit(permit, 'fscOperationalReview', 'hse_endorsed',
        `HSE endorsed${comments ? `: ${comments}` : ''} — proceeding to FSC operational review`,
        ['FSC Owner', 'Applicant']);
    } else {
      await transitionPermit(permit, 'draft', 'hse_rejected',
        `HSE rejected: ${comments}`, ['Applicant']);
    }
  }

  if (!canAct) {
    return (
      <Card>
        <CardHeader><CardTitle>HSE Review</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">Awaiting HSE Officer review and endorsement.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>HSE Site Inspection Checklist</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {checklist.map((c, i) => (
            <button
              key={c.item}
              onClick={() => toggleItem(i)}
              className="flex items-center gap-3 w-full p-2 rounded border border-border text-sm text-left hover:bg-muted transition-colors cursor-pointer"
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${c.passed ? 'bg-nnpc-green text-white' : 'border-2 border-muted-foreground/30'}`}>
                {c.passed && <Check size={12} />}
              </div>
              <span className={c.passed ? 'text-muted-foreground' : ''}>{c.item}</span>
            </button>
          ))}
        </div>

        <Textarea label="Comments" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="HSE review comments..." />

        <div className="flex gap-2">
          <Button onClick={() => handleDecision('approved')} disabled={isPending || !allChecked}>
            Endorse Permit
          </Button>
          <Button variant="destructive" onClick={() => handleDecision('rejected')} disabled={isPending || !comments}>
            Reject with Comments
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
