import { useAppStore } from '@/shared/store';
import { usePermits, useJSAs } from '@/shared/api/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { StatusBadge } from '@/shared/ui/status-badge';
import { Link } from 'react-router-dom';

const PERMIT_QUEUE_BY_ROLE: Record<string, string[]> = {
  'FSC Owner': ['fscOperationalReview', 'finalApproval', 'suspended', 'fscCloseout'],
  'HSE Officer': ['hseReview', 'completionPending'],
};

const JSA_QUEUE_BY_ROLE: Record<string, string[]> = {
  'FSC Owner': ['fscReview'],
  'HSE Officer': ['hseReview'],
};

export function ReviewsPage() {
  const currentRole = useAppStore((s) => s.currentRole);
  const { data: permits, isLoading } = usePermits();
  const { data: jsas } = useJSAs();

  const permitQueue = permits?.filter((p) => (PERMIT_QUEUE_BY_ROLE[currentRole] ?? []).includes(p.status)) ?? [];
  const jsaQueue = jsas?.filter((j) => (JSA_QUEUE_BY_ROLE[currentRole] ?? []).includes(j.status)) ?? [];

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Reviews</h1>

      <Card className={jsaQueue.length > 0 ? 'border-l-4 border-l-nnpc-gold' : ''}>
        <CardHeader>
          <CardTitle>JSAs Pending Your Review ({jsaQueue.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {jsaQueue.length === 0 ? (
            <p className="text-muted-foreground text-sm">No JSAs pending your review.</p>
          ) : (
            <div className="space-y-2">
              {jsaQueue.map((j) => (
                <Link
                  key={j.id}
                  to={`/jsas/${j.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors border border-border"
                >
                  <div>
                    <span className="font-medium text-sm">{j.serialNo}</span>
                    <span className="text-muted-foreground text-sm ml-2">{j.jobDescription.slice(0, 60)}</span>
                  </div>
                  <StatusBadge status={j.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permits Pending Your Action ({permitQueue.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {permitQueue.length === 0 ? (
            <p className="text-muted-foreground text-sm">No permits pending your action.</p>
          ) : (
            <div className="space-y-2">
              {permitQueue.map((p) => (
                <Link
                  key={p.id}
                  to={`/permits/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors border border-border"
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
