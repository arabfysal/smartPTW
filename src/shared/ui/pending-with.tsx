import { UserCheck } from 'lucide-react';
import type { Role } from '@/entities/types';

/** Shows who a JSA/permit is currently waiting on — visible to everyone, especially the applicant */
export function PendingWith({ pending, actorName }: { pending: { role: Role | null; label: string }; actorName?: string }) {
  return (
    <div className="inline-flex items-center gap-2 bg-nnpc-gold/15 border border-nnpc-gold/40 rounded-full px-3 py-1.5 text-xs">
      <UserCheck size={14} className="text-nnpc-gold shrink-0" />
      <span className="font-medium text-foreground">
        {pending.role ? `Pending with: ${pending.role}` : 'No action pending'}
        {actorName && pending.role ? ` (${actorName})` : ''}
      </span>
      <span className="text-muted-foreground hidden sm:inline">— {pending.label}</span>
    </div>
  );
}
