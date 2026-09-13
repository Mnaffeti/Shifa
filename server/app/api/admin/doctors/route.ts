import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, ok, parseBody, unauthorized } from '@/lib/api';
import { adminCreateDoctorSchema } from '@/lib/schemas';

/** Unambiguous alphabet — no 0/O/1/I — for a password read aloud or retyped. */
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function generateTempPassword(length = 10): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += PASSWORD_ALPHABET[bytes[i] % PASSWORD_ALPHABET.length];
  }
  return out;
}

/**
 * POST /api/admin/doctors — back office creates a doctor account.
 *
 * ADMIN only. Issues a random temporary password and returns it once in the
 * response so the admin can relay it (matricule + password) to the doctor,
 * who must change it on first login (mustChangePassword).
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    const parsed = await parseBody(request, adminCreateDoctorSchema);
    if (!parsed.ok) return parsed.response;

    const { name, matricule, specialty, phone } = parsed.data;
    const trimmedMatricule = matricule.trim();

    const existing = await prisma.account.findUnique({ where: { matricule: trimmedMatricule } });
    if (existing) return fail('Un compte existe déjà avec ce matricule', 409);

    // Preserve the frontend convention: doctors are always prefixed "Dr.".
    const displayName = /^dr\.?\s/i.test(name.trim()) ? name.trim() : `Dr. ${name.trim()}`;
    const tempPassword = generateTempPassword();

    const account = await prisma.account.create({
      data: {
        matricule: trimmedMatricule,
        passwordHash: await bcrypt.hash(tempPassword, 10),
        name: displayName,
        role: 'DOCTOR',
        phone: phone.trim(),
        specialty,
        mustChangePassword: true,
        avatar: `https://picsum.photos/seed/${encodeURIComponent(trimmedMatricule)}/100/100`,
      },
    });

    // Registration log for the back office, same as the self-signup path.
    try {
      await prisma.demoLead.upsert({
        where: { name_phone: { name: displayName, phone: phone.trim() } },
        create: {
          name: displayName,
          phone: phone.trim(),
          specialty,
          accountId: account.id,
        },
        update: {
          specialty,
          accountId: account.id,
        },
      });
    } catch (err) {
      console.error('[api/admin/doctors] lead log failed', err);
    }

    return ok({
      doctor: {
        name: account.name,
        matricule: account.matricule,
        specialty: account.specialty,
        phone: account.phone,
      },
      // Shown once — the server never stores or re-displays the plaintext.
      temporaryPassword: tempPassword,
    }, 201);
  } catch (err) {
    console.error('[api/admin/doctors]', err);
    return fail('Erreur serveur', 500);
  }
}
