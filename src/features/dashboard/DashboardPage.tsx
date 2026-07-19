import { useAppStore } from '@/shared/store';
import { RichDashboard } from './RichDashboard';
import { ApplicantDashboard } from './ApplicantDashboard';

/**
 * Applicants see a focused "my work" dashboard with stage tracking;
 * every other role gets the full operations dashboard with geofencing.
 */
export function DashboardPage() {
  const currentRole = useAppStore((s) => s.currentRole);
  return currentRole === 'Applicant' ? <ApplicantDashboard /> : <RichDashboard />;
}
