import { useUpdatePermit, useUpdateJSA, useCreateAuditEntry, useCreateNotification } from '@/shared/api/queries';
import { useAppStore } from '@/shared/store';
import { create, update } from '@/shared/api/client';
import { useQueryClient } from '@tanstack/react-query';
import type { Permit, JSA, Role } from '@/entities/types';

export function usePermitActions() {
  const updatePermit = useUpdatePermit();
  const updateJSA = useUpdateJSA();
  const createAudit = useCreateAuditEntry();
  const createNotif = useCreateNotification();
  const currentUser = useAppStore((s) => s.currentUser);
  const qc = useQueryClient();

  async function notify(roles: string[], permitId: string, message: string) {
    const now = new Date().toISOString();
    for (const role of roles) {
      await createNotif.mutateAsync({
        id: `ntf-${Date.now()}-${role.replace(/\s+/g, '')}`,
        role: role as Role,
        permitId,
        message,
        read: false,
        createdAt: now,
      });
    }
  }

  async function transitionPermit(
    permit: Permit,
    newStatus: string,
    action: string,
    detail: string,
    notifyRoles?: string[],
  ) {
    const now = new Date().toISOString();
    await updatePermit.mutateAsync({
      id: permit.id,
      status: newStatus,
      updatedAt: now,
      history: [...permit.history, { stage: newStatus, at: now, byUserId: currentUser?.id ?? '', note: detail }],
    });
    await createAudit.mutateAsync({
      id: `aud-${Date.now()}`,
      permitId: permit.id,
      actorId: currentUser?.id ?? '',
      action,
      detail,
      at: now,
    });
    if (notifyRoles) await notify(notifyRoles, permit.id, `${permit.permitNumber}: ${detail}`);
  }

  async function transitionJSA(
    jsa: JSA,
    newStatus: string,
    action: string,
    detail: string,
    notifyRoles?: string[],
    extra?: Partial<JSA>,
  ) {
    const now = new Date().toISOString();
    await updateJSA.mutateAsync({
      id: jsa.id,
      status: newStatus as JSA['status'],
      updatedAt: now,
      history: [...jsa.history, { stage: newStatus, at: now, byUserId: currentUser?.id ?? '', note: detail }],
      ...extra,
    });
    await createAudit.mutateAsync({
      id: `aud-${Date.now()}`,
      permitId: jsa.id,
      actorId: currentUser?.id ?? '',
      action,
      detail,
      at: now,
    });
    if (notifyRoles) await notify(notifyRoles, jsa.id, `${jsa.serialNo}: ${detail}`);
  }

  async function createSubRecord<T>(resource: string, data: Partial<T>) {
    const result = await create<T>(resource, data);
    qc.invalidateQueries({ queryKey: [resource] });
    return result;
  }

  async function updateSubRecord<T>(resource: string, id: string, data: Partial<T>) {
    const result = await update<T>(resource, id, data);
    qc.invalidateQueries({ queryKey: [resource] });
    return result;
  }

  return {
    transitionPermit,
    transitionJSA,
    createSubRecord,
    updateSubRecord,
    notify,
    isPending: updatePermit.isPending || updateJSA.isPending,
  };
}
