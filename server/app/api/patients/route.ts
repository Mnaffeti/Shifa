import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, ok, parseBody, patientScope, requireDoctor, unauthorized } from '@/lib/api';
import { createPatientSchema } from '@/lib/schemas';
import { serializePatient } from '@/lib/serializers';

/** GET /api/patients — the caller's visible patients, newest first. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const denied = requireDoctor(user);
    if (denied) return denied;

    const patients = await prisma.patient.findMany({
      where: patientScope(user),
      orderBy: { createdAt: 'desc' },
    });

    return ok({ patients: patients.map(serializePatient) });
  } catch (err) {
    console.error('[api/patients GET]', err);
    return fail('Erreur serveur', 500);
  }
}

/**
 * Generates the next PT-XXX id. Runs inside the caller's transaction so two
 * concurrent creates cannot pick the same number.
 */
async function nextPatientId(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  // Demo workspaces namespace their ids (PT-<ACCOUNT>-01), which sort above
  // the plain PT-NNN series. Scan the sequential ids only, and take the
  // highest numeric value rather than trusting lexical order.
  const rows = await tx.patient.findMany({
    where: { id: { startsWith: 'PT-' } },
    select: { id: true },
  });

  const highest = rows.reduce((max, { id }) => {
    const m = /^PT-(\d+)$/.exec(id);
    if (!m) return max;
    const n = Number.parseInt(m[1], 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 0);

  return `PT-${String(highest + 1).padStart(3, '0')}`;
}

/** POST /api/patients — create a patient file. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const denied = requireDoctor(user);
    if (denied) return denied;

    const parsed = await parseBody(request, createPatientSchema);
    if (!parsed.ok) return parsed.response;

    const data = parsed.data;

    // Ownership is taken from the session, never from the request body: the
    // caller can only ever file a patient under themselves. assignedDoctor
    // stays as the display label and is overwritten to match.

    const patient = await prisma.$transaction(async tx => {
      const id = await nextPatientId(tx);
      return tx.patient.create({
        data: {
          ...data,
          id,
          doctorId: user.id,
          assignedDoctor: user.name,
          status: data.status ?? 'New',
          lastVisit: null,
          avatar: `https://picsum.photos/seed/patient-${id.toLowerCase()}/100/100`,
          createdAt: new Date().toISOString().split('T')[0],
          // Every patient gets a chart up front so the chart routes never
          // have to special-case a missing row.
          chart: { create: {} },
        },
      });
    });

    return ok({ patient: serializePatient(patient) }, 201);
  } catch (err) {
    console.error('[api/patients POST]', err);
    return fail('Erreur serveur', 500);
  }
}
