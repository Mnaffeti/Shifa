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

    await prisma.account.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.newPassword, 10),
        mustChangePassword: false,
      },
    });

    return ok({ success: true as const });
  } catch (err) {
    console.error('[api/auth/change-password]', err);
    return fail('Erreur serveur', 500);
  }
}
