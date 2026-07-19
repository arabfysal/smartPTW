import { useJSAs, useFacilities, useUsers } from '@/shared/api/queries';
import { Card, CardContent } from '@/shared/ui/card';
import { StatusBadge } from '@/shared/ui/status-badge';
import { jsaPendingWith } from '@/shared/state-machine/permitMachine';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/shared/store';

export function JSAsListPage() {
  const { data: jsas, isLoading } = useJSAs();
  const { data: facilities } = useFacilities();
  const { data: users } = useUsers();
  const role = useAppStore((s) => s.currentRole);

  if (isLoading) return <div className="text-muted-foreground">Loading JSAs...</div>;

  const sorted = jsas?.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Safety Analyses</h1>
          <p className="text-sm text-muted-foreground">The PTW process starts here — a permit can only be raised from an approved JSA.</p>
        </div>
        {role === 'Applicant' && (
          <Link
            to="/jsas/create"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-nnpc-green px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            + Start JSA
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Serial No</th>
                  <th className="text-left p-3 font-medium">Job Description</th>
                  <th className="text-left p-3 font-medium">Facility</th>
                  <th className="text-left p-3 font-medium">Risk</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Pending With</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((j) => {
                  const pending = jsaPendingWith(j.status);
                  const actor = users?.find((u) => u.role === pending.role);
                  return (
                    <tr key={j.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <Link to={`/jsas/${j.id}`} className="text-primary font-medium hover:underline whitespace-nowrap">
                          {j.serialNo}
                        </Link>
                      </td>
                      <td className="p-3 text-muted-foreground max-w-xs truncate">{j.jobDescription}</td>
                      <td className="p-3 text-muted-foreground">{facilities?.find((f) => f.id === j.facilityId)?.shortCode}</td>
                      <td className="p-3">
                        <span className={`text-xs font-medium ${j.riskCategory === 'Critical' || j.riskCategory === 'High' ? 'text-nnpc-red' : j.riskCategory === 'Medium' ? 'text-nnpc-gold' : 'text-nnpc-green'}`}>
                          {j.riskCategory}
                        </span>
                      </td>
                      <td className="p-3"><StatusBadge status={j.status} /></td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        {pending.role ? `${pending.role}${actor ? ` (${actor.name})` : ''}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {sorted.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No JSAs yet — start one to begin the PTW process.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
