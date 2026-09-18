import { prisma } from './prisma';
import type { SessionUser } from './auth';
import type { Account, AuditAction } from '@prisma/client';

/**
 * Append-only audit trail for back-office actions.
 *
 * Every entry copies in the names it needs, so it still reads correctly after
 * the accounts it refers to are renamed or deleted. Nothing here ever updates
 * or removes an entry.
 */

/** "Dr. Youssef (DOC-0001)" — how a target reads in the log, fixed at write time. */
export function accountLabel(account: Pick<Account, 'name' | 'matricule' | 'email'>): string {
  const identifier = account.matricule ?? account.email;
  return identifier ? `${account.name} (${identifier})` : account.name;
}

interface RecordInput {
  actor: SessionUser;
  action: AuditAction;
  target?: Pick<Account, 'id' | 'name' | 'matricule' | 'email'> | null;
  /** Explicit label when the target is not an account row (e.g. a request). */
  targetLabel?: string;
  targetId?: string;
  /** Human-readable specifics. Never include a password, even a temporary one. */
  details?: string;
}

/**
 * Writes one audit entry.
 *
 * Best-effort on purpose: a failure here is logged but never propagated, so a
 * hiccup in the audit table cannot block an admin from deactivating a
 * compromised account. Call it *after* the action it records has succeeded.
 */
export async function recordAudit(input: RecordInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        actorId: input.actor.id,
        actorName: input.actor.name,
        targetId: input.target?.id ?? input.targetId ?? null,
        targetLabel: input.target ? accountLabel(input.target) : input.targetLabel ?? '—',
        details: input.details ?? null,
      },
    });
  } catch (err) {
    console.error('[audit] write failed', input.action, err);
  }
}

/**
 * Describes what a PATCH actually changed, for the `details` column.
 *
 * Only names the fields, with before/after values for the short ones — enough
 * to answer "who changed this and to what" without duplicating the record.
 */
export function describeChanges(
  before: Pick<Account, 'name' | 'matricule' | 'specialty' | 'phone'>,
  after: Pick<Account, 'name' | 'matricule' | 'specialty' | 'phone'>,
): string | undefined {
  const parts: string[] = [];
  if (before.name !== after.name) parts.push(`nom : « ${before.name} » → « ${after.name} »`);
  if (before.matricule !== after.matricule) parts.push(`matricule : ${before.matricule} → ${after.matricule}`);
  if (before.specialty !== after.specialty) parts.push(`spécialité : ${before.specialty ?? '—'} → ${after.specialty ?? '—'}`);
  if (before.phone !== after.phone) parts.push(`téléphone : ${before.phone ?? '—'} → ${after.phone ?? '—'}`);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}
