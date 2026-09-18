import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, notFound, ok, parseBody, unauthorized } from '@/lib/api';
import { adminTrialSchema } from '@/lib/schemas';
import { recordAudit } from '@/lib/audit';
import { trialDaysLeft } from '@/lib/trial';

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/doctors/:id/trial — extend or end a free trial. ADMIN only.
 *
 * This is what makes trial expiry recoverable. Expiry blocks sign-in outright,
 * so without a one-click way to grant more time or convert to a paid plan, a
 * doctor locked out of their own patient records would need a manual database
 * edit to get back in.
 *
 * Body is either `{ extendDays: n }` or `{ convert: true }`.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    const { id } = await params;
    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing) return notFound('Compte');
    if (existing.role !== 'DOCTOR') {
      return fail('Seuls les comptes médecins ont une période d’essai', 403);
    }

    const parsed = await parseBody(request, adminTrialSchema);
    if (!parsed.ok) return parsed.response;

    let trialEndsAt: Date | null;

    if ('convert' in parsed.data) {
      // Null means unlimited: the account is now on a paid plan.
      trialEndsAt = null;
    } else {
      // Count from today when the trial has already lapsed, rather than from
      // the old end date — extending an account that expired a month ago
      // should give a full fresh window, not one that is already half gone.
      const now = new Date();
      const base = existing.trialEndsAt && existing.trialEndsAt > now
        ? existing.trialEndsAt
        : now;
      trialEndsAt = new Date(base);
      trialEndsAt.setDate(trialEndsAt.getDate() + parsed.data.extendDays);
    }

    const account = await prisma.account.update({
      where: { id },
      data: { trialEndsAt },
    });

    await recordAudit({
      actor: user,
      action: 'convert' in parsed.data ? 'TRIAL_CONVERTED' : 'TRIAL_EXTENDED',
      target: account,
      details: 'convert' in parsed.data
        ? 'Accès illimité (offre payante)'
        : `+${parsed.data.extendDays} jour(s) · fin le ${trialEndsAt!.toISOString().split('T')[0]}`,
    });

    return ok({
      doctor: {
        id: account.id,
        name: account.name,
        trialEndsAt: account.trialEndsAt?.toISOString() ?? null,
        trialDaysLeft: trialDaysLeft(account),
      },
    });
  } catch (err) {
    console.error('[api/admin/doctors/:id/trial]', err);
    return fail('Erreur serveur', 500);
  }
}
