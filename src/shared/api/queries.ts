import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAll, fetchOne, fetchByField, create, update } from './client';
import type {
  User, Facility, Asset, LocationEntity, WorkTypeRule, Permit, JSA,
  Document, JSAReview, HSEReview, FSCReview,
  SIMOPSAssessment, IsolationCertificate, GasTest, ContractorAcceptance,
  FinalApproval, MonitoringEvent, AuditTrailEntry, Notification,
} from '@/entities/types';

export const queryKeys = {
  users: ['users'] as const,
  facilities: ['facilities'] as const,
  assets: ['assets'] as const,
  assetsByFacility: (facilityId: string) => ['assets', { facilityId }] as const,
  locations: ['locations'] as const,
  locationsByFacility: (facilityId: string) => ['locations', { facilityId }] as const,
  workTypeRules: ['workTypeRules'] as const,
  jsas: ['jsas'] as const,
  jsa: (id: string) => ['jsas', id] as const,
  jsaReviews: (jsaId: string) => ['jsaReviews', { jsaId }] as const,
  permits: ['permits'] as const,
  permit: (id: string) => ['permits', id] as const,
  documents: (permitId: string) => ['documents', { permitId }] as const,
  hseReviews: (permitId: string) => ['hseReviews', { permitId }] as const,
  fscReviews: (permitId: string) => ['fscReviews', { permitId }] as const,
  simopsAssessments: (permitId: string) => ['simopsAssessments', { permitId }] as const,
  isolationCerts: (permitId: string) => ['isolationCertificates', { permitId }] as const,
  gasTests: (permitId?: string) => permitId ? ['gasTests', { permitId }] : ['gasTests'] as const,
  contractorAcceptances: (permitId: string) => ['contractorAcceptances', { permitId }] as const,
  finalApprovals: (permitId: string) => ['finalApprovals', { permitId }] as const,
  monitoringEvents: (permitId?: string) => permitId ? ['monitoringEvents', { permitId }] : ['monitoringEvents'] as const,
  auditTrail: (permitId?: string) => permitId ? ['auditTrail', { permitId }] : ['auditTrail'] as const,
  notifications: (userId?: string) => userId ? ['notifications', { userId }] : ['notifications'] as const,
};

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: () => fetchAll<User>('users') });
}

export function useFacilities() {
  return useQuery({ queryKey: queryKeys.facilities, queryFn: () => fetchAll<Facility>('facilities') });
}

export function useAssets(facilityId?: string) {
  return useQuery({
    queryKey: facilityId ? queryKeys.assetsByFacility(facilityId) : queryKeys.assets,
    queryFn: () => facilityId
      ? fetchByField<Asset>('assets', 'facilityId', facilityId)
      : fetchAll<Asset>('assets'),
  });
}

export function useLocations(facilityId?: string) {
  return useQuery({
    queryKey: facilityId ? queryKeys.locationsByFacility(facilityId) : queryKeys.locations,
    queryFn: () => facilityId
      ? fetchByField<LocationEntity>('locations', 'facilityId', facilityId)
      : fetchAll<LocationEntity>('locations'),
  });
}

export function useWorkTypeRules() {
  return useQuery({ queryKey: queryKeys.workTypeRules, queryFn: () => fetchAll<WorkTypeRule>('workTypeRules') });
}

// ---- JSAs ----

export function useJSAs() {
  return useQuery({ queryKey: queryKeys.jsas, queryFn: () => fetchAll<JSA>('jsas') });
}

export function useJSA(id: string) {
  return useQuery({ queryKey: queryKeys.jsa(id), queryFn: () => fetchOne<JSA>('jsas', id), enabled: !!id });
}

export function useJSAReviews(jsaId: string) {
  return useQuery({ queryKey: queryKeys.jsaReviews(jsaId), queryFn: () => fetchByField<JSAReview>('jsaReviews', 'jsaId', jsaId), enabled: !!jsaId });
}

export function useCreateJSA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<JSA>) => create<JSA>('jsas', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.jsas }); },
  });
}

export function useUpdateJSA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<JSA> & { id: string }) => update<JSA>('jsas', id, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.jsas });
      qc.invalidateQueries({ queryKey: queryKeys.jsa(vars.id) });
    },
  });
}

// ---- Permits ----

export function usePermits() {
  return useQuery({ queryKey: queryKeys.permits, queryFn: () => fetchAll<Permit>('permits') });
}

export function usePermit(id: string) {
  return useQuery({ queryKey: queryKeys.permit(id), queryFn: () => fetchOne<Permit>('permits', id), enabled: !!id });
}

