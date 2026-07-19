import type { Role } from '@/entities/types';

export type PermitAction =
  | 'edit' | 'upload_docs' | 'submit'
  | 'hse_endorse' | 'hse_reject'
  | 'gate_submit'            // job owner submits SIMOPS / LOTO / gas test
  | 'gate_approve'           // FSC Owner approves submitted gates
  | 'fsc_close_operational_review'
  | 'contractor_accept_sign'
  | 'final_approve_sign'
  | 'log_inspection' | 'suspend_permit' | 'revalidate' | 'resolve_event'
  | 'amend_jsa'              // HSE (permit review) / FSC (op review & daily revalidation)
  | 'request_completion'     // Contractor or Applicant only
  | 'hse_verify_completion'  // HSE after post-work site visit
  | 'fsc_closeout'           // FSC Owner (facility owner) final closeout & archive
  | 'view';

type PermissionEntry = {
  status: string;
  role: Role;
  actions: PermitAction[];
};

const permissionTable: PermissionEntry[] = [
  { status: 'draft', role: 'Applicant', actions: ['edit', 'upload_docs', 'submit', 'view'] },
  { status: 'hseReview', role: 'HSE Officer', actions: ['hse_endorse', 'hse_reject', 'amend_jsa', 'view'] },
  { status: 'fscOperationalReview', role: 'Applicant', actions: ['gate_submit', 'view'] },
  { status: 'fscOperationalReview', role: 'FSC Owner', actions: ['gate_approve', 'fsc_close_operational_review', 'amend_jsa', 'view'] },
  { status: 'contractorAcceptance', role: 'Contractor', actions: ['contractor_accept_sign', 'view'] },
  { status: 'finalApproval', role: 'FSC Owner', actions: ['final_approve_sign', 'view'] },
  { status: 'active', role: 'HSE Officer', actions: ['log_inspection', 'suspend_permit', 'resolve_event', 'view'] },
  { status: 'active', role: 'FSC Owner', actions: ['log_inspection', 'suspend_permit', 'resolve_event', 'view'] },
  { status: 'active', role: 'Contractor', actions: ['request_completion', 'view'] },
  { status: 'active', role: 'Applicant', actions: ['request_completion', 'view'] },
  { status: 'suspended', role: 'FSC Owner', actions: ['revalidate', 'amend_jsa', 'resolve_event', 'view'] },
  { status: 'suspended', role: 'HSE Officer', actions: ['resolve_event', 'view'] },
  { status: 'completionPending', role: 'HSE Officer', actions: ['hse_verify_completion', 'resolve_event', 'view'] },
  { status: 'fscCloseout', role: 'FSC Owner', actions: ['fsc_closeout', 'resolve_event', 'view'] },
];

export function getAllowedActions(status: string, role: Role): PermitAction[] {
  if (role === 'Admin') return ['view'];
  const entry = permissionTable.find((e) => e.status === status && e.role === role);
  return entry?.actions ?? ['view'];
}

export function canPerform(status: string, role: Role, action: PermitAction): boolean {
  return getAllowedActions(status, role).includes(action);
}

// ---- JSA permissions ----

export type JSAAction = 'edit' | 'submit' | 'fsc_approve' | 'fsc_amend' | 'hse_endorse' | 'hse_amend' | 'raise_permit' | 'view';

export function getJSAActions(status: string, role: Role): JSAAction[] {
  if (role === 'Admin') return ['view'];
  if (status === 'draft' && role === 'Applicant') return ['edit', 'submit', 'view'];
  if (status === 'fscReview' && role === 'FSC Owner') return ['fsc_approve', 'fsc_amend', 'view'];
  if (status === 'hseReview' && role === 'HSE Officer') return ['hse_endorse', 'hse_amend', 'view'];
  if (status === 'approved' && role === 'Applicant') return ['raise_permit', 'view'];
  return ['view'];
}

export function canPerformJSA(status: string, role: Role, action: JSAAction): boolean {
  return getJSAActions(status, role).includes(action);
}
