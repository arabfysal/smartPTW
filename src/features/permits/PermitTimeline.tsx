import { Check, Circle, Minus } from 'lucide-react';

const DISPLAY_STATES = [
  'draft',
  'hseReview',
  'fscOperationalReview',
  'contractorAcceptance',
  'finalApproval',
  'active',
  'completionPending',
  'fscCloseout',
  'closed',
] as const;

const STAGE_LABELS: Record<string, string> = {
  draft: 'Draft (Documents)',
  hseReview: 'HSE Review',
  fscOperationalReview: 'Operational Review',
  contractorAcceptance: 'Contractor Acceptance',
  finalApproval: 'Final Approval (FSC)',
  active: 'Active',
  completionPending: 'Completion (HSE Verify)',
  fscCloseout: 'FSC Closeout',
  closed: 'Closed + Certificate',
};

interface Props {
  currentStatus: string;
  permit: { simopsRequired: boolean; isolationRequired: boolean; gasTestRequired: boolean };
}

export function PermitTimeline({ currentStatus, permit }: Props) {
  // suspended/revalidation map onto the active step for display purposes
  const effective = currentStatus === 'suspended' || currentStatus === 'revalidation' ? 'active' : currentStatus;
  const currentIdx = DISPLAY_STATES.indexOf(effective as typeof DISPLAY_STATES[number]);

  return (
    <div className="space-y-1">
      {DISPLAY_STATES.map((state, stateIdx) => {
        const isCurrent = stateIdx === currentIdx;
        const isPast = stateIdx < currentIdx;
        return (
          <div key={state} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              isCurrent ? 'bg-primary text-primary-foreground' :
              isPast ? 'bg-nnpc-green-light text-nnpc-green' :
              'bg-muted text-muted-foreground'
            }`}>
              {isPast ? <Check size={12} /> : isCurrent ? <Circle size={8} fill="currentColor" /> : <Minus size={8} />}
            </div>
            <span className={`text-sm ${isCurrent ? 'font-medium text-foreground' : isPast ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
              {STAGE_LABELS[state] ?? state}
              {state === 'active' && currentStatus === 'suspended' && <span className="text-nnpc-red font-medium"> (Suspended)</span>}
            </span>
            {state === 'fscOperationalReview' && (
              <div className="ml-2 flex gap-1.5 text-[10px]">
                {permit.simopsRequired && <span className="text-nnpc-gold">SIMOPS</span>}
                {permit.isolationRequired && <span className="text-nnpc-gold">ISO</span>}
                {permit.gasTestRequired && <span className="text-nnpc-gold">GAS</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
