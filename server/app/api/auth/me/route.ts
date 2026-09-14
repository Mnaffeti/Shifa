import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, ok, parseBody, unauthorized } from '@/lib/api';
import { updateProfileSchema } from '@/lib/schemas';

function serializeSessionUser(user: {
  email: string | null;
  matricule: string | null;
  name: string;
  avatar: string;
  role: string;
  specialty: string | null;
  phone: string | null;
  mustChangePassword: boolean;
}) {
  return {
    ...(user.email ? { email: user.email } : {}),
    ...(user.matricule ? { matricule: user.matricule } : {}),
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    ...(user.specialty ? { specialty: user.specialty } : {}),
    ...(user.phone ? { phone: user.phone } : {}),
    mustChangePassword: user.mustChangePassword,
  };
}

/**
 * Session probe used on app boot. Returns `{ user: null }` rather than a 401
 * so an anonymous visitor isn't an error case for the frontend.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return ok({ user: null });

  return ok({ user: serializeSessionUser(user) });
}

/**
 * PATCH /api/auth/me — the signed-in account edits its own profile (name,
 * specialty, phone). The sign-in identifier (matricule/e-mail) is fixed and
 * not editable here.
 */
export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const parsed = await parseBody(request, updateProfileSchema);
    if (!parsed.ok) return parsed.response;

    const { name, specialty, phone } = parsed.data;

    const account = await prisma.account.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(specialty !== undefined ? { specialty } : {}),
        ...(phone !== undefined ? { phone: phone.trim() } : {}),
      },
    });

    return ok({ user: serializeSessionUser(account) });
  } catch (err) {
    console.error('[api/auth/me PATCH]', err);
    return fail('Erreur serveur', 500);
  }
}
