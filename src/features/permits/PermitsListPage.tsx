import { useState, useMemo } from 'react';
import { usePermits } from '@/shared/api/queries';
import { Card, CardContent } from '@/shared/ui/card';
import { StatusBadge } from '@/shared/ui/status-badge';
import { Input } from '@/shared/ui/input';
import { Link } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';

const STATUS_OPTIONS = [
  'draft', 'hseReview', 'fscOperationalReview', 'contractorAcceptance',
  'finalApproval', 'active', 'suspended', 'completionPending',
  'fscCloseout', 'closed',
];

const RISK_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

export function PermitsListPage() {
  const { data: permits, isLoading } = usePermits();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  const filtered = useMemo(() => {
    if (!permits) return [];
    return permits.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (riskFilter && p.riskCategory !== riskFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.permitNumber.toLowerCase().includes(q) ||
          p.natureOfWork.some((w) => w.toLowerCase().includes(q)) ||
          p.status.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [permits, search, statusFilter, riskFilter]);

  if (isLoading) return <div className="text-muted-foreground">Loading permits...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Permits</h1>
        <Link
          to="/permits/create"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-nnpc-green px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          + New Permit
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search permits..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm"
          >
            <option value="">All Risk</option>
            {RISK_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} of {permits?.length ?? 0} permits</p>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Permit #</th>
                  <th className="text-left p-3 font-medium">Nature of Work</th>
                  <th className="text-left p-3 font-medium">Risk</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <Link to={`/permits/${p.id}`} className="text-primary font-medium hover:underline">
                        {p.permitNumber}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.natureOfWork.join(', ')}</td>
                    <td className="p-3">
                      <span className={`text-xs font-medium ${p.riskCategory === 'Critical' || p.riskCategory === 'High' ? 'text-nnpc-red' : p.riskCategory === 'Medium' ? 'text-nnpc-gold' : 'text-nnpc-green'}`}>
                        {p.riskCategory}
                      </span>
                    </td>
                    <td className="p-3"><StatusBadge status={p.status} /></td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No permits match your filters.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
