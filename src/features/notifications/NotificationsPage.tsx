import { useAppStore } from '@/shared/store';
import { useNotifications } from '@/shared/api/queries';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { update } from '@/shared/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Link } from 'react-router-dom';
import type { Notification } from '@/entities/types';

export function NotificationsPage() {
  const { currentUser, currentRole } = useAppStore();
  const { data: notifications, isLoading } = useNotifications(currentUser?.id, currentRole);
  const qc = useQueryClient();

  async function markRead(notif: Notification) {
    await update<Notification>('notifications', notif.id, { read: true });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  }

  async function markAllRead() {
    const unread = notifications?.filter((n) => !n.read) ?? [];
    for (const n of unread) {
      await update<Notification>('notifications', n.id, { read: true });
    }
    qc.invalidateQueries({ queryKey: ['notifications'] });
  }

  if (isLoading) return <div className="text-muted-foreground">Loading notifications...</div>;

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && <Badge variant="warning">{unreadCount} unread</Badge>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck size={14} className="mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {(!notifications || notifications.length === 0) ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell size={32} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={n.read ? '' : 'border-l-4 border-l-nnpc-green'}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? 'text-muted-foreground' : 'font-medium'}`}>{n.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</span>
                    {n.permitId && (
                      <Link to={`/permits/${n.permitId}`} className="text-xs text-primary hover:underline">
                        View permit
                      </Link>
                    )}
                  </div>
                </div>
                {!n.read && (
                  <Button variant="ghost" size="sm" onClick={() => markRead(n)} className="shrink-0 text-xs">
                    Mark read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
