import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { StatusBadge } from '@/shared/ui/status-badge';
import { Badge } from '@/shared/ui/badge';
import { useJSAs, usePermits, useUsers, useNotifications, useGasTests } from '@/shared/api/queries';
import { useAppStore } from '@/shared/store';
import { jsaPendingWith, permitPendingWith } from '@/shared/state-machine/permitMachine';
import { FilePlus, ArrowRight, Bell, TimerReset, ClipboardList, FileText } from 'lucide-react';

const JSA_STEPS = ['draft', 'fscReview', 'hseReview', 'approved'];
const PERMIT_STEPS = ['draft', 'hseReview', 'fscOperationalReview', 'contractorAcceptance', 'finalApproval', 'active', 'completionPending', 'fscCloseout', 'closed'];

function StageDots({ steps, current }: { steps: string[]; current: string }) {
  const effective = current === 'suspended' || current === 'revalidation' ? 'active' : current;
  const idx = steps.indexOf(effective);
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <span
          key={s}
          title={s}
          className={`h-1.5 rounded-full transition-all ${
            i < idx ? 'w-3 bg-nnpc-green' : i === idx ? 'w-5 bg-nnpc-gold' : 'w-3 bg-muted'
          }`}
        />
      ))}
    </div>
  );
}

/** Applicant-focused dashboard: my JSAs & permits, what stage they're at, who they're pending with */
export function ApplicantDashboard() {
  const { currentUser, currentRole } = useAppStore();
  const { data: jsas } = useJSAs();
  const { data: permits } = usePermits();
  const { data: users } = useUsers();
  const { data: notifications } = useNotifications(currentUser?.id, currentRole);
  const { data: gasTests } = useGasTests();

  const myJSAs = useMemo(
    () => jsas?.filter((j) => j.applicantId === currentUser?.id && !j.permitId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) ?? [],
    [jsas, currentUser],
  );
  const myPermits = useMemo(
    () => permits?.filter((p) => p.applicantId === currentUser?.id && p.status !== 'closed')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) ?? [],
    [permits, currentUser],
  );

  const actionNeeded = useMemo(() => {
    const items: { to: string; label: string; cta: string }[] = [];
    myJSAs.forEach((j) => {
      if (j.status === 'draft') items.push({ to: `/jsas/${j.id}`, label: `${j.serialNo} — JSA in draft`, cta: 'Complete & submit' });
      if (j.status === 'approved') items.push({ to: `/permits/create?jsa=${j.id}`, label: `${j.serialNo} — JSA approved`, cta: 'Raise PTW now' });
    });
    myPermits.forEach((p) => {
      if (p.status === 'draft') items.push({ to: `/permits/${p.id}`, label: `${p.permitNumber} — documents outstanding`, cta: 'Upload & submit' });
      if (p.status === 'fscOperationalReview') items.push({ to: `/permits/${p.id}`, label: `${p.permitNumber} — gates to submit (SIMOPS/LOTO/gas)`, cta: 'Open permit' });
    });
    return items;
  }, [myJSAs, myPermits]);

  const expiringGas = useMemo(() => {
    const soon = Date.now() + 4 * 3600000;
    const mine = new Set(myPermits.map((p) => p.id));
    return gasTests?.filter((g) => mine.has(g.permitId) && new Date(g.validUntil).getTime() <= soon) ?? [];
  }, [gasTests, myPermits]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Work</h1>
          <p className="text-sm text-muted-foreground">Welcome, {currentUser?.name}. The PTW process starts with a JSA.</p>
        </div>
        <Link
          to="/jsas/create"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-nnpc-green px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <FilePlus size={16} /> Start New JSA
        </Link>
      </div>

      {/* Action needed */}
      {actionNeeded.length > 0 && (
        <Card className="border-l-4 border-l-nnpc-gold">
          <CardHeader><CardTitle>Your Next Actions ({actionNeeded.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {actionNeeded.map((a) => (
              <Link key={a.to + a.label} to={a.to} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted text-sm">
                <span>{a.label}</span>
                <span className="inline-flex items-center gap-1 text-primary font-medium text-xs whitespace-nowrap">{a.cta} <ArrowRight size={13} /></span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Gas test expiry warnings */}
      {expiringGas.map((g) => {
        const p = myPermits.find((x) => x.id === g.permitId);
        const expired = new Date(g.validUntil).getTime() <= Date.now();
        return (
          <Link key={g.id} to={`/permits/${g.permitId}`} className="flex items-center gap-3 p-3 rounded-lg border border-nnpc-red/40 bg-nnpc-red/5 text-sm hover:bg-nnpc-red/10">
            <TimerReset size={18} className="text-nnpc-red shrink-0" />
            <span>
              <span className="font-medium">{p?.permitNumber}: gas test {expired ? 'has EXPIRED' : 'expiring soon'}</span>
              {' '}— valid until {new Date(g.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Arrange a retest.
            </span>
          </Link>
        );
      })}

      {/* My JSAs */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList size={16} /> My JSAs (pre-permit)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {myJSAs.length === 0 && <p className="text-sm text-muted-foreground">No JSAs in progress — start one to begin.</p>}
          {myJSAs.map((j) => {
            const pending = jsaPendingWith(j.status);
            const actor = users?.find((u) => u.role === pending.role);
            return (
              <Link key={j.id} to={`/jsas/${j.id}`} className="block p-3 rounded-lg border border-border hover:bg-muted">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{j.serialNo}</span>
                    <StatusBadge status={j.status} />
                  </div>
                  <StageDots steps={JSA_STEPS} current={j.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{j.jobDescription}</p>
                <p className="text-xs mt-1.5">
                  <span className="text-muted-foreground">Stage:</span> <span className="font-medium">{pending.label}</span>
                  {pending.role && actor && <span className="text-muted-foreground"> · with {actor.name}</span>}
                </p>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* My permits */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText size={16} /> My Permits</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {myPermits.length === 0 && <p className="text-sm text-muted-foreground">No open permits.</p>}
          {myPermits.map((p) => {
            const pending = permitPendingWith(p.status);
            const actor = users?.find((u) => u.role === pending.role);
            return (
              <Link key={p.id} to={`/permits/${p.id}`} className="block p-3 rounded-lg border border-border hover:bg-muted">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{p.permitNumber}</span>
                    <StatusBadge status={p.status} />
                    {(p.riskCategory === 'Critical' || p.riskCategory === 'High') && <Badge variant="destructive">{p.riskCategory}</Badge>}
                  </div>
                  <StageDots steps={PERMIT_STEPS} current={p.status} />
                </div>
                <p className="text-xs mt-1.5">
                  <span className="text-muted-foreground">Stage:</span> <span className="font-medium">{pending.label}</span>
                  {pending.role && actor && <span className="text-muted-foreground"> · with {actor.name}</span>}
                </p>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* Notifications */}
      {notifications && notifications.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell size={16} /> Recent Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {notifications.slice(0, 5).map((n) => (
              <div key={n.id} className={`p-3 rounded-lg text-sm ${n.read ? 'bg-muted/30 text-muted-foreground' : 'bg-nnpc-green-light/30 border border-nnpc-green/20 font-medium'}`}>
                {n.message}
                <span className="block text-xs text-muted-foreground font-normal mt-0.5">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
