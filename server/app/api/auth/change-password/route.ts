import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, ok, parseBody, unauthorized } from '@/lib/api';
import { changePasswordSchema } from '@/lib/schemas';

/**
 * POST /api/auth/change-password — the signed-in account sets its own new
 * password. Used both for the mandatory first-login change (mustChangePassword)
 * and for a voluntary change later from settings.
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const parsed = await parseBody(request, changePasswordSchema);
    if (!parsed.ok) return parsed.response;

    // A temporary password from the back office doesn't require the old one
    // to confirm — the doctor hasn't chosen one yet. Any voluntary change
    // afterwards must prove the current password first.
    if (!user.mustChangePassword) {
      if (!parsed.data.currentPassword) {
        return fail('Mot de passe actuel requis', 400);
      }
      const account = await prisma.account.findUnique({ where: { id: user.id } });
      const valid = account && await bcrypt.compare(parsed.data.currentPassword, account.passwordHash);
      if (!valid) return fail('Mot de passe actuel incorrect', 401);
    }

    await prisma.account.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.newPassword, 10),
        mustChangePassword: false,
        // The back-office-issued temporary password (if any) is no longer
        // valid once a real one is set — wipe it.
        tempPassword: null,
      },
    });

    return ok({ success: true as const });
  } catch (err) {
    console.error('[api/auth/change-password]', err);
    return fail('Erreur serveur', 500);
  }
}
