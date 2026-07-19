import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { JSAFormTable } from './JSAFormTable';
import { useUpdateJSA, useCreateAuditEntry } from '@/shared/api/queries';
import { usePermitActions } from '@/shared/hooks/usePermitActions';
import { useAppStore } from '@/shared/store';
import { FilePen, ChevronDown, ChevronUp } from 'lucide-react';
import type { JSA, JSARow, Permit } from '@/entities/types';

interface Props {
  jsa: JSA;
  permit: Permit;
  /** Called after amendments are saved (e.g. to trigger contractor re-acceptance on revalidation) */
  onAmended?: () => void;
  title?: string;
  description?: string;
}

/**
 * Lets the HSE Officer (permit review) or FSC Owner (operational review /
 * daily revalidation) review and edit the already-approved JSA to reflect
 * current-day hazards (weather changes etc.). Amendments are appended to the
 * JSA and the Contractor is notified to accept them.
 */
export function JSAAmendPanel({ jsa, permit, onAmended, title, description }: Props) {
  const role = useAppStore((s) => s.currentRole);
  const currentUser = useAppStore((s) => s.currentUser);
  const updateJSA = useUpdateJSA();
  const createAudit = useCreateAuditEntry();
  const { notify } = usePermitActions();

  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<JSARow[]>(jsa.rows);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    const now = new Date().toISOString();
    const stamp = `[${new Date().toLocaleDateString('en-GB')} — ${role} ${currentUser?.name ?? ''}] ${note}`.trim();
    await updateJSA.mutateAsync({
      id: jsa.id,
      rows,
      comments: jsa.comments ? `${jsa.comments}\n${stamp}` : stamp,
      updatedAt: now,
      history: [
        ...jsa.history,
        { stage: jsa.status, at: now, byUserId: currentUser?.id ?? '', note: `JSA amended by ${role}: ${note || 'hazard rows updated'}` },
      ],
    });
    await createAudit.mutateAsync({
      permitId: permit.id,
      actorId: currentUser?.id ?? '',
      action: 'jsa_amended',
      detail: `${jsa.serialNo} amended by ${role} during ${permit.status}: ${note || 'hazard rows updated'}`,
      at: now,
    });
    await notify(['Contractor', 'Applicant'], permit.id,
      `${permit.permitNumber}: JSA amended by ${role} — review & accept the updated conditions.`);
    setSaved(true);
    onAmended?.();
  }

  return (
    <Card className="border-l-4 border-l-blue-600">
      <CardHeader className="pb-2">
        <button className="flex items-center justify-between w-full cursor-pointer" onClick={() => setOpen((o) => !o)}>
          <CardTitle className="flex items-center gap-2 text-base">
            <FilePen size={16} />
            {title ?? 'Review / Amend Approved JSA'}
          </CardTitle>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {description ?? 'Consider today’s conditions (weather, adjacent activities, site changes). Edit the hazard rows or add steps — the Contractor will be notified to accept your amendments.'}
          </p>
          <JSAFormTable rows={rows} onChange={setRows} />
          <Textarea
            label="Amendment note (what changed & why)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Rain forecast for this afternoon — added slip hazard controls and lightning stop-work trigger..."
          />
          {saved ? (
            <p className="text-sm text-nnpc-green font-medium">Amendments saved — Contractor notified to accept the updated JSA.</p>
          ) : (
            <Button onClick={handleSave} disabled={updateJSA.isPending || !note.trim()}>
              Save Amendments & Notify Contractor
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
