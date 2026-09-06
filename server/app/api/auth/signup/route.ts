import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setSessionCookie } from '@/lib/auth';
import { fail, ok, parseBody } from '@/lib/api';
import { signupSchema } from '@/lib/schemas';
import { serializeAccount } from '@/lib/serializers';

export async function POST(request: Request) {
  const parsed = await parseBody(request, signupSchema);
  if (!parsed.ok) return parsed.response;

  const { name, email, password, role, phone, specialty } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.account.findUnique({ where: { email: normalizedEmail } });
  if (existing) return fail('Un compte existe déjà avec cet e-mail', 409);

  // Preserve the frontend convention: doctors are always prefixed "Dr.".
  const displayName =
    role === 'DOCTOR' && !/^dr\.?\s/i.test(name.trim()) ? `Dr. ${name.trim()}` : name.trim();

  const account = await prisma.account.create({
    data: {
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      name: displayName,
      role,
      phone: phone.trim(),
      specialty: role === 'DOCTOR' ? specialty ?? null : null,
      avatar: `https://picsum.photos/seed/${encodeURIComponent(normalizedEmail)}/100/100`,
    },
  });

  // Registration log for the back office. Best-effort: a signup must not fail
  // because the analytics row could not be written.
  try {
    await prisma.demoLead.upsert({
      where: { name_phone: { name: displayName, phone: phone.trim() } },
      create: {
        name: displayName,
        phone: phone.trim(),
        specialty: specialty ?? null,
        email: normalizedEmail,
        accountId: account.id,
      },
      update: {
        specialty: specialty ?? null,
        email: normalizedEmail,
        accountId: account.id,
        visits: { increment: 1 },
      },
    });
  } catch (err) {
    console.error('[api/auth/signup] lead log failed', err);
  }

  await setSessionCookie(account.id);
  return ok({ user: serializeAccount(account) }, 201);
}
