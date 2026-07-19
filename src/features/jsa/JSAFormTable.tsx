import { Button } from '@/shared/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { JSARow } from '@/entities/types';

interface Props {
  rows: JSARow[];
  onChange: (rows: JSARow[]) => void;
  readOnly?: boolean;
}

/** Editable NNPC JSA hazard-analysis table — auto-populated from work types, editable by the applicant */
export function JSAFormTable({ rows, onChange, readOnly }: Props) {
  function updateRow(idx: number, field: keyof JSARow, value: string) {
    onChange(rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    onChange([...rows, { sn: rows.length + 1, jobStep: '', potentialHazards: '', risks: '', riskLevel: 'M', controls: '', actionParty: '' }]);
  }

  function removeRow(idx: number) {
    onChange(rows.filter((_, i) => i !== idx).map((r, i) => ({ ...r, sn: i + 1 })));
  }

  const ta = 'w-full text-xs border border-input rounded p-1.5 bg-card resize-y min-h-16 disabled:bg-muted/50 disabled:text-muted-foreground';

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-nnpc-green-dark text-white">
              <th className="border border-border p-2 w-8">S/N</th>
              <th className="border border-border p-2 text-left w-[20%]">Sequence of Key Job Steps</th>
              <th className="border border-border p-2 text-left w-[16%]">Potential Hazards</th>
              <th className="border border-border p-2 text-left w-[14%]">Risks</th>
              <th className="border border-border p-2 w-20">Risk Level</th>
              <th className="border border-border p-2 text-left w-[24%]">Recommended Controls in place</th>
              <th className="border border-border p-2 text-left w-[12%]">Action Party</th>
              {!readOnly && <th className="border border-border p-2 w-8" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="align-top">
                <td className="border border-border p-2 text-center font-medium">{r.sn}</td>
                <td className="border border-border p-1">
                  <textarea className={ta} value={r.jobStep} disabled={readOnly} onChange={(e) => updateRow(i, 'jobStep', e.target.value)} />
                </td>
                <td className="border border-border p-1">
                  <textarea className={ta} value={r.potentialHazards} disabled={readOnly} onChange={(e) => updateRow(i, 'potentialHazards', e.target.value)} />
                </td>
                <td className="border border-border p-1">
                  <textarea className={ta} value={r.risks} disabled={readOnly} onChange={(e) => updateRow(i, 'risks', e.target.value)} />
                </td>
                <td className="border border-border p-1 text-center">
                  <select
                    value={r.riskLevel}
                    disabled={readOnly}
                    onChange={(e) => updateRow(i, 'riskLevel', e.target.value)}
                    className={`rounded border border-input p-1 text-xs font-bold ${
                      r.riskLevel === 'H' ? 'text-nnpc-red' : r.riskLevel === 'M' ? 'text-nnpc-gold' : 'text-nnpc-green'
                    }`}
                  >
                    <option value="H">H</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                  </select>
                </td>
                <td className="border border-border p-1">
                  <textarea className={ta} value={r.controls} disabled={readOnly} onChange={(e) => updateRow(i, 'controls', e.target.value)} />
                </td>
                <td className="border border-border p-1">
                  <textarea className={ta} value={r.actionParty} disabled={readOnly} onChange={(e) => updateRow(i, 'actionParty', e.target.value)} />
                </td>
                {!readOnly && (
                  <td className="border border-border p-1 text-center">
                    <button onClick={() => removeRow(i)} className="text-nnpc-red hover:bg-nnpc-red/10 p-1 rounded cursor-pointer" title="Remove row">
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus size={14} className="mr-1" /> Add Job Step
        </Button>
      )}
    </div>
  );
}
