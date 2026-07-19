import type { WorkTypeRule, Permit, JSARow } from '@/entities/types';

export interface DerivedIntelligence {
  requiredPermitTypes: string[];
  riskCategory: 'Low' | 'Medium' | 'High' | 'Critical';
  requiredApprovers: string[];
  requiredPPE: string[];
  requiredCertificates: string[];
  requiredDocuments: string[];
  gasTestRequired: boolean;
  isolationRequired: boolean;
  simopsRequired: boolean;
  toolboxTalkRequired: boolean;
  environmentalRequirements: string[];
  conflictingPermits: string[];
  /** Auto-populated JSA rows from the selected work type templates */
  jsaRows: JSARow[];
}

const RISK_ORDER: Record<string, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'] as const;

function unionUnique(...arrays: string[][]): string[] {
  return [...new Set(arrays.flat())];
}

function maxRisk(categories: string[]): 'Low' | 'Medium' | 'High' | 'Critical' {
  let max = 0;
  for (const c of categories) {
    max = Math.max(max, RISK_ORDER[c] ?? 0);
  }
  return RISK_LEVELS[max];
}

export function checkSIMOPSConflicts(
  locationId: string,
  assetId: string,
  scheduledStart: string,
  scheduledEnd: string,
  currentPermitId: string | undefined,
  allPermits: Permit[],
): string[] {
  const start = new Date(scheduledStart).getTime();
  const end = new Date(scheduledEnd).getTime();

  return allPermits
    .filter((p) => {
      if (p.id === currentPermitId) return false;
      if (p.status === 'closed' || p.status === 'draft') return false;
      const pStart = new Date(p.scheduledStart).getTime();
      const pEnd = new Date(p.scheduledEnd).getTime();
      const timeOverlap = pStart <= end && pEnd >= start;
      const locationMatch = p.locationId === locationId;
      const assetMatch = p.assetId === assetId;
      return timeOverlap && (locationMatch || assetMatch);
    })
    .map((p) => p.id);
}

export function deriveIntelligence(
  selectedWorkTypeIds: string[],
  rules: WorkTypeRule[],
  context: {
    locationId: string;
    assetId: string;
    scheduledStart: string;
    scheduledEnd: string;
    currentPermitId?: string;
    allPermits: Permit[];
  },
): DerivedIntelligence {
  const matched = rules.filter((r) => selectedWorkTypeIds.includes(r.id));

  if (matched.length === 0) {
    return {
      requiredPermitTypes: [],
      riskCategory: 'Low',
      requiredApprovers: ['FSC Owner', 'HSE Officer', 'Contractor'],
      requiredPPE: [],
      requiredCertificates: [],
      requiredDocuments: [],
      gasTestRequired: false,
      isolationRequired: false,
      simopsRequired: false,
      toolboxTalkRequired: false,
      environmentalRequirements: [],
      conflictingPermits: [],
      jsaRows: [],
    };
  }

  const riskCategory = maxRisk(matched.map((r) => r.baseRiskCategory));
  const gasTestRequired = matched.some((r) => r.gasTestRequired);
  const isolationRequired = matched.some((r) => r.isolationRequired);
  const toolboxTalkRequired = matched.some((r) => r.toolboxTalkRequired);

  const conflictingPermits = checkSIMOPSConflicts(
    context.locationId,
    context.assetId,
    context.scheduledStart,
    context.scheduledEnd,
    context.currentPermitId,
    context.allPermits,
  );
  const simopsRequired = conflictingPermits.length > 0;

  // Auto-populate JSA rows from the work type templates (editable by the applicant afterwards)
  let sn = 0;
  const jsaRows: JSARow[] = matched.flatMap((r) =>
    r.jsaTemplate.map((t) => ({ sn: ++sn, ...t })),
  );

  return {
    requiredPermitTypes: unionUnique(...matched.map((r) => r.requiredPermitTypes)),
    riskCategory,
    requiredApprovers: ['FSC Owner', 'HSE Officer', 'Contractor'],
    requiredPPE: unionUnique(...matched.map((r) => r.requiredPPE)),
    requiredCertificates: unionUnique(...matched.map((r) => r.requiredCertificates)),
    requiredDocuments: unionUnique(...matched.map((r) => r.requiredDocuments)),
    gasTestRequired,
    isolationRequired,
    simopsRequired,
    toolboxTalkRequired,
    environmentalRequirements: unionUnique(...matched.map((r) => r.environmentalRequirements)),
    conflictingPermits,
    jsaRows,
  };
}
