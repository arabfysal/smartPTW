import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { StatusBadge } from '@/shared/ui/status-badge';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { usePermits, useGasTests, useMonitoringEvents, useLocations, useCreateAuditEntry } from '@/shared/api/queries';
import { usePermitActions } from '@/shared/hooks/usePermitActions';
import { useAppStore } from '@/shared/store';
import { ShieldCheck, TimerReset, Activity, CheckCircle2 } from 'lucide-react';

function countdown(to: string): { label: string; expired: boolean } {
  const ms = new Date(to).getTime() - Date.now();
  if (ms <= 0) return { label: 'EXPIRED', expired: true };
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return { label: h > 0 ? `${h}h ${m}m left` : `${m}m left`, expired: false };
}

/** Live monitoring — visible to every role. Gas-test expiry countdowns, open events, active/suspended permits. */
export function MonitoringPage() {
  const { data: permits } = usePermits();
  const { data: gasTests } = useGasTests();
  const { data: events } = useMonitoringEvents();
  const { data: locations } = useLocations();
  const role = useAppStore((s) => s.currentRole);
  const currentUser = useAppStore((s) => s.currentUser);
  const { updateSubRecord, notify, isPending } = usePermitActions();
  const createAudit = useCreateAuditEntry();

  const canResolve = role === 'HSE Officer' || role === 'FSC Owner';

  async function handleResolve(eventId: string, type: string, permitId: string) {
    const p = permits?.find((x) => x.id === permitId);
    await updateSubRecord('monitoringEvents', eventId, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    } as never);
    await createAudit.mutateAsync({
      permitId,
      actorId: currentUser?.id ?? '',
      action: 'monitoring_event_resolved',
      detail: `${type} resolved by ${role}`,
      at: new Date().toISOString(),
    });
    await notify(
      ['Applicant', 'Contractor', 'FSC Owner', 'HSE Officer'].filter((r) => r !== role),
      permitId,
      `${p?.permitNumber ?? permitId}: monitoring event "${type}" resolved by ${role}.`,
    );
  }

  const watched = useMemo(
    () => permits?.filter((p) => ['active', 'suspended', 'fscOperationalReview'].includes(p.status)) ?? [],
    [permits],
  );
  const openEvents = events?.filter((e) => e.status === 'open') ?? [];

  const gasWatch = useMemo(() => {
    const ids = new Set(watched.map((p) => p.id));
    return gasTests?.filter((g) => ids.has(g.permitId))
      .sort((a, b) => a.validUntil.localeCompare(b.validUntil)) ?? [];
  }, [gasTests, watched]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Work Monitoring</h1>
        <p className="text-sm text-muted-foreground">
          Live view of active work, gas-test validity and open monitoring events. Permits suspend daily at 18:00 and revalidate each morning with the FSC Owner.
        </p>
      </div>

      {/* Gas test expiry monitor */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TimerReset size={16} /> Gas Test Validity Monitor</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {gasWatch.length === 0 && <p className="text-sm text-muted-foreground">No gas tests being monitored.</p>}
          {gasWatch.map((g) => {
            const p = permits?.find((x) => x.id === g.permitId);
            const cd = countdown(g.validUntil);
            return (
              <Link key={g.id} to={`/permits/${g.permitId}`} className={`flex items-center justify-between p-3 rounded-lg border text-sm hover:bg-muted ${cd.expired ? 'border-nnpc-red/40 bg-nnpc-red/5' : 'border-border'}`}>
                <div>
                  <span className="font-medium">{p?.permitNumber}</span>
                  <span className="text-muted-foreground text-xs ml-2">
                    O2 {g.readings.o2} · LEL {g.readings.lel} · H2S {g.readings.h2s} · tested {new Date(g.testedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <Badge variant={cd.expired ? 'destructive' : 'warning'}>{cd.label}</Badge>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* Open monitoring events */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck size={16} /> Open Monitoring Events ({openEvents.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {openEvents.length === 0 && <p className="text-sm text-muted-foreground">No open events.</p>}
          {openEvents.map((e) => {
            const p = permits?.find((x) => x.id === e.permitId);
            return (
              <div key={e.id} className="p-3 rounded-lg border border-nnpc-gold/40 bg-nnpc-gold/5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <Link to={`/permits/${e.permitId}`} className="min-w-0 hover:underline">
                    <span className="font-medium">{e.type}</span>
                    <span className="text-xs text-muted-foreground ml-2">{p?.permitNumber}</span>
                  </Link>
                  {canResolve && (
                    <Button size="sm" variant="outline" onClick={() => handleResolve(e.id, e.type, e.permitId)} disabled={isPending}>
                      <CheckCircle2 size={13} className="mr-1" /> Resolve
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{e.detail}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Watched permits */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity size={16} /> Permits Under Monitoring ({watched.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {watched.map((p) => {
            const loc = locations?.find((l) => l.id === p.locationId);
            return (
              <Link key={p.id} to={`/permits/${p.id}`} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted text-sm">
                <div>
                  <span className="font-medium">{p.permitNumber}</span>
                  <span className="text-muted-foreground text-xs ml-2">{loc?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${p.riskCategory === 'Critical' || p.riskCategory === 'High' ? 'text-nnpc-red' : p.riskCategory === 'Medium' ? 'text-nnpc-gold' : 'text-nnpc-green'}`}>{p.riskCategory}</span>
                  <StatusBadge status={p.status} />
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
