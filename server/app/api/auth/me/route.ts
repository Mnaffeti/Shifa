import { getSessionUser } from '@/lib/auth';
import { ok } from '@/lib/api';

/**
 * Session probe used on app boot. Returns `{ user: null }` rather than a 401
 * so an anonymous visitor isn't an error case for the frontend.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return ok({ user: null });

  return ok({
    user: {
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      ...(user.specialty ? { specialty: user.specialty } : {}),
    },
  });
}
