import { X, Printer } from 'lucide-react';
import { NNPCLogo } from '@/shared/ui/nnpc-logo';
import { Button } from '@/shared/ui/button';
import {
  useFacilities, useAssets, useLocations, useUsers, useJSA,
  useHSEReviews, useFinalApprovals, useContractorAcceptances, useGasTests, useIsolationCertificates,
} from '@/shared/api/queries';
import type { Permit } from '@/entities/types';

/**
 * Official printable Permit to Work — carried on site and shown to HSE / FSC /
 * inspectors on request. NNPC letterhead, full details and all signatories.
 */
export function PermitPrintView({ permit, onClose }: { permit: Permit; onClose: () => void }) {
  const { data: facilities } = useFacilities();
  const { data: assets } = useAssets();
  const { data: locations } = useLocations();
  const { data: users } = useUsers();
  const { data: jsa } = useJSA(permit.jsaId);
  const { data: hseReviews } = useHSEReviews(permit.id);
  const { data: finalApprovals } = useFinalApprovals(permit.id);
  const { data: acceptances } = useContractorAcceptances(permit.id);
  const { data: gasTests } = useGasTests(permit.id);
  const { data: isoCerts } = useIsolationCertificates(permit.id);

  const facility = facilities?.find((f) => f.id === permit.facilityId);
  const asset = assets?.find((a) => a.id === permit.assetId);
  const location = locations?.find((l) => l.id === permit.locationId);
  const applicant = users?.find((u) => u.id === permit.applicantId);
  const contractor = users?.find((u) => u.id === permit.contractorId);

  const hse = hseReviews?.find((r) => r.decision === 'approved');
  const hseUser = users?.find((u) => u.id === hse?.inspectorId);
  const fa = finalApprovals?.[0];
  const fscUser = users?.find((u) => u.id === fa?.approverId);
  const acceptance = acceptances?.[0];
  const gas = gasTests?.filter((g) => g.status === 'approved').sort((a, b) => b.testedAt.localeCompare(a.testedAt))[0];
  const iso_ = isoCerts?.find((i) => i.status === 'approved');

  const cell = 'border border-gray-800 px-2 py-1.5 align-top';
  const dt = (s?: string | null) => (s ? new Date(s).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-start justify-center overflow-y-auto p-4" onClick={onClose}>
      <div className="bg-white text-gray-900 rounded-lg shadow-2xl max-w-4xl w-full my-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-gray-200 print:hidden">
          <span className="font-semibold text-sm">Permit to Work — {permit.permitNumber}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer size={14} className="mr-1" /> Print
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}><X size={16} /></Button>
          </div>
        </div>

        <div className="p-6 text-[13px] leading-snug">
          {/* Letterhead */}
          <div className="flex items-center justify-between border-b-4 border-nnpc-green-dark pb-3 mb-3">
            <div className="flex items-center gap-3">
              <NNPCLogo size={54} />
              <div>
                <p className="font-bold uppercase">Nigerian National Petroleum Company Limited</p>
                <p className="text-xs text-gray-600">{facility?.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-xl">PERMIT TO WORK</p>
              <p className="font-mono font-semibold">{permit.permitNumber}</p>
              <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold uppercase border-2 ${
                permit.status === 'active' ? 'border-green-700 text-green-700' :
                permit.status === 'suspended' ? 'border-red-700 text-red-700' : 'border-gray-500 text-gray-600'
              }`}>
                {permit.status === 'active' ? 'ACTIVE' : permit.status === 'suspended' ? 'SUSPENDED' : permit.status}
              </span>
            </div>
          </div>

          {/* Details */}
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className={cell} style={{ width: '50%' }}><span className="font-semibold">Job Description: </span>{jsa?.jobDescription}</td>
                <td className={cell}><span className="font-semibold">JSA Ref: </span>{jsa?.serialNo} (Approved)</td>
              </tr>
              <tr>
                <td className={cell}><span className="font-semibold">Asset / Equipment: </span>{asset?.name}</td>
                <td className={cell}><span className="font-semibold">Work Location: </span>{location?.name}</td>
              </tr>
              <tr>
                <td className={cell}><span className="font-semibold">Valid From: </span>{dt(permit.scheduledStart)}</td>
                <td className={cell}><span className="font-semibold">Valid To: </span>{dt(permit.scheduledEnd)}</td>
              </tr>
              <tr>
                <td className={cell}>
                  <span className="font-semibold">Work Types: </span>{permit.natureOfWork.join(', ')}
                </td>
                <td className={cell}>
                  <span className="font-semibold">Risk Category: </span>
                  <span className={permit.riskCategory === 'High' || permit.riskCategory === 'Critical' ? 'text-red-700 font-bold' : 'font-semibold'}>
                    {permit.riskCategory}
                  </span>
                </td>
              </tr>
              <tr>
                <td className={cell} colSpan={2}>
                  <span className="font-semibold">Required PPE: </span>{permit.requiredPPE.join(' · ')}
                </td>
              </tr>
              {(gas || iso_) && (
                <tr>
                  {gas && (
                    <td className={cell} colSpan={iso_ ? 1 : 2}>
                      <span className="font-semibold">Gas Test (approved): </span>
                      O2 {gas.readings.o2} · LEL {gas.readings.lel} · H2S {gas.readings.h2s} · CO {gas.readings.co}
                      <span className="block text-xs text-gray-600">Valid until {dt(gas.validUntil)} — retest on expiry</span>
                    </td>
                  )}
                  {iso_ && (
                    <td className={cell} colSpan={gas ? 1 : 2}>
                      <span className="font-semibold">Isolation / LOTO (approved): </span>{iso_.type}
                      <span className="block text-xs text-gray-600">{iso_.isolationPoints}</span>
                    </td>
                  )}
                </tr>
              )}
              <tr>
                <td className={cell} colSpan={2}>
                  <span className="font-semibold">Permit Conditions:</span>
                  <ul className="list-disc ml-5 mt-1 space-y-0.5 text-xs">
                    <li>This permit is automatically <strong>suspended daily at 18:00 (6:00 PM)</strong>; work stops and the permit is revalidated with the FSC Owner each morning before resuming.</li>
                    <li>All personnel must comply with NNPC Limited HSE regulations, policies and site rules at all times.</li>
                    <li>Any NNPC personnel may exercise Stop Work Authority on this job.</li>
                    <li>Toolbox talk to be conducted before each shift; approved JSA to be available at the worksite.</li>
                    <li>This permit must be available at the work location and produced on request for inspection.</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Signatories */}
          <p className="font-bold uppercase mt-4 mb-1">Authorisations & Signatories</p>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <td className={`${cell} font-semibold bg-gray-100`}>Role</td>
                <td className={`${cell} font-semibold bg-gray-100`}>Name</td>
                <td className={`${cell} font-semibold bg-gray-100`}>Signature</td>
                <td className={`${cell} font-semibold bg-gray-100`}>Date / Time</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={cell}>Applicant / Job Owner</td>
                <td className={cell}>{applicant?.name}</td>
                <td className={`${cell} italic`}>{applicant?.name}</td>
                <td className={cell}>{dt(permit.createdAt)}</td>
              </tr>
              <tr>
                <td className={cell}>HSE Officer (Endorsement)</td>
                <td className={cell}>{hseUser?.name ?? '—'}</td>
                <td className={`${cell} italic`}>{hseUser?.name ?? ''}</td>
                <td className={cell}>{dt(hse?.reviewedAt)}</td>
              </tr>
              <tr>
                <td className={cell}>FSC Owner (Final Authorisation)</td>
                <td className={cell}>{fscUser?.name ?? '—'}</td>
                <td className={`${cell} italic`}>{fscUser?.name ?? ''}</td>
                <td className={cell}>{dt(fa?.signedAt)}</td>
              </tr>
              <tr>
                <td className={cell}>Contractor / Performing Authority</td>
                <td className={cell}>{contractor?.name ?? applicant?.name}</td>
                <td className={`${cell} italic`}>{contractor?.name ?? ''}</td>
                <td className={cell}>{dt(acceptance?.signedAt)}</td>
              </tr>
            </tbody>
          </table>

          <p className="text-[10px] text-gray-500 mt-3">
            Generated by SmartPTW · {facility?.name} · Emergency: 0700-NNPC-HSE (0700-6672-473) · Printed {new Date().toLocaleString('en-GB')}
          </p>
        </div>
      </div>
    </div>
  );
}
