import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setSessionCookie } from '@/lib/auth';
import { fail, ok, parseBody } from '@/lib/api';
import { loginSchema } from '@/lib/schemas';
import { serializeAccount } from '@/lib/serializers';

export async function POST(request: Request) {
  const parsed = await parseBody(request, loginSchema);
  if (!parsed.ok) return parsed.response;

  const { email, password } = parsed.data;
  const account = await prisma.account.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  // Always run a hash comparison, even when the account is missing, so the
  // response time doesn't reveal which e-mail addresses exist.
  const hash = account?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
  const valid = await bcrypt.compare(password, hash);

  if (!account || !valid) {
    return fail('E-mail ou mot de passe incorrect', 401);
  }

  await setSessionCookie(account.id);
  return ok({ user: serializeAccount(account) });
}
