import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { usePermits } from '@/shared/api/queries';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

const COLORS = ['#00843D', '#00532E', '#FDB913', '#C8102E', '#6B7280', '#3B82F6', '#10B981', '#8B5CF6'];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  hseReview: 'HSE Review',
  fscOperationalReview: 'Op Review',
  contractorAcceptance: 'Acceptance',
  finalApproval: 'Final Approval',
  active: 'Active',
  suspended: 'Suspended',
  completionPending: 'Completion (HSE)',
  fscCloseout: 'FSC Closeout',
  closed: 'Closed',
};

export function AnalyticsPage() {
  const { data: permits, isLoading } = usePermits();

  const statusData = useMemo(() => {
    if (!permits) return [];
    const counts: Record<string, number> = {};
    permits.forEach((p) => { counts[p.status] = (counts[p.status] ?? 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS[status] ?? status,
      count,
    }));
  }, [permits]);

  const riskData = useMemo(() => {
    if (!permits) return [];
    const counts: Record<string, number> = {};
    permits.forEach((p) => { counts[p.riskCategory] = (counts[p.riskCategory] ?? 0) + 1; });
    return Object.entries(counts).map(([risk, count]) => ({ name: risk, value: count }));
  }, [permits]);

  const workTypeData = useMemo(() => {
    if (!permits) return [];
    const counts: Record<string, number> = {};
    permits.forEach((p) => p.natureOfWork.forEach((w) => { counts[w] = (counts[w] ?? 0) + 1; }));
    return Object.entries(counts).map(([type, count]) => ({ name: type, count })).sort((a, b) => b.count - a.count);
  }, [permits]);

  const timelineData = useMemo(() => {
    if (!permits) return [];
    const byMonth: Record<string, number> = {};
    permits.forEach((p) => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] ?? 0) + 1;
    });
    return Object.entries(byMonth).sort().map(([month, count]) => ({ month, count }));
  }, [permits]);

  const flagStats = useMemo(() => {
    if (!permits) return { gas: 0, iso: 0, simops: 0, total: 0 };
    return {
      gas: permits.filter((p) => p.gasTestRequired).length,
      iso: permits.filter((p) => p.isolationRequired).length,
      simops: permits.filter((p) => p.simopsRequired).length,
      total: permits.length,
    };
  }, [permits]);

  if (isLoading) return <div className="text-muted-foreground">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Permit Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{flagStats.total}</p>
            <p className="text-sm text-muted-foreground">Total Permits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-nnpc-gold">{flagStats.gas}</p>
            <p className="text-sm text-muted-foreground">Gas Test Required</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-nnpc-green">{flagStats.iso}</p>
            <p className="text-sm text-muted-foreground">Isolation Required</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-nnpc-red">{flagStats.simops}</p>
            <p className="text-sm text-muted-foreground">SIMOPS Required</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Permits by Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={80} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#00843D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Risk Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {riskData.map((_entry, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Work Types</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workTypeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#FDB913" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Permits Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#00843D" strokeWidth={2} dot={{ fill: '#00843D' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
