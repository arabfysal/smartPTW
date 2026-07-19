import { X, Printer } from 'lucide-react';
import { NNPCLogo } from '@/shared/ui/nnpc-logo';
import { Button } from '@/shared/ui/button';
import {
  useFacilities, useAssets, useLocations, useUsers, useJSA,
  useSiteVerificationsRecord, useCloseoutsRecord,
} from '@/shared/api/queries';
import type { Permit } from '@/entities/types';

/**
 * Work Completion Certificate — issued after FSC Owner closeout & archive.
 * NNPC letterhead, description & location of the work, HSE and FSC signatories. Printable.
 */
export function CompletionCertificate({ permit, onClose }: { permit: Permit; onClose: () => void }) {
  const { data: facilities } = useFacilities();
  const { data: assets } = useAssets();
  const { data: locations } = useLocations();
  const { data: users } = useUsers();
  const { data: jsa } = useJSA(permit.jsaId);
  const { data: verifications } = useSiteVerificationsRecord(permit.id);
  const { data: closeouts } = useCloseoutsRecord(permit.id);

  const facility = facilities?.find((f) => f.id === permit.facilityId);
  const asset = assets?.find((a) => a.id === permit.assetId);
  const location = locations?.find((l) => l.id === permit.locationId);
  const contractor = users?.find((u) => u.id === permit.contractorId);
  const applicant = users?.find((u) => u.id === permit.applicantId);

  const verification = verifications?.[0];
  const closeout = closeouts?.[0];
  const hseUser = users?.find((u) => u.id === (closeout?.hseClosedBy || verification?.verifiedBy));
  const fscUser = users?.find((u) => u.id === closeout?.fscClosedBy);

  const d = (s?: string | null) => (s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—');

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-start justify-center overflow-y-auto p-4" onClick={onClose}>
      <div className="bg-white text-gray-900 rounded-lg shadow-2xl max-w-3xl w-full my-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-gray-200 print:hidden">
          <span className="font-semibold text-sm">Work Completion Certificate — {permit.permitNumber}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer size={14} className="mr-1" /> Print
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}><X size={16} /></Button>
          </div>
        </div>

        <div className="p-8 text-[13px] leading-relaxed">
          {/* Ornamental border */}
          <div className="border-4 border-double border-nnpc-green-dark p-8">
            <div className="flex flex-col items-center text-center">
              <NNPCLogo size={64} />
              <p className="font-bold uppercase mt-3">Nigerian National Petroleum Company Limited</p>
              <p className="text-xs text-gray-600">{facility?.name} · {facility?.location}</p>

              <p className="font-bold text-2xl tracking-wide uppercase mt-6 text-nnpc-green-dark">
                Work Completion Certificate
              </p>
              <div className="w-24 h-0.5 bg-nnpc-gold my-3" />

              <p className="mt-2">This is to certify that the work described below has been satisfactorily completed,</p>
              <p>the worksite verified safe by HSE, and the permit formally closed out by the Facility (FSC) Owner.</p>
            </div>

            <div className="mt-6 space-y-2">
              <div className="grid grid-cols-[180px_1fr] gap-x-3 gap-y-1.5">
                <span className="font-semibold text-right">Permit Number:</span>
                <span className="font-mono">{permit.permitNumber}</span>
                <span className="font-semibold text-right">Description of Work:</span>
                <span>{jsa?.jobDescription}</span>
                <span className="font-semibold text-right">Facility:</span>
                <span>{facility?.name}</span>
                <span className="font-semibold text-right">Asset / Equipment:</span>
                <span>{asset?.name}</span>
                <span className="font-semibold text-right">Work Location:</span>
                <span>{location?.name}</span>
                <span className="font-semibold text-right">Executed By:</span>
                <span>{contractor ? `${contractor.name} (${contractor.company ?? 'Contractor'})` : `${applicant?.name} (In-House)`}</span>
                <span className="font-semibold text-right">Work Period:</span>
                <span>{d(permit.scheduledStart)} — {d(permit.scheduledEnd)}</span>
                <span className="font-semibold text-right">JSA Reference:</span>
                <span>{jsa?.serialNo}</span>
                <span className="font-semibold text-right">Closed & Archived:</span>
                <span>{d(closeout?.fscClosedAt)}</span>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-10 mt-10">
              <div className="text-center">
                <p className="italic text-lg">{hseUser?.name ?? ''}</p>
                <div className="border-t border-gray-800 mt-1 pt-1">
                  <p className="font-semibold">HSE Officer</p>
                  <p className="text-xs text-gray-600">Site verified safe · {d(verification?.verifiedAt || closeout?.hseClosedAt)}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="italic text-lg">{fscUser?.name ?? ''}</p>
                <div className="border-t border-gray-800 mt-1 pt-1">
                  <p className="font-semibold">FSC / Facility Owner</p>
                  <p className="text-xs text-gray-600">Final closeout · {d(closeout?.fscClosedAt)}</p>
                </div>
              </div>
            </div>

            <p className="text-center text-[10px] text-gray-500 mt-8">
              Issued via SmartPTW · Ref {permit.permitNumber} · Printed {new Date().toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
