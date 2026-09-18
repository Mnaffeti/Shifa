import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from './prisma';
import { trialEndFromNow } from './trial';

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
      // The free-trial clock starts here, at creation — not at first sign-in.
      trialEndsAt: trialEndFromNow(),
      avatar: `https://picsum.photos/seed/${encodeURIComponent(trimmedMatricule)}/100/100`,
    },
  });

  return {
    doctor: {
      name: account.name,
      matricule: account.matricule as string,
      specialty: account.specialty as string,
      phone: account.phone as string,
    },
    // Shown once — the server never stores or re-displays the plaintext.
    temporaryPassword: tempPassword,
  };
}
