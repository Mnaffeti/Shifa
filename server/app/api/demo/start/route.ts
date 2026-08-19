import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { setSessionCookie } from '@/lib/auth';
import { fail, ok, parseBody } from '@/lib/api';
import { demoStartSchema } from '@/lib/schemas';
import { serializeAccount } from '@/lib/serializers';

/**
 * Provisions an isolated demo workspace.
 *
 * Each visitor gets their own account, so the patients they see and create
 * are theirs alone — a shared demo account would let one visitor read and
 * overwrite another's records. The workspace starts with two mock patients
 * so the archive is not empty on arrival; everything else the visitor adds
 * belongs only to them.
 *
 * Unauthenticated by design: the caller is a visitor on the pre-login gate.
 */

/** Fixed starter patients, cloned per demo account. */
const MOCK_PATIENTS = [
  {
    firstName: 'Foulen', lastName: 'Ben Foulen', dob: '1979-04-12', gender: 'Homme',
    phone: '+216 22 000 001', email: 'foulen.benfoulen@example.com',
    address: '12 Rue de Carthage, Tunis', profession: 'Ingénieur', cin: '00000001',
    bloodType: 'A+',
  },
  {
    firstName: 'Foulena', lastName: 'Ben Foulena', dob: '1991-09-27', gender: 'Femme',
    phone: '+216 22 000 002', email: 'foulena.benfoulena@example.com',
    address: '45 Avenue Habib Bourguiba, Sousse', profession: 'Enseignante', cin: '00000002',
    bloodType: 'O-',
  },
];

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

/** "Dr. Amine" unless the visitor already wrote a title. */
function doctorName(raw: string): string {
  const name = raw.trim();
  return /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
}

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, demoStartSchema);
    if (!parsed.ok) return parsed.response;

    const { name, phone, specialty } = parsed.data;
    const displayName = doctorName(name);

    // Each visit provisions a fresh workspace, even for a repeat visitor:
    // reusing an account would hand whoever knows the name someone else's
    // demo data. The lead row is what links repeat visits together.
    const email = `demo+${randomBytes(8).toString('hex')}@shifa.local`;

    const account = await prisma.$transaction(async tx => {
      const created = await tx.account.create({
        data: {
          email,
          // Random: nobody signs in to a demo account with a password, the
          // session cookie is issued directly below.
          passwordHash: await bcrypt.hash(randomBytes(24).toString('hex'), 10),
          name: displayName,
          role: 'DOCTOR',
          specialty: specialty ?? null,
          isDemo: true,
          avatar: `https://picsum.photos/seed/${encodeURIComponent(email)}/100/100`,
        },
      });

      // Business ids stay unique across the table, so namespace them per account.
      const prefix = created.id.slice(-6).toUpperCase();
      for (const [i, p] of MOCK_PATIENTS.entries()) {
        await tx.patient.create({
          data: {
            ...p,
            id: `PT-${prefix}-${String(i + 1).padStart(2, '0')}`,
            assignedDoctor: displayName,
            status: 'Active',
            lastVisit: daysAgo(i === 0 ? 9 : 3),
            avatar: `https://picsum.photos/seed/demo-${prefix}-${i}/100/100`,
            createdAt: daysAgo(120),
            chart: { create: {} },
          },
        });
      }

      await tx.demoLead.upsert({
        where: { name_phone: { name: displayName, phone } },
        create: { name: displayName, phone, specialty: specialty ?? null, accountId: created.id },
        update: {
          specialty: specialty ?? null,
          accountId: created.id,
          visits: { increment: 1 },
        },
      });

      return created;
    });

    await setSessionCookie(account.id);
    return ok({ user: serializeAccount(account) }, 201);
  } catch (err) {
    console.error('[api/demo/start]', err);
    return fail('Impossible de préparer la démonstration', 500);
  }
}
