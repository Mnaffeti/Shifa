import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setSessionCookie } from '@/lib/auth';
import { fail, ok, parseBody } from '@/lib/api';
import { signupSchema } from '@/lib/schemas';
import { serializeAccount } from '@/lib/serializers';

export async function POST(request: Request) {
  const parsed = await parseBody(request, signupSchema);
  if (!parsed.ok) return parsed.response;

  const { name, email, password, role, specialty } = parsed.data;
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
      specialty: role === 'DOCTOR' ? specialty ?? null : null,
      avatar: `https://picsum.photos/seed/${encodeURIComponent(normalizedEmail)}/100/100`,
    },
  });

  await setSessionCookie(account.id);
  return ok({ user: serializeAccount(account) }, 201);
}
