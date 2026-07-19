import { usePermits } from '@/shared/api/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { StatusBadge } from '@/shared/ui/status-badge';
import { Link } from 'react-router-dom';

export function AcceptancePage() {
  const { data: permits, isLoading } = usePermits();
  const queue = permits?.filter((p) => p.status === 'contractorAcceptance') ?? [];

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Acceptance Queue</h1>
      <Card>
        <CardHeader>
          <CardTitle>Permits Awaiting My Acceptance ({queue.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <p className="text-muted-foreground">No permits awaiting your acceptance.</p>
          ) : (
            <div className="space-y-2">
              {queue.map((p) => (
                <Link
                  key={p.id}
                  to={`/permits/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <span className="font-medium text-sm">{p.permitNumber}</span>
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
