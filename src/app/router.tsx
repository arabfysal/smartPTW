import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';

import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { JSAsListPage } from '@/features/jsa/JSAsListPage';
import { CreateJSAPage } from '@/features/jsa/CreateJSAPage';
import { JSADetailPage } from '@/features/jsa/JSADetailPage';
import { PermitsListPage } from '@/features/permits/PermitsListPage';
import { PermitDetailPage } from '@/features/permits/PermitDetailPage';
import { CreatePermitPage } from '@/features/permits/CreatePermitPage';
import { ReviewsPage } from '@/features/permits/ReviewsPage';
import { AcceptancePage } from '@/features/contractor-acceptance/AcceptancePage';
import { MonitoringPage } from '@/features/monitoring/MonitoringPage';
import { ActivePermitsPage } from '@/features/monitoring/ActivePermitsPage';
import { AuditTrailPage } from '@/features/audit-trail/AuditTrailPage';
import { AnalyticsPage } from '@/features/dashboard/AnalyticsPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'jsas', element: <JSAsListPage /> },
      { path: 'jsas/create', element: <CreateJSAPage /> },
      { path: 'jsas/:id', element: <JSADetailPage /> },
      { path: 'permits', element: <PermitsListPage /> },
      { path: 'permits/create', element: <CreatePermitPage /> },
      { path: 'permits/:id', element: <PermitDetailPage /> },
      { path: 'reviews', element: <ReviewsPage /> },
      { path: 'acceptance', element: <AcceptancePage /> },
      { path: 'monitoring', element: <MonitoringPage /> },
      { path: 'active', element: <ActivePermitsPage /> },
      { path: 'audit', element: <AuditTrailPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
    ],
  },
]);
