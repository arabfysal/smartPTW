import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { usePermitActions } from '@/shared/hooks/usePermitActions';
import { useAppStore } from '@/shared/store';
import { useJSA } from '@/shared/api/queries';
import type { Permit } from '@/entities/types';
import { canPerform } from '@/shared/permissions';
import { Check, Clock, FilePen } from 'lucide-react';

const ACCEPTANCE_ITEMS = [
  'I have reviewed the permit scope, JSA and all attached conditions',
  'Hazards and recommended controls are understood by my work team',
  'Isolation / LOTO and gas testing requirements are confirmed where applicable',
  'Emergency and rescue procedures are understood; muster points identified',
  'Toolbox talk will be conducted with all personnel before work starts',
  'PPE requirements are confirmed and available for all personnel',
  'I agree to abide by all NNPC Limited HSE regulations, policies and site rules',
  'I acknowledge the Stop Work Authority of any NNPC personnel on this job',
  'I understand this permit is automatically SUSPENDED daily at 18:00 (6:00 PM) and work must stop',
  'I will revalidate the permit with the FSC Owner each morning before resuming work',
];

export function ContractorAcceptancePanel({ permit }: { permit: Permit }) {
  const role = useAppStore((s) => s.currentRole);
  const currentUser = useAppStore((s) => s.currentUser);
  const { transitionPermit, createSubRecord, isPending } = usePermitActions();
  const { data: jsa } = useJSA(permit.jsaId);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [signatureName, setSignatureName] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const canSign = canPerform(permit.status, role, 'contractor_accept_sign');
  const allAccepted = accepted.length === ACCEPTANCE_ITEMS.length;
  const amendments = jsa?.comments?.trim();

  function toggle(item: string) {
    setAccepted((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
  }

  async function handleSign() {
    await createSubRecord('contractorAcceptances', {
      id: `ca-${Date.now()}`,
      permitId: permit.id,
      contractorId: currentUser?.id ?? '',
      acceptedItems: accepted,
      signedAt: new Date().toISOString(),
    });
    await transitionPermit(permit, 'finalApproval', 'contractor_accepted',
      `Contractor accepted all permit terms (incl. NNPC policies & daily 18:00 suspension) — signed by ${signatureName}`,
      ['FSC Owner']);
  }

  if (!canSign) {
    return (
      <Card>
        <CardHeader><CardTitle>Contractor Acceptance</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">Awaiting Contractor / Performing Authority review and signature.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Contractor Acceptance & Signature</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-nnpc-gold/10 border border-nnpc-gold/40 rounded-lg p-3 flex items-start gap-2 text-sm">
          <Clock size={16} className="text-nnpc-gold shrink-0 mt-0.5" />
          <p>
            <span className="font-medium">NNPC daily suspension policy:</span> all permits are suspended at
            <span className="font-semibold"> 18:00 (6:00 PM)</span> every day. Work must stop, and the permit is
            revalidated with the FSC Owner the next morning before work resumes.
          </p>
        </div>

        {amendments && (
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 font-medium text-blue-900 mb-1">
              <FilePen size={15} /> Reviewer amendments appended to the JSA — accepted with your signature below:
            </div>
            <p className="text-xs text-blue-900/80 whitespace-pre-line">{amendments}</p>
          </div>
        )}

        <div className="space-y-2">
          {ACCEPTANCE_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => toggle(item)}
              className="flex items-center gap-3 w-full p-2 rounded border border-border text-sm text-left hover:bg-muted transition-colors cursor-pointer"
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${accepted.includes(item) ? 'bg-nnpc-green text-white' : 'border-2 border-muted-foreground/30'}`}>
                {accepted.includes(item) && <Check size={12} />}
              </div>
              <span>{item}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Digital Signature (Type your full name)</label>
          <input
            value={signatureName}
            onChange={(e) => setSignatureName(e.target.value)}
            placeholder="Full name as digital signature"
            className="h-9 rounded-md border border-input bg-card px-3 text-sm italic"
          />
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" className="rounded" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
          I confirm I have reviewed and accepted all permit conditions on behalf of my company
        </label>

        <Button onClick={handleSign} disabled={isPending || !allAccepted || !signatureName || !confirmed}>
          Sign & Accept Permit
        </Button>
      </CardContent>
    </Card>
  );
}
