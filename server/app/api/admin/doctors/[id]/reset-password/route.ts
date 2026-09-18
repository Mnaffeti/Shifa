import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, notFound, ok, unauthorized } from '@/lib/api';
import { generateTempPassword } from '@/lib/provision-doctor';
import { recordAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/doctors/:id/reset-password — issue a new temporary password.
 * ADMIN only.
 *
 * Without this, a doctor who lost the password relayed at provisioning time
 * was locked out permanently: the plaintext is shown once and never stored,
 * and there is no self-service reset (accounts have no verified e-mail — a
 * doctor signs in with a matricule).
 *
 * The new password is returned once, exactly like provisioning, and forces a
 * change on next sign-in.
 */
export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    const { id } = await params;
    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing) return notFound('Compte');

    // Resetting an admin's password from here would let one admin take over
    // another's account without knowing the current password. Admin passwords
    // are managed with the db:create-admin script instead.
    if (existing.role !== 'DOCTOR') {
      return fail('Seuls les mots de passe des comptes médecins sont réinitialisables ici', 403);
    }

    const temporaryPassword = generateTempPassword();

    await prisma.account.update({
      where: { id },
      data: {
        passwordHash: await bcrypt.hash(temporaryPassword, 10),
        // The doctor must replace it immediately — an admin knows this value.
        mustChangePassword: true,
      },
    });

    // The generated password is never written to the log.
    await recordAudit({
      actor: user,
      action: 'DOCTOR_PASSWORD_RESET',
      target: existing,
    });

    return ok({
      doctor: {
        name: existing.name,
        matricule: existing.matricule as string,
      },
      // Shown once — the server never stores or re-displays the plaintext.
      temporaryPassword,
    });
  } catch (err) {
    console.error('[api/admin/doctors/:id/reset-password]', err);
    return fail('Erreur serveur', 500);
  }
}
