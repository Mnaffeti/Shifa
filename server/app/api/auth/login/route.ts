import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setSessionCookie } from '@/lib/auth';
import { fail, ok, parseBody } from '@/lib/api';
import { loginSchema } from '@/lib/schemas';
import { isTrialExpired } from '@/lib/trial';
import { serializeAccount } from '@/lib/serializers';

export async function POST(request: Request) {
  const parsed = await parseBody(request, loginSchema);
  if (!parsed.ok) return parsed.response;

  const { identifier, password } = parsed.data;
  const trimmed = identifier.trim();

  // Doctors sign in with their matricule; everyone else with e-mail. An
  // e-mail-shaped identifier looks up by email, anything else by matricule.
  const account = trimmed.includes('@')
    ? await prisma.account.findUnique({ where: { email: trimmed.toLowerCase() } })
    : await prisma.account.findUnique({ where: { matricule: trimmed } });

  // Always run a hash comparison, even when the account is missing, so the
  // response time doesn't reveal which e-mail addresses exist.
  const hash = account?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
  const valid = await bcrypt.compare(password, hash);

  if (!account || !valid) {
    return fail('Identifiant ou mot de passe incorrect', 401);
  }

  // A revoked account is refused with the same wording as a bad password, on
  // purpose: saying "this account is deactivated" would confirm the matricule
  // exists, and matricules are sequential enough to enumerate.
  if (!account.isActive) {
    return fail('Identifiant ou mot de passe incorrect', 401);
  }

  // An expired trial blocks sign-in outright. Unlike a wrong password, this is
  // stated plainly: the account is legitimate and its owner needs to know why
  // they are locked out and who can lift it. Nothing is leaked — reaching this
  // point already required the correct password.
  if (isTrialExpired(account)) {
    return fail(
      'Votre période d’essai est terminée. Contactez votre administration ' +
      'pour réactiver votre accès.',
      403,
    );
  }

  // Record the sign-in on the account itself. Best-effort: never block a valid
  // login because the activity counters could not be written.
  //
  // This used to also bump a DemoLead row. That table was written outside the
  // account transaction, so it silently drifted — a doctor could sign in daily
  // and still not appear in the back office at all. The counters now live on
  // Account, where they cannot diverge from the account they describe.
  try {
    await prisma.account.update({
      where: { id: account.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    });
  } catch (err) {
    console.error('[api/auth/login] activity update failed', err);
  }

  await setSessionCookie(account.id);
  return ok({ user: serializeAccount(account) });
}