export function useDocuments(permitId: string) {
  return useQuery({ queryKey: queryKeys.documents(permitId), queryFn: () => fetchByField<Document>('documents', 'permitId', permitId), enabled: !!permitId });
}

export function useHSEReviews(permitId: string) {
  return useQuery({ queryKey: queryKeys.hseReviews(permitId), queryFn: () => fetchByField<HSEReview>('hseReviews', 'permitId', permitId), enabled: !!permitId });
}

export function useFSCReviews(permitId: string) {
  return useQuery({ queryKey: queryKeys.fscReviews(permitId), queryFn: () => fetchByField<FSCReview>('fscReviews', 'permitId', permitId), enabled: !!permitId });
}

export function useSIMOPSAssessments(permitId: string) {
  return useQuery({ queryKey: queryKeys.simopsAssessments(permitId), queryFn: () => fetchByField<SIMOPSAssessment>('simopsAssessments', 'permitId', permitId), enabled: !!permitId });
}

export function useIsolationCertificates(permitId: string) {
  return useQuery({ queryKey: queryKeys.isolationCerts(permitId), queryFn: () => fetchByField<IsolationCertificate>('isolationCertificates', 'permitId', permitId), enabled: !!permitId });
}

export function useGasTests(permitId?: string) {
  return useQuery({
    queryKey: queryKeys.gasTests(permitId),
    queryFn: () => permitId
      ? fetchByField<GasTest>('gasTests', 'permitId', permitId)
      : fetchAll<GasTest>('gasTests'),
  });
}

export function useContractorAcceptances(permitId: string) {
  return useQuery({ queryKey: queryKeys.contractorAcceptances(permitId), queryFn: () => fetchByField<ContractorAcceptance>('contractorAcceptances', 'permitId', permitId), enabled: !!permitId });
}

export function useFinalApprovals(permitId: string) {
  return useQuery({ queryKey: queryKeys.finalApprovals(permitId), queryFn: () => fetchByField<FinalApproval>('finalApprovals', 'permitId', permitId), enabled: !!permitId });
}

export function useMonitoringEvents(permitId?: string) {
  return useQuery({
    queryKey: queryKeys.monitoringEvents(permitId),
    queryFn: () => permitId
      ? fetchByField<MonitoringEvent>('monitoringEvents', 'permitId', permitId)
      : fetchAll<MonitoringEvent>('monitoringEvents'),
  });
}

export function useCompletionsRecord(permitId: string) {
  return useQuery({
    queryKey: ['completions', { permitId }],
    queryFn: () => fetchByField<import('@/entities/types').Completion>('completions', 'permitId', permitId),
    enabled: !!permitId,
  });
}

export function useSiteVerificationsRecord(permitId: string) {
  return useQuery({
    queryKey: ['siteVerifications', { permitId }],
    queryFn: () => fetchByField<import('@/entities/types').SiteVerification>('siteVerifications', 'permitId', permitId),
    enabled: !!permitId,
  });
}

export function useCloseoutsRecord(permitId: string) {
  return useQuery({
    queryKey: ['closeouts', { permitId }],
    queryFn: () => fetchByField<import('@/entities/types').Closeout>('closeouts', 'permitId', permitId),
    enabled: !!permitId,
  });
}

export function useAuditTrail(permitId?: string) {
  return useQuery({
    queryKey: queryKeys.auditTrail(permitId),
    queryFn: () => permitId
      ? fetchByField<AuditTrailEntry>('auditTrail', 'permitId', permitId)
      : fetchAll<AuditTrailEntry>('auditTrail'),
  });
}

export function useNotifications(userId?: string, role?: string) {
  return useQuery({
    queryKey: queryKeys.notifications(userId),
    queryFn: async () => {
      const byUser = userId ? await fetchByField<Notification>('notifications', 'userId', userId) : [];
      const byRole = role ? await fetchByField<Notification>('notifications', 'role', role) : [];
      const map = new Map<string, Notification>();
      [...byUser, ...byRole].forEach(n => map.set(n.id, n));
      return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  });
}

export function useCreatePermit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Permit>) => create<Permit>('permits', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.permits }); },
  });
}

export function useUpdatePermit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Permit> & { id: string }) => update<Permit>('permits', id, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.permits });
      qc.invalidateQueries({ queryKey: queryKeys.permit(vars.id) });
    },
  });
}

export function useCreateAuditEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<AuditTrailEntry>) => create<AuditTrailEntry>('auditTrail', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['auditTrail'] }); },
  });
}

export function useCreateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Notification>) => create<Notification>('notifications', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });
}
