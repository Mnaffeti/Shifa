import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, notFound, ok, unauthorized } from '@/lib/api';
import { recordAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

/**
 * DELETE /api/admin/admins/:id — remove an administrator. ADMIN only.
 *
 * Two refusals guard against locking everyone out of the back office, since
 * there is no way back in short of shell access to run db:create-admin:
 *
 *  - you cannot delete yourself (an accidental click would end your session),
 *  - you cannot delete the last remaining admin.
 */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    const { id } = await params;
    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing) return notFound('Compte');
    if (existing.role !== 'ADMIN') {
      return fail('Ce compte n’est pas un administrateur', 403);
    }

    if (existing.id === user.id) {
      return fail(
        'Vous ne pouvez pas supprimer votre propre compte administrateur. ' +
        'Demandez à un autre administrateur de le faire.',
        403,
      );
    }

    const remaining = await prisma.account.count({ where: { role: 'ADMIN' } });
    if (remaining <= 1) {
      return fail(
        'Impossible de supprimer le dernier administrateur : plus personne ne ' +
        'pourrait accéder au back-office.',
        409,
      );
    }

    await prisma.account.delete({ where: { id } });

    // Label the target: its id no longer resolves after the delete.
    await recordAudit({
      actor: user,
      action: 'ADMIN_DELETED',
      targetLabel: `${existing.name} (${existing.email ?? '—'})`,
    });

    return ok({ success: true as const });
  } catch (err) {
    console.error('[api/admin/admins/:id DELETE]', err);
    return fail('Erreur serveur', 500);
  }
}
