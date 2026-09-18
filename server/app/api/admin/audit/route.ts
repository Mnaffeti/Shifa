import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, ok, unauthorized } from '@/lib/api';
import type { AuditAction, Prisma } from '@prisma/client';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const ACTIONS: AuditAction[] = [
  'DOCTOR_CREATED', 'DOCTOR_UPDATED', 'DOCTOR_ACTIVATED', 'DOCTOR_DEACTIVATED',
  'DOCTOR_DELETED', 'DOCTOR_PASSWORD_RESET', 'REQUEST_ACCEPTED', 'REQUEST_REJECTED',
];

/**
 * GET /api/admin/audit — the back-office action log, newest first. ADMIN only.
 *
 * Read-only by design: there is no endpoint to edit or delete an entry, since
 * a trail an operator can rewrite proves nothing.
 *
 * Query params: ?action= to filter, ?targetId= for one account's history,
 * ?limit= and ?cursor= to page (the cursor is the last id of the previous page).
 */
export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const targetId = url.searchParams.get('targetId');
    const cursor = url.searchParams.get('cursor');

    // Cap the page size: this endpoint is paged, and an unbounded limit would
    // let one request pull the entire history into memory.
    const requested = Number.parseInt(url.searchParams.get('limit') ?? '', 10);
    const limit = Number.isFinite(requested)
      ? Math.min(Math.max(requested, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const where: Prisma.AuditLogWhereInput = {
      // Ignore an unknown action rather than returning an empty page that
      // looks like "no activity".
      ...(action && ACTIONS.includes(action as AuditAction)
        ? { action: action as AuditAction }
        : {}),
      ...(targetId ? { targetId } : {}),
    };

    // Fetch one extra row to tell whether another page exists.
    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const entries = hasMore ? rows.slice(0, limit) : rows;

    return ok({
      entries: entries.map(e => ({
        id: e.id,
        action: e.action,
        actorName: e.actorName,
        targetLabel: e.targetLabel,
        details: e.details,
        createdAt: e.createdAt.toISOString(),
      })),
      nextCursor: hasMore ? entries[entries.length - 1].id : null,
    });
  } catch (err) {
    console.error('[api/admin/audit]', err);
    return fail('Erreur serveur', 500);
  }
}
