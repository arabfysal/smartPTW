import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { usePermitActions } from '@/shared/hooks/usePermitActions';
import { useAppStore } from '@/shared/store';
import type { Permit } from '@/entities/types';
import { canPerform } from '@/shared/permissions';

export function FinalApprovalPanel({ permit }: { permit: Permit }) {
  const role = useAppStore((s) => s.currentRole);
  const currentUser = useAppStore((s) => s.currentUser);
  const { transitionPermit, createSubRecord, isPending } = usePermitActions();
  const [signatureName, setSignatureName] = useState('');

  const canSign = canPerform(permit.status, role, 'final_approve_sign');

  async function handleApprove() {
    await createSubRecord('finalApprovals', {
      id: `fa-${Date.now()}`,
      permitId: permit.id,
      approverId: currentUser?.id ?? '',
      signedAt: new Date().toISOString(),
    });
    await transitionPermit(
      permit, 'active', 'permit_activated',
      `Permit activated — final authorisation by ${signatureName} (${role})`,
      ['Applicant', 'Contractor', 'HSE Officer'],
    );
  }

  if (!canSign) {
    return (
      <Card>
        <CardHeader><CardTitle>Final Approval</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">Awaiting FSC Owner final authorisation.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Final Approval & Permit Activation</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          By signing below, you authorize activation of this permit. All prerequisite reviews have been completed.
        </p>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Digital Signature</label>
          <input
            value={signatureName}
            onChange={(e) => setSignatureName(e.target.value)}
            placeholder="Full name as digital signature"
            className="h-9 rounded-md border border-input bg-card px-3 text-sm italic"
          />
        </div>
        <Button onClick={handleApprove} disabled={isPending || !signatureName}>
          Issue Permit — Activate
        </Button>
      </CardContent>
    </Card>
  );
}
