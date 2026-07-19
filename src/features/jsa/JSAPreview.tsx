import { X, Printer } from 'lucide-react';
import { NNPCLogo } from '@/shared/ui/nnpc-logo';
import { Button } from '@/shared/ui/button';
import { useFacilities, useLocations, useUsers } from '@/shared/api/queries';
import type { JSA } from '@/entities/types';

/**
 * Renders the filled JSA in the official NNPC Job Safety Analysis form layout —
 * logo, header block, hazard table with H/M/L risk levels, stop-work box,
 * comments and Reviewed by / Approved by signature blocks.
 */
export function JSAPreview({ jsa, onClose }: { jsa: JSA; onClose: () => void }) {
  const { data: facilities } = useFacilities();
  const { data: locations } = useLocations();
  const { data: users } = useUsers();

  const facility = facilities?.find((f) => f.id === jsa.facilityId);
  const location = locations?.find((l) => l.id === jsa.locationId);
  const preparedBy = users?.find((u) => u.id === jsa.applicantId);
  const reviewedBy = users?.find((u) => u.id === jsa.fscReviewedBy);
  const approvedBy = users?.find((u) => u.id === jsa.hseApprovedBy);

  const cell = 'border border-gray-800 px-2 py-1.5 align-top';

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-start justify-center overflow-y-auto p-4" onClick={onClose}>
      <div
        className="bg-white text-gray-900 rounded-lg shadow-2xl max-w-5xl w-full my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal controls */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 print:hidden">
          <span className="font-semibold text-sm">JSA Preview — {jsa.serialNo}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer size={14} className="mr-1" /> Print
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}><X size={16} /></Button>
          </div>
        </div>

        {/* ===== NNPC JSA FORM ===== */}
        <div className="p-6 text-[13px] leading-snug">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-3">
              <NNPCLogo size={56} />
              <span className="font-bold text-lg tracking-wide">NNPC</span>
            </div>
            <div className="text-center flex-1 px-4">
              <p className="font-bold uppercase">Nigerian National Petroleum Company Limited</p>
              <p className="font-bold uppercase text-xs">{facility?.name ?? 'Insert in full BU/SU name'}</p>
            </div>
            <div className="font-bold text-2xl">JSA</div>
          </div>

          <p className="text-center font-bold underline uppercase my-3">Job Safety Analysis Form</p>

          {/* Header fields */}
          <table className="w-full border-collapse mb-0">
            <tbody>
              <tr>
                <td className={cell} colSpan={3}>
                  <span className="font-semibold">In-House/Contractor: </span>{jsa.inHouseOrContractor}
                </td>
                <td className={cell} colSpan={2}>
                  <span className="font-semibold">Emergency No: </span>{jsa.emergencyNo}
                </td>
              </tr>
              <tr>
                <td className={cell} style={{ width: '28%' }}>
                  <span className="font-semibold">Job Description: </span>{jsa.jobDescription}
                </td>
                <td className={cell} style={{ width: '24%' }}>
                  <span className="font-semibold">Job Location: </span>{location?.name}
                </td>
                <td className={cell} style={{ width: '28%' }} colSpan={2}>
                  <div><span className="font-semibold">Prepared by: </span>{preparedBy?.name}</div>
                  <div className="flex justify-between mt-1">
                    <span><span className="font-semibold">Sign: </span><span className="italic">{preparedBy?.name}</span></span>
                    <span><span className="font-semibold">Date: </span>{new Date(jsa.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                </td>
                <td className={cell} style={{ width: '20%' }}>
                  <span className="font-semibold">Serial No: </span>{jsa.serialNo}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Hazard analysis table */}
          <table className="w-full border-collapse -mt-px">
            <thead>
              <tr className="text-left">
                <td className={`${cell} font-semibold text-center`} rowSpan={2} style={{ width: '4%' }}>S/N</td>
                <td className={`${cell} font-semibold`} rowSpan={2} style={{ width: '20%' }}>Sequence of Key<br />Job Steps</td>
                <td className={`${cell} font-semibold`} rowSpan={2} style={{ width: '16%' }}>Potential<br />Hazards</td>
                <td className={`${cell} font-semibold`} rowSpan={2} style={{ width: '14%' }}>Risks</td>
                <td className={`${cell} font-semibold text-center`} colSpan={3}>Risk Level</td>
                <td className={`${cell} font-semibold`} rowSpan={2} style={{ width: '24%' }}>Recommended Controls in place</td>
                <td className={`${cell} font-semibold`} rowSpan={2} style={{ width: '10%' }}>Action Party</td>
              </tr>
              <tr>
                <td className={`${cell} font-semibold text-center`} style={{ width: '4%' }}>H</td>
                <td className={`${cell} font-semibold text-center`} style={{ width: '4%' }}>M</td>
                <td className={`${cell} font-semibold text-center`} style={{ width: '4%' }}>L</td>
              </tr>
            </thead>
            <tbody>
              {jsa.rows.map((r) => (
                <tr key={r.sn}>
                  <td className={`${cell} text-center`}>{r.sn}</td>
                  <td className={cell}>{r.jobStep}</td>
                  <td className={cell}>{r.potentialHazards}</td>
                  <td className={cell}>{r.risks}</td>
                  <td className={`${cell} text-center font-bold`}>{r.riskLevel === 'H' ? '✕' : ''}</td>
                  <td className={`${cell} text-center font-bold`}>{r.riskLevel === 'M' ? '✕' : ''}</td>
                  <td className={`${cell} text-center font-bold`}>{r.riskLevel === 'L' ? '✕' : ''}</td>
                  <td className={cell}>{r.controls}</td>
                  <td className={cell}>{r.actionParty}</td>
                </tr>
              ))}
              {/* pad to minimum 4 rows like the paper form */}
              {Array.from({ length: Math.max(0, 4 - jsa.rows.length) }).map((_, i) => (
                <tr key={`pad-${i}`}>
                  {Array.from({ length: 9 }).map((_, j) => <td key={j} className={cell}>&nbsp;</td>)}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Stop work + authorization */}
          <table className="w-full border-collapse -mt-px">
            <tbody>
              <tr>
                <td className={cell} style={{ width: '62%' }}>
                  <p className="font-semibold">Indicate conditions, job changes or distractions that can result to Stop Work</p>
                  <p className="font-semibold mt-1">Authority on the Job:</p>
                  <p className="mt-1">{jsa.stopWorkConditions}</p>
                </td>
                <td className={cell} style={{ width: '38%' }}>
                  <span className="font-semibold">Authorization</span>
                  {jsa.status === 'approved' && (
                    <p className="mt-1 text-nnpc-green font-medium">Authorised via SmartPTW — {jsa.serialNo}</p>
                  )}
                </td>
              </tr>
              <tr>
                <td className={cell}>
                  <span className="font-semibold">Comments if any:</span>
                  <p className="mt-1 min-h-16">{jsa.comments}</p>
                </td>
                <td className="p-0 border border-gray-800">
                  <table className="w-full border-collapse h-full">
                    <tbody>
                      <tr>
                        <td className="border-r border-gray-800 px-2 py-1.5 align-top" style={{ width: '50%' }}>
                          <p className="font-semibold">Reviewed by:</p>
                          <p>{reviewedBy?.name ?? ''}</p>
                          <p className="font-semibold mt-3">Sign:</p>
                          <p className="italic">{reviewedBy?.name ?? ''}</p>
                          <p className="font-semibold mt-3">Date:</p>
                          <p>{jsa.fscReviewedAt ? new Date(jsa.fscReviewedAt).toLocaleDateString('en-GB') : ''}</p>
                        </td>
                        <td className="px-2 py-1.5 align-top">
                          <p className="font-semibold">Approved by:</p>
                          <p>{approvedBy?.name ?? ''}</p>
                          <p className="font-semibold mt-3">Sign:</p>
                          <p className="italic">{approvedBy?.name ?? ''}</p>
                          <p className="font-semibold mt-3">Date:</p>
                          <p>{jsa.hseApprovedAt ? new Date(jsa.hseApprovedAt).toLocaleDateString('en-GB') : ''}</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
