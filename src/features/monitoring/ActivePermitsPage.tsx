import { usePermits } from '@/shared/api/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { StatusBadge } from '@/shared/ui/status-badge';
import { Link } from 'react-router-dom';

export function ActivePermitsPage() {
  const { data: permits, isLoading } = usePermits();
  const active = permits?.filter((p) => p.status === 'active' || p.status === 'suspended') ?? [];

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Active Permits</h1>
      <Card>
        <CardHeader>
          <CardTitle>Currently Active & Suspended ({active.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="text-muted-foreground">No active permits.</p>
          ) : (
            <div className="space-y-2">
              {active.map((p) => (
                <Link
                  key={p.id}
                  to={`/permits/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div>
                    <span className="font-medium text-sm">{p.permitNumber}</span>
                    <span className="text-muted-foreground text-sm ml-2">{p.natureOfWork.join(', ')}</span>
                  </div>
                  <StatusBadge status={p.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
