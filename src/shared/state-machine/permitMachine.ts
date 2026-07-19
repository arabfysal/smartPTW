import type { Role } from '@/entities/types';

/**
 * Permit lifecycle. The JSA is prepared and approved BEFORE a permit is raised.
 * Completion: Contractor/Applicant request completion → HSE verifies after a
 * site visit → FSC Owner (facility owner) performs the final closeout & archive.
 */
export const PERMIT_STATES = [
  'draft',
  'hseReview',
  'fscOperationalReview',
  'contractorAcceptance',
  'finalApproval',
  'active',
  'suspended',
  'revalidation',
  'completionPending',
  'fscCloseout',
  'closed',
] as const;

export type PermitStatus = (typeof PERMIT_STATES)[number];

export const JSA_STATES = ['draft', 'fscReview', 'hseReview', 'approved'] as const;
export type JSAStatusType = (typeof JSA_STATES)[number];

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['hseReview'],
  hseReview: ['draft', 'fscOperationalReview'],
  fscOperationalReview: ['contractorAcceptance'],
  contractorAcceptance: ['finalApproval'],
  finalApproval: ['active'],
  active: ['suspended', 'completionPending'],
  // Daily revalidation: straight back to active, or via contractor re-acceptance
  // when the FSC Owner amended the JSA during the morning site visit.
  suspended: ['revalidation', 'active', 'contractorAcceptance'],
  revalidation: ['active', 'fscOperationalReview'],
  completionPending: ['fscCloseout', 'active'],
  fscCloseout: ['closed'],
  closed: [],
};

const JSA_TRANSITIONS: Record<string, string[]> = {
  draft: ['fscReview'],
  fscReview: ['draft', 'hseReview'],
  hseReview: ['draft', 'approved'],
  approved: [],
};

export function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionJSA(from: string, to: string): boolean {
  return JSA_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextStates(current: string): string[] {
  return VALID_TRANSITIONS[current] ?? [];
}

/** Which role a permit is currently waiting on */
export function permitPendingWith(status: string): { role: Role | null; label: string } {
  switch (status) {
    case 'draft': return { role: 'Applicant', label: 'Applicant — upload documents & submit' };
    case 'hseReview': return { role: 'HSE Officer', label: 'HSE Officer — review & endorse (may amend JSA)' };
    case 'fscOperationalReview': return { role: 'FSC Owner', label: 'FSC Owner — operational review (job owner submits gates)' };
    case 'contractorAcceptance': return { role: 'Contractor', label: 'Contractor — accept & sign' };
    case 'finalApproval': return { role: 'FSC Owner', label: 'FSC Owner — final authorisation' };
    case 'active': return { role: null, label: 'Work in progress — monitored; Contractor/Applicant request completion' };
    case 'suspended': return { role: 'FSC Owner', label: 'FSC Owner — morning site visit & revalidation' };
    case 'revalidation': return { role: 'FSC Owner', label: 'FSC Owner — revalidating' };
    case 'completionPending': return { role: 'HSE Officer', label: 'HSE Officer — verify completion after site visit' };
    case 'fscCloseout': return { role: 'FSC Owner', label: 'FSC Owner — final closeout & archive' };
    case 'closed': return { role: null, label: 'Closed — completion certificate available' };
    default: return { role: null, label: status };
  }
}

/** Which role a JSA is currently waiting on */
export function jsaPendingWith(status: string): { role: Role | null; label: string } {
  switch (status) {
    case 'draft': return { role: 'Applicant', label: 'Applicant — complete & submit JSA' };
    case 'fscReview': return { role: 'FSC Owner', label: 'FSC Owner — review JSA' };
    case 'hseReview': return { role: 'HSE Officer', label: 'HSE Officer — endorse JSA' };
    case 'approved': return { role: 'Applicant', label: 'Approved — Applicant may raise PTW' };
    default: return { role: null, label: status };
  }
}
