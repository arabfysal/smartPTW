import { useState, useMemo } from 'react';
import { useAuditTrail, useUsers } from '@/shared/api/queries';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Search, Filter } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  permit_created: 'bg-nnpc-green-light text-nnpc-green-dark',
  jsa_endorsed: 'bg-blue-100 text-blue-800',
  jsa_amendment_requested: 'bg-nnpc-gold/20 text-nnpc-gold',
  validation_passed: 'bg-nnpc-green-light text-nnpc-green',
  validation_failed: 'bg-red-100 text-nnpc-red',
  hse_approved: 'bg-nnpc-green-light text-nnpc-green',
  hse_rejected: 'bg-red-100 text-nnpc-red',
  operational_review_closed: 'bg-blue-100 text-blue-800',
  contractor_accepted: 'bg-nnpc-green-light text-nnpc-green',
  permit_activated: 'bg-nnpc-green-light text-nnpc-green-dark',
  permit_suspended: 'bg-red-100 text-nnpc-red',
  permit_completed: 'bg-gray-100 text-gray-800',
  permit_closed: 'bg-gray-100 text-gray-800',
};

export function AuditTrailPage() {
  const { data: entries, isLoading } = useAuditTrail();
  const { data: users } = useUsers();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users?.forEach((u) => map.set(u.id, u.name));
    return map;
  }, [users]);

  const actions = useMemo(() => {
    if (!entries) return [];
    return [...new Set(entries.map((e) => e.action))].sort();
  }, [entries]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    return entries
      .filter((e) => {
        if (actionFilter && e.action !== actionFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            e.permitId.toLowerCase().includes(q) ||
            e.action.toLowerCase().includes(q) ||
            e.detail.toLowerCase().includes(q) ||
            (userMap.get(e.actorId) ?? '').toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [entries, search, actionFilter, userMap]);

  if (isLoading) return <div className="text-muted-foreground">Loading audit trail...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Trail</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by permit, action, detail, or actor..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm min-w-[180px]"
          >
            <option value="">All Actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} entries</p>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Time</th>
                  <th className="text-left p-3 font-medium">Permit</th>
                  <th className="text-left p-3 font-medium">Actor</th>
                  <th className="text-left p-3 font-medium">Action</th>
                  <th className="text-left p-3 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{new Date(e.at).toLocaleString()}</td>
                    <td className="p-3 font-medium">{e.permitId}</td>
                    <td className="p-3 text-muted-foreground">{userMap.get(e.actorId) ?? e.actorId}</td>
                    <td className="p-3">
                      <Badge className={ACTION_COLORS[e.action] ?? 'bg-muted text-foreground'}>
                        {e.action.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">{e.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No matching entries found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
