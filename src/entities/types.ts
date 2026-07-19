export type Role =
  | 'Applicant'
  | 'FSC Owner'
  | 'HSE Officer'
  | 'Contractor'
  | 'Admin';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  department?: string;
  company?: string;
  certifications: {
    type: string;
    number: string;
    expiry: string;
  }[];
}

export interface Facility {
  id: string;
  name: string;
  shortCode: string;
  location: string;
  type: 'operational' | 'non-operational';
}

export interface Asset {
  id: string;
  facilityId: string;
  name: string;
  type: string;
}

export interface LocationEntity {
  id: string;
  facilityId: string;
  name: string;
  /** Position on the facility blueprint map, percent coordinates 0-100 */
  mapX: number;
  mapY: number;
  geo: {
    lat: number;
    lng: number;
  };
}

/** One row of the NNPC Job Safety Analysis form */
export interface JSARow {
  sn: number;
  jobStep: string;
  potentialHazards: string;
  risks: string;
  riskLevel: 'H' | 'M' | 'L';
  controls: string;
  actionParty: string;
}

export interface WorkTypeRule {
  id: string;
  label: string;
  requiredPermitTypes: string[];
  baseRiskCategory: 'Low' | 'Medium' | 'High' | 'Critical';
  requiredPPE: string[];
  requiredCertificates: string[];
  requiredDocuments: string[];
  gasTestRequired: boolean;
  isolationRequired: boolean;
  toolboxTalkRequired: boolean;
  environmentalRequirements: string[];
  /** Template JSA rows auto-populated when this work type is selected */
  jsaTemplate: Omit<JSARow, 'sn'>[];
}

export interface PermitHistory {
  stage: string;
  at: string;
  byUserId: string;
  note: string;
}

export type JSAStatus = 'draft' | 'fscReview' | 'hseReview' | 'approved';

/** NNPC Job Safety Analysis — filled in-platform, reviewed before any PTW is raised */
export interface JSA {
  id: string;
  serialNo: string;
  applicantId: string;
  inHouseOrContractor: 'In-House' | 'Contractor';
  emergencyNo: string;
  jobDescription: string;
  facilityId: string;
  assetId: string;
  locationId: string;
  natureOfWork: string[];
  scheduledStart: string;
  scheduledEnd: string;
  riskCategory: 'Low' | 'Medium' | 'High' | 'Critical';
  requiredPPE: string[];
  requiredCertificates: string[];
  requiredDocuments: string[];
  gasTestRequired: boolean;
  isolationRequired: boolean;
  simopsRequired: boolean;
  toolboxTalkRequired: boolean;
  rows: JSARow[];
  stopWorkConditions: string;
  comments: string;
  status: JSAStatus;
  fscReviewedBy: string | null;
  fscReviewedAt: string | null;
  hseApprovedBy: string | null;
  hseApprovedAt: string | null;
  /** Set once the applicant raises the PTW from this approved JSA */
  permitId: string | null;
  createdAt: string;
  updatedAt: string;
  history: PermitHistory[];
}

export interface Permit {
  id: string;
  permitNumber: string;
  jsaId: string;
  facilityId: string;
  assetId: string;
  locationId: string;
  natureOfWork: string[];
  riskCategory: 'Low' | 'Medium' | 'High' | 'Critical';
  requiredPermitTypes: string[];
  requiredApprovers: string[];
  requiredPPE: string[];
  requiredCertificates: string[];
  requiredDocuments: string[];
  gasTestRequired: boolean;
  isolationRequired: boolean;
  simopsRequired: boolean;
  toolboxTalkRequired: boolean;
  environmentalRequirements: string[];
  status: string;
  applicantId: string;
  contractorId: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  createdAt: string;
  updatedAt: string;
  history: PermitHistory[];
}

export interface Document {
  id: string;
  permitId: string;
  type: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  status: 'uploaded' | 'approved' | 'rejected';
}

export interface JSAReview {
  id: string;
  jsaId: string;
  reviewerRole: 'FSC Owner' | 'HSE Officer';
  reviewerId: string;
  status: 'approved' | 'amendmentRequired' | 'rejected';
  comments: string;
  requestedAmendments: string;
  reviewedAt: string;
}

export interface ValidationCheckItem {
  name: string;
  passed: boolean;
  detail: string;
}

export interface ValidationCheck {
  id: string;
  permitId: string;
  checks: ValidationCheckItem[];
  overallPassed: boolean;
  checkedAt: string;
}

export interface HSEReviewItem {
  item: string;
  passed: boolean;
}

export interface HSEReview {
  id: string;
  permitId: string;
  inspectorId: string;
  checklist: HSEReviewItem[];
  decision: 'approved' | 'rejected';
  comments: string;
  reviewedAt: string;
}

export interface FSCConflict {
  type: string;
  detail: string;
  relatedPermitId: string;
}

export interface FSCReview {
  id: string;
  permitId: string;
  reviewerId: string;
  conflicts: FSCConflict[];
  decision: 'approved' | 'rejected' | 'flaggedForReview';
  reviewedAt: string;
}

/** Submitted by the job owner (applicant), approved by the FSC Owner */
export interface SIMOPSAssessment {
  id: string;
  permitId: string;
  relatedPermitIds: string[];
  interfaceRisks: string;
  combinedHazards: string;
  sequencingPlan: string;
  commsPlan: string;
  status: 'submitted' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

/** Submitted by the job owner (applicant), approved by the FSC Owner */
export interface IsolationCertificate {
  id: string;
  permitId: string;
  type: 'electrical' | 'mechanical' | 'process';
  isolationPoints: string;
  lotoVerified: boolean;
  status: 'submitted' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

/** Entered by the job owner (applicant), approved by the FSC Owner. Expiry is monitored. */
export interface GasTest {
  id: string;
  permitId: string;
  readings: {
    o2: string;
    lel: string;
    h2s: string;
    co: string;
    other?: string;
  };
  testedAt: string;
  validUntil: string;
  status: 'submitted' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface ContractorAcceptance {
  id: string;
  permitId: string;
  contractorId: string;
  acceptedItems: string[];
  signedAt: string;
}

export interface FinalApproval {
  id: string;
  permitId: string;
  approverId: string;
  signedAt: string;
}

export interface MonitoringEvent {
  id: string;
  permitId: string;
  type: string;
  detail: string;
  detectedAt: string;
  resolvedAt: string;
  status: 'open' | 'resolved';
}

export interface Revalidation {
  id: string;
  permitId: string;
  reason: string;
  requestedAt: string;
  resolvedAt: string;
  status: 'pending' | 'approved';
}

export interface CompletionItem {
  item: string;
  done: boolean;
}

export interface Completion {
  id: string;
  permitId: string;
  confirmedBy: string;
  checklist: CompletionItem[];
  completedAt: string;
}

export interface SiteVerification {
  id: string;
  permitId: string;
  verifiedBy: string;
  checklist: CompletionItem[];
  verifiedAt: string;
}

export interface CloseoutArchiveRef {
  name: string;
  type: string;
  ref: string;
}

export interface Closeout {
  id: string;
  permitId: string;
  hseClosedBy: string;
  hseClosedAt: string;
  fscClosedBy: string;
  fscClosedAt: string;
  archivedRefs: CloseoutArchiveRef[];
}

export interface AuditTrailEntry {
  id: string;
  permitId: string;
  actorId: string;
  action: string;
  detail: string;
  at: string;
}

export interface Notification {
  id: string;
  userId?: string;
  role?: Role;
  permitId: string;
  message: string;
  read: boolean;
  createdAt: string;
}
