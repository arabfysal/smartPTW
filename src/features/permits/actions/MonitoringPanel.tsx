import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { usePermitActions } from '@/shared/hooks/usePermitActions';
import { useAppStore } from '@/shared/store';
import { useMonitoringEvents, useCreateAuditEntry } from '@/shared/api/queries';
import type { Permit } from '@/entities/types';
import { canPerform } from '@/shared/permissions';
import { CheckCircle2 } from 'lucide-react';

const EVENT_TYPES = [
  'Gas test expiry approaching',
  'Isolation status change',
  'SIMOPS conflict detected',
  'Weather alert',
  'Shift change',
  'Personnel change',
  'Equipment issue',
  'Safety observation',
];

export function MonitoringPanel({ permit }: { permit: Permit }) {
  const role = useAppStore((s) => s.currentRole);
  const currentUser = useAppStore((s) => s.currentUser);
  const { transitionPermit, createSubRecord, updateSubRecord, notify, isPending } = usePermitActions();
  const createAudit = useCreateAuditEntry();
  const { data: events } = useMonitoringEvents(permit.id);
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [detail, setDetail] = useState('');

  const canMonitor = canPerform(permit.status, role, 'log_inspection');
  const canResolve = canPerform(permit.status, role, 'resolve_event');
  const otherRoles = ['Applicant', 'Contractor', 'FSC Owner', 'HSE Officer'].filter((r) => r !== role);

  async function handleLogEvent() {
    await createSubRecord('monitoringEvents', {
      permitId: permit.id,
      type: eventType,
      detail,
      detectedAt: new Date().toISOString(),
      resolvedAt: '',
      status: 'open',
    });
    await createAudit.mutateAsync({
      permitId: permit.id,
      actorId: currentUser?.id ?? '',
      action: 'monitoring_event_logged',
      detail: `${eventType}: ${detail}`,
      at: new Date().toISOString(),
    });
    await notify(otherRoles, permit.id, `${permit.permitNumber}: monitoring event logged by ${role} — ${eventType}.`);
    setDetail('');
  }

  async function handleResolve(eventId: string, type: string) {
    await updateSubRecord('monitoringEvents', eventId, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    } as never);
    await createAudit.mutateAsync({
      permitId: permit.id,
      actorId: currentUser?.id ?? '',
      action: 'monitoring_event_resolved',
      detail: `${type} resolved by ${role}`,
      at: new Date().toISOString(),
    });
    await notify(otherRoles, permit.id, `${permit.permitNumber}: monitoring event "${type}" resolved by ${role}.`);
  }

  async function handleSuspend() {
    await createSubRecord('monitoringEvents', {
      permitId: permit.id,
      type: eventType,
      detail: `Permit suspended: ${detail}`,
      detectedAt: new Date().toISOString(),
      resolvedAt: '',
      status: 'open',
    });
    await transitionPermit(permit, 'suspended', 'permit_suspended',
      `Suspended by ${role}: ${eventType} — ${detail}`,
      ['Applicant', 'Contractor', 'FSC Owner', 'HSE Officer'].filter((r) => r !== role));
  }

  return (
    <Card>
      <CardHeader><CardTitle>Work Monitoring</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {events && events.length > 0 && (
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="p-2.5 border border-border rounded text-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-medium">{e.type}</span>
                  <p className="text-muted-foreground text-xs">{e.detail}</p>
                  {e.status === 'resolved' && e.resolvedAt && (
                    <p className="text-[11px] text-nnpc-green">Resolved {new Date(e.resolvedAt).toLocaleString()}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={e.status === 'open' ? 'warning' : 'success'}>{e.status}</Badge>
                  {e.status === 'open' && canResolve && (
                    <Button size="sm" variant="outline" onClick={() => handleResolve(e.id, e.type)} disabled={isPending}>
                      <CheckCircle2 size={13} className="mr-1" /> Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {canMonitor && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Event Type</label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="h-9 rounded-md border border-input bg-card px-3 text-sm">
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Textarea label="Details" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Describe the event..." />
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleLogEvent} disabled={isPending || !detail}>Log Inspection Event</Button>
              <Button variant="destructive" onClick={handleSuspend} disabled={isPending || !detail}>Suspend Permit</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
