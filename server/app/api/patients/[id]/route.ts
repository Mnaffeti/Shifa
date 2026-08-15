import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { canAccessPatient, fail, forbidden, notFound, ok, parseBody, unauthorized } from '@/lib/api';
import { updatePatientSchema } from '@/lib/schemas';
import { serializePatient } from '@/lib/serializers';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const patient = await prisma.patient.findUnique({ where: { id } });

    if (!patient) return notFound('Patient');
    if (!canAccessPatient(user, patient.assignedDoctor)) return forbidden();

    return ok({ patient: serializePatient(patient) });
  } catch (err) {
    console.error('[api/patients/:id GET]', err);
    return fail('Erreur serveur', 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) return notFound('Patient');
    if (!canAccessPatient(user, existing.assignedDoctor)) return forbidden();

    const parsed = await parseBody(request, updatePatientSchema);
    if (!parsed.ok) return parsed.response;

    const { lastVisit, ...rest } = parsed.data;

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...rest,
        // "Never" is the frontend's sentinel for "no visit yet" → null in DB.
        ...(lastVisit !== undefined ? { lastVisit: lastVisit === 'Never' ? null : lastVisit } : {}),
      },
    });

    return ok({ patient: serializePatient(patient) });
  } catch (err) {
    console.error('[api/patients/:id PATCH]', err);
    return fail('Erreur serveur', 500);
  }
}

/**
 * Deleting a patient cascades to their chart, appointments and consultations.
 * Restricted to secretaries, matching the permission the UI already enforces.
 */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'SECRETARY') return forbidden();

    const { id } = await params;
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) return notFound('Patient');

    await prisma.patient.delete({ where: { id } });
    return ok({ success: true });
  } catch (err) {
    console.error('[api/patients/:id DELETE]', err);
    return fail('Erreur serveur', 500);
  }
}
