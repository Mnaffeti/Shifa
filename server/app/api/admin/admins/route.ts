import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, ok, parseBody, unauthorized } from '@/lib/api';
import { adminCreateAdminSchema } from '@/lib/schemas';
import { recordAudit } from '@/lib/audit';

/**
 * GET /api/admin/admins — the administrator accounts. ADMIN only.
 *
 * Until now an admin could only be created with the db:create-admin CLI script,
 * which needs shell access to the server.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    const admins = await prisma.account.findMany({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'asc' },
    });

    return ok({
      admins: admins.map(a => ({
        id: a.id,
        name: a.name,
        email: a.email,
        lastLoginAt: a.lastLoginAt?.toISOString() ?? null,
        loginCount: a.loginCount,
        createdAt: a.createdAt.toISOString(),
        /** True for the caller's own row, so the UI can label it and hide delete. */
        isSelf: a.id === user.id,
      })),
    });
  } catch (err) {
    console.error('[api/admin/admins GET]', err);
    return fail('Erreur serveur', 500);
  }
}

/**
 * POST /api/admin/admins — create another administrator. ADMIN only.
 *
 * The creator chooses the password directly rather than having one generated:
 * unlike a doctor, an admin is a colleague being onboarded in person, and
 * there is no matricule-and-temporary-password relay to go through.
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    const parsed = await parseBody(request, adminCreateAdminSchema);
    if (!parsed.ok) return parsed.response;

    const email = parsed.data.email.trim().toLowerCase();

    const taken = await prisma.account.findUnique({ where: { email } });
    if (taken) return fail('Un compte existe déjà avec cette adresse e-mail', 409);

    const account = await prisma.account.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
        name: parsed.data.name.trim(),
        role: 'ADMIN',
        avatar: `https://picsum.photos/seed/${encodeURIComponent(email)}/100/100`,
      },
    });

    await recordAudit({
      actor: user,
      action: 'ADMIN_CREATED',
      target: account,
    });

    return ok({
      admin: {
        id: account.id,
        name: account.name,
        email: account.email,
        lastLoginAt: null,
        loginCount: 0,
        createdAt: account.createdAt.toISOString(),
        isSelf: false,
      },
    }, 201);
  } catch (err) {
    console.error('[api/admin/admins POST]', err);
    return fail('Erreur serveur', 500);
  }
}
