import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from './prisma';

/** Unambiguous alphabet — no 0/O/1/I — for a password read aloud or retyped. */
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

export function generateTempPassword(length = 10): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += PASSWORD_ALPHABET[bytes[i] % PASSWORD_ALPHABET.length];
  }
  return out;
}

export interface DoctorAccountInput {
  name: string;
  matricule: string;
  specialty: string;
  phone: string;
}

/**
 * Creates a DOCTOR account with a freshly generated temporary password,
 * flagged `mustChangePassword`. Shared by the admin's direct-create form and
 * by accepting a doctor's account request.
 *
 * Throws with a user-facing message if the matricule is already taken.
 */
export async function provisionDoctorAccount(input: DoctorAccountInput) {
  const trimmedMatricule = input.matricule.trim();

  const existing = await prisma.account.findUnique({ where: { matricule: trimmedMatricule } });
  if (existing) throw new Error('Un compte existe déjà avec ce matricule');

  // Preserve the frontend convention: doctors are always prefixed "Dr.".
  const displayName = /^dr\.?\s/i.test(input.name.trim()) ? input.name.trim() : `Dr. ${input.name.trim()}`;
  const tempPassword = generateTempPassword();

  const account = await prisma.account.create({
    data: {
      matricule: trimmedMatricule,
      passwordHash: await bcrypt.hash(tempPassword, 10),
      name: displayName,
      role: 'DOCTOR',
      phone: input.phone.trim(),
      specialty: input.specialty,
      mustChangePassword: true,
      // Kept in plaintext only until the doctor sets their own password, so
      // the admin can still recover it from the accounts list if the
      // one-time reveal was closed before it was copied.
      tempPassword,
      avatar: `https://picsum.photos/seed/${encodeURIComponent(trimmedMatricule)}/100/100`,
    },
  });

  // Registration log for the back office. Best-effort: never block account
  // creation because the analytics row could not be written.
  try {
    await prisma.demoLead.upsert({
      where: { name_phone: { name: displayName, phone: input.phone.trim() } },
      create: {
        name: displayName,
        phone: input.phone.trim(),
        specialty: input.specialty,
        accountId: account.id,
      },
      update: {
        specialty: input.specialty,
        accountId: account.id,
      },
    });
  } catch (err) {
    console.error('[provisionDoctorAccount] lead log failed', err);
  }

  return {
    doctor: {
      name: account.name,
      matricule: account.matricule as string,
      specialty: account.specialty as string,
      phone: account.phone as string,
    },
    temporaryPassword: tempPassword,
  };
}
