import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { useJSAs, useFacilities, useAssets, useLocations, useCreatePermit, useCreateAuditEntry, useCreateNotification, useUpdateJSA, usePermits } from '@/shared/api/queries';
import { useAppStore } from '@/shared/store';
import { create } from '@/shared/api/client';
import { Check, FileCheck, ShieldCheck } from 'lucide-react';
import type { Document } from '@/entities/types';

interface DocEntry {
  type: string;
  fileName: string;
}

/**
 * Raise a Permit to Work from an APPROVED JSA. All required documents must be
 * uploaded — nothing is optional. On submit the permit goes straight to HSE review.
 */
export function CreatePermitPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preselected = params.get('jsa') ?? '';
  const currentUser = useAppStore((s) => s.currentUser);

  const [jsaId, setJsaId] = useState(preselected);
  const [docs, setDocs] = useState<DocEntry[]>([]);

  const { data: jsas } = useJSAs();
  const { data: facilities } = useFacilities();
  const { data: assets } = useAssets();
  const { data: locations } = useLocations();
  const { data: permits } = usePermits();
  const createPermit = useCreatePermit();
  const createAudit = useCreateAuditEntry();
  const createNotif = useCreateNotification();
  const updateJSA = useUpdateJSA();

  const approvedJSAs = useMemo(
    () => jsas?.filter((j) => j.status === 'approved' && !j.permitId) ?? [],
    [jsas],
  );
  const jsa = jsas?.find((j) => j.id === jsaId);

  const missingDocs = useMemo(() => {
    if (!jsa) return [];
    const uploaded = new Set(docs.map((d) => d.type));
    return jsa.requiredDocuments.filter((d) => !uploaded.has(d));
  }, [jsa, docs]);

  function addDoc(type: string) {
    const fileName = `${type.replace(/\s+/g, '_').replace(/\//g, '-').toLowerCase()}.pdf`;
    setDocs((prev) => [...prev, { type, fileName }]);
  }

  async function handleSubmit() {
    if (!jsa || !currentUser || missingDocs.length > 0) return;
    const now = new Date().toISOString();
    const facility = facilities?.find((f) => f.id === jsa.facilityId);
    const seq = (permits?.length ?? 0) + 1;
    const permitNumber = `PTW-${facility?.shortCode ?? 'NNPC'}-2026-${String(seq).padStart(3, '0')}`;

    const permit = await createPermit.mutateAsync({
      permitNumber,
      jsaId: jsa.id,
      facilityId: jsa.facilityId,
      assetId: jsa.assetId,
      locationId: jsa.locationId,
      natureOfWork: jsa.natureOfWork,
      riskCategory: jsa.riskCategory,
      requiredPermitTypes: [],
      requiredApprovers: ['HSE Officer', 'FSC Owner', 'Contractor'],
      requiredPPE: jsa.requiredPPE,
      requiredCertificates: jsa.requiredCertificates,
      requiredDocuments: jsa.requiredDocuments,
      gasTestRequired: jsa.gasTestRequired,
      isolationRequired: jsa.isolationRequired,
      simopsRequired: jsa.simopsRequired,
      toolboxTalkRequired: jsa.toolboxTalkRequired,
      environmentalRequirements: [],
      status: 'hseReview',
      applicantId: currentUser.id,
      contractorId: jsa.inHouseOrContractor === 'Contractor' ? 'usr-004' : null,
      scheduledStart: jsa.scheduledStart,
      scheduledEnd: jsa.scheduledEnd,
      createdAt: now,
      updatedAt: now,
      history: [
        { stage: 'draft', at: now, byUserId: currentUser.id, note: `Permit raised from approved JSA ${jsa.serialNo}` },
        { stage: 'hseReview', at: now, byUserId: currentUser.id, note: 'All documents uploaded — submitted for HSE review' },
      ],
    });

    for (const d of docs) {
      await create<Document>('documents', {
        permitId: permit.id,
        type: d.type,
        fileName: d.fileName,
        uploadedAt: now,
        uploadedBy: currentUser.id,
        status: 'uploaded',
      });
    }

    await updateJSA.mutateAsync({ id: jsa.id, permitId: permit.id });

    await createAudit.mutateAsync({
      permitId: permit.id,
      actorId: currentUser.id,
      action: 'permit_created',
      detail: `${permitNumber} raised from ${jsa.serialNo} — submitted for HSE review`,
      at: now,
    });

    await createNotif.mutateAsync({
      role: 'HSE Officer',
      permitId: permit.id,
      message: `${permitNumber}: submitted for HSE review — ${jsa.jobDescription.slice(0, 60)}`,
      read: false,
      createdAt: now,
    });

    navigate(`/permits/${permit.id}`);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Raise Permit to Work</h1>
        <p className="text-sm text-muted-foreground">A PTW can only be raised from an approved JSA.</p>
      </div>

      {/* JSA selection */}
      <Card>
        <CardHeader><CardTitle>Approved JSA</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {approvedJSAs.length === 0 && !jsa ? (
            <div className="text-sm text-muted-foreground">
              No approved JSAs awaiting a permit. <Link to="/jsas/create" className="text-primary underline">Start a JSA first</Link>.
            </div>
          ) : (
            <select
              value={jsaId}
              onChange={(e) => { setJsaId(e.target.value); setDocs([]); }}
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">Select an approved JSA...</option>
              {approvedJSAs.map((j) => (
                <option key={j.id} value={j.id}>{j.serialNo} — {j.jobDescription.slice(0, 70)}</option>
              ))}
            </select>
          )}

          {jsa && (
            <div className="space-y-2 text-sm p-3 bg-nnpc-green-light/40 rounded-lg">
              <div className="flex items-center gap-2 text-nnpc-green-dark font-medium">
                <FileCheck size={16} /> {jsa.serialNo} — approved by FSC Owner & HSE
              </div>
              <div className="grid sm:grid-cols-2 gap-1 text-muted-foreground">
                <span>Facility: {facilities?.find((f) => f.id === jsa.facilityId)?.name}</span>
                <span>Asset: {assets?.find((a) => a.id === jsa.assetId)?.name}</span>
                <span>Location: {locations?.find((l) => l.id === jsa.locationId)?.name}</span>
                <span>Schedule: {new Date(jsa.scheduledStart).toLocaleString()} → {new Date(jsa.scheduledEnd).toLocaleString()}</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant={jsa.riskCategory === 'Critical' || jsa.riskCategory === 'High' ? 'destructive' : jsa.riskCategory === 'Medium' ? 'warning' : 'success'}>{jsa.riskCategory} Risk</Badge>
                {jsa.gasTestRequired && <Badge variant="warning">Gas Test Required</Badge>}
                {jsa.isolationRequired && <Badge variant="warning">Isolation / LOTO Required</Badge>}
                {!jsa.simopsRequired && (
                  <span className="inline-flex items-center gap-1 text-xs text-nnpc-green font-medium">
                    <ShieldCheck size={14} /> No SIMOPS conflict
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents — everything required */}
      {jsa && (
        <Card>
          <CardHeader>
            <CardTitle>Pre-Job Documents (all required)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {jsa.requiredDocuments.map((docType) => {
              const uploaded = docs.some((d) => d.type === docType);
              return (
                <div key={docType} className="flex items-center justify-between p-2 rounded border border-border">
                  <div className="flex items-center gap-2 text-sm">
                    {uploaded ? (
                      <Check size={16} className="text-nnpc-green" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border-2 border-nnpc-gold" />
                    )}
                    <span className={uploaded ? 'text-muted-foreground' : ''}>{docType}</span>
                    <Badge variant="destructive" className="text-[10px]">Required</Badge>
                  </div>
                  {!uploaded ? (
                    <Button size="sm" variant="outline" onClick={() => addDoc(docType)}>
                      Upload (Mock)
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Uploaded</span>
                  )}
                </div>
              );
            })}
            {missingDocs.length > 0 ? (
              <p className="text-xs text-nnpc-red pt-2">
                {missingDocs.length} document(s) outstanding — all documents must be uploaded before submission.
              </p>
            ) : (
              <p className="text-xs text-nnpc-green font-medium pt-2">All required documents uploaded ✓</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      {jsa && (
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={createPermit.isPending || missingDocs.length > 0}
          >
            {createPermit.isPending ? 'Submitting...' : 'Raise PTW & Submit for HSE Review'}
          </Button>
        </div>
      )}
    </div>
  );
}
