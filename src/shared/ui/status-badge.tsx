import { Badge, type BadgeProps } from './badge';

const statusConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  // Permit statuses
  draft: { label: 'Draft', variant: 'secondary' },
  hseReview: { label: 'HSE Review', variant: 'warning' },
  fscOperationalReview: { label: 'Operational Review', variant: 'warning' },
  contractorAcceptance: { label: 'Contractor Acceptance', variant: 'warning' },
  finalApproval: { label: 'Final Approval', variant: 'warning' },
  active: { label: 'Active', variant: 'success' },
  suspended: { label: 'Suspended', variant: 'destructive' },
  revalidation: { label: 'Revalidation', variant: 'warning' },
  completionPending: { label: 'Completion — HSE Verify', variant: 'warning' },
  fscCloseout: { label: 'FSC Closeout', variant: 'warning' },
  closed: { label: 'Closed', variant: 'outline' },
  // JSA statuses
  fscReview: { label: 'FSC Review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
