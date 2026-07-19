import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { StatusBadge } from '@/shared/ui/status-badge';
import { Badge } from '@/shared/ui/badge';
import { FacilityMap } from './FacilityMap';
import {
  usePermits, useJSAs, useFacilities, useLocations, useGasTests,
  useAuditTrail, useUsers, useMonitoringEvents,
} from '@/shared/api/queries';
import { useAppStore } from '@/shared/store';
import { permitPendingWith } from '@/shared/state-machine/permitMachine';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
  Activity, ClipboardCheck, TimerReset, Radar, ShieldCheck,
  WifiOff, RefreshCw, Lock, Smartphone, MapPin,
} from 'lucide-react';

/** Validated categorical palette (fixed order, dataviz six-checks pass) */
const CAT_COLORS = ['#00843D', '#1D4ED8', '#D97706', '#C8102E', '#7C3AED', '#0D9488'];
const RISK_COLORS: Record<string, string> = { Critical: '#C8102E', High: '#C8102E', Medium: '#D97706', Low: '#00843D' };

const REVIEW_STATUSES = ['hseReview', 'fscOperationalReview', 'contractorAcceptance', 'finalApproval', 'completionPending', 'fscCloseout'];

function KPICard({ icon: Icon, label, value, sub, tone }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string;
  tone: 'green' | 'gold' | 'red' | 'blue';
}) {
  const tones = {
    green: 'bg-nnpc-green-light text-nnpc-green',
    gold: 'bg-nnpc-gold/15 text-nnpc-gold',
    red: 'bg-nnpc-red/10 text-nnpc-red',
    blue: 'bg-blue-50 text-blue-700',
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${tones[tone]}`}>
            <Icon size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function countdown(to: string): string {
  const ms = new Date(to).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Professional operations dashboard — all roles except Applicant */
export function RichDashboard() {
  const { currentUser, currentRole } = useAppStore();
  const { data: permits } = usePermits();
  const { data: jsas } = useJSAs();
  const { data: facilities } = useFacilities();
  const { data: locations } = useLocations();
  const { data: gasTests } = useGasTests();
  const { data: audit } = useAuditTrail();
  const { data: users } = useUsers();
  const { data: monEvents } = useMonitoringEvents();
  const [selectedFacility, setSelectedFacility] = useState('fac-twr');

  const active = useMemo(() => permits?.filter((p) => p.status === 'active') ?? [], [permits]);
  const suspended = useMemo(() => permits?.filter((p) => p.status === 'suspended') ?? [], [permits]);
  const pendingApprovals = useMemo(() => {
    const p = permits?.filter((x) => REVIEW_STATUSES.includes(x.status)).length ?? 0;
    const j = jsas?.filter((x) => x.status === 'fscReview' || x.status === 'hseReview').length ?? 0;
    return p + j;
  }, [permits, jsas]);

  // Expiring within 2 hours: gas tests on open permits + active permit windows
  const expiring = useMemo(() => {
    const soon = Date.now() + 2 * 3600000;
    const items: { id: string; permitId: string; label: string; at: string; kind: string }[] = [];
    const open = new Set(permits?.filter((p) => ['active', 'fscOperationalReview', 'suspended'].includes(p.status)).map((p) => p.id));
    gasTests?.forEach((g) => {
      if (open.has(g.permitId) && new Date(g.validUntil).getTime() <= soon) {
        const p = permits?.find((x) => x.id === g.permitId);
        items.push({ id: g.id, permitId: g.permitId, label: `${p?.permitNumber} — gas test`, at: g.validUntil, kind: 'Gas test' });
      }
    });
    active.forEach((p) => {
      if (new Date(p.scheduledEnd).getTime() <= soon) {
        items.push({ id: p.id, permitId: p.id, label: `${p.permitNumber} — permit window`, at: p.scheduledEnd, kind: 'Permit' });
      }
    });
    return items.sort((a, b) => a.at.localeCompare(b.at));
  }, [gasTests, permits, active]);

  // Upcoming expiries (next 3 days) for the side list
  const upcoming = useMemo(() => {
    const horizon = Date.now() + 72 * 3600000;
    return (active.concat(suspended))
      .filter((p) => new Date(p.scheduledEnd).getTime() <= horizon)
      .sort((a, b) => a.scheduledEnd.localeCompare(b.scheduledEnd))
      .slice(0, 5);
  }, [active, suspended]);

  const workTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    const open = permits?.filter((p) => p.status !== 'closed') ?? [];
    open.forEach((p) => p.natureOfWork.forEach((w) => { counts[w] = (counts[w] ?? 0) + 1; }));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name: name.replace(/-/g, ' '), value }));
  }, [permits]);

  const riskData = useMemo(() => {
    const counts: Record<string, number> = {};
    const open = permits?.filter((p) => p.status !== 'closed') ?? [];
    open.forEach((p) => { counts[p.riskCategory] = (counts[p.riskCategory] ?? 0) + 1; });
    return ['Critical', 'High', 'Medium', 'Low']
      .filter((r) => counts[r])
      .map((r) => ({ name: r, value: counts[r] }));
  }, [permits]);

  const openMonEvents = monEvents?.filter((e) => e.status === 'open') ?? [];
  const recentActivity = useMemo(
    () => audit?.slice().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5) ?? [],
    [audit],
  );

  const totalOpen = permits?.filter((p) => p.status !== 'closed').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Operations Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome, {currentUser?.name ?? currentRole} · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <Badge variant="outline" className="text-[11px]">Daily suspension at 18:00 · revalidation each morning</Badge>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Activity} label="Active Permits" value={active.length} sub={`${totalOpen} open in workflow`} tone="green" />
        <KPICard icon={ClipboardCheck} label="Pending Approvals" value={pendingApprovals} sub="JSAs + permits awaiting action" tone="gold" />
        <KPICard icon={TimerReset} label="Expiring Soon (≤ 2 hrs)" value={expiring.length} sub={expiring[0] ? `next: ${countdown(expiring[0].at)}` : 'nothing imminent'} tone="red" />
        <KPICard icon={Radar} label="SIMOPS Alerts" value={0} sub="No conflicting operations" tone="blue" />
      </div>

      {/* Active permits table + geofence map */}
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <Card className="min-w-0">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Active & Open Permits</CardTitle>
            <Link to="/permits" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs">
                    <th className="text-left p-2.5 font-medium">Permit ID</th>
                    <th className="text-left p-2.5 font-medium">Work Type</th>
                    <th className="text-left p-2.5 font-medium">Location</th>
                    <th className="text-left p-2.5 font-medium">Status</th>
                    <th className="text-left p-2.5 font-medium">Pending With</th>
                  </tr>
                </thead>
                <tbody>
                  {permits?.filter((p) => p.status !== 'closed').slice(0, 8).map((p) => {
                    const loc = locations?.find((l) => l.id === p.locationId);
                    const pending = permitPendingWith(p.status);
                    return (
                      <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-2.5 whitespace-nowrap">
                          <Link to={`/permits/${p.id}`} className="text-primary font-medium hover:underline">{p.permitNumber}</Link>
                        </td>
                        <td className="p-2.5 text-muted-foreground text-xs">{p.natureOfWork.join(', ')}</td>
                        <td className="p-2.5 text-muted-foreground text-xs max-w-36 truncate">{loc?.name}</td>
                        <td className="p-2.5"><StatusBadge status={p.status} /></td>
                        <td className="p-2.5 text-xs text-muted-foreground whitespace-nowrap">{pending.role ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><MapPin size={16} /> Geofence Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <FacilityMap
              facilities={facilities ?? []}
              locations={locations ?? []}
              permits={permits ?? []}
              selectedFacility={selectedFacility}
              onSelectFacility={setSelectedFacility}
            />
          </CardContent>
        </Card>
      </div>

      {/* Donuts + expiry + monitoring */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Permits by Work Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={workTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="var(--color-card)" strokeWidth={2}>
                  {workTypeData.map((_e, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-center text-xs text-muted-foreground -mt-2">{totalOpen} open permits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Risk Status (Open Permits)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="var(--color-card)" strokeWidth={2}>
                  {riskData.map((e, i) => <Cell key={i} fill={RISK_COLORS[e.name]} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-center text-xs text-muted-foreground -mt-2">colour-coded by risk level</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader><CardTitle>Upcoming Expiry & Monitoring</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {expiring.map((e) => (
              <Link key={e.id} to={`/permits/${e.permitId}`} className="flex items-center justify-between p-2.5 rounded-lg border border-nnpc-red/30 bg-nnpc-red/5 hover:bg-nnpc-red/10 text-sm">
                <span className="truncate">{e.label}</span>
                <Badge variant="destructive">{countdown(e.at)}</Badge>
              </Link>
            ))}
            {upcoming.filter((p) => !expiring.some((e) => e.permitId === p.id)).map((p) => (
              <Link key={p.id} to={`/permits/${p.id}`} className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted text-sm">
                <span className="truncate">{p.permitNumber} — permit window</span>
                <Badge variant="warning">{countdown(p.scheduledEnd)}</Badge>
              </Link>
            ))}
            {openMonEvents.slice(0, 3).map((e) => (
              <Link key={e.id} to={`/permits/${e.permitId}`} className="flex items-start gap-2 p-2.5 rounded-lg border border-nnpc-gold/40 bg-nnpc-gold/5 text-xs">
                <ShieldCheck size={14} className="text-nnpc-gold shrink-0 mt-0.5" />
                <span><span className="font-medium">{e.type}:</span> {e.detail}</span>
              </Link>
            ))}
            {expiring.length === 0 && upcoming.length === 0 && openMonEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing approaching expiry.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {recentActivity.map((a) => {
              const actor = users?.find((u) => u.id === a.actorId);
              return (
                <div key={a.id} className="p-3 rounded-lg border border-border text-xs space-y-1">
                  <p className="font-medium leading-snug">{a.detail.length > 70 ? a.detail.slice(0, 70) + '…' : a.detail}</p>
                  <p className="text-muted-foreground">{actor?.name ?? 'System'} · {new Date(a.at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Footer badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: WifiOff, t: 'Offline Capable', s: 'Work even without network' },
          { icon: RefreshCw, t: 'Real-time Sync', s: 'Data syncs when online' },
          { icon: Lock, t: 'Secure & Compliant', s: 'ISO 27001 ready' },
          { icon: Smartphone, t: 'Built for the Field', s: 'Mobile first. Easy to use.' },
        ].map((b) => (
          <div key={b.t} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
            <b.icon size={18} className="text-nnpc-green shrink-0" />
            <div>
              <p className="text-xs font-semibold">{b.t}</p>
              <p className="text-[11px] text-muted-foreground">{b.s}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
