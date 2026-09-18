import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { canAccessPatient, fail, forbidden, notFound, ok, parseBody, requireDoctor, unauthorized } from '@/lib/api';
import { updatePatientSchema } from '@/lib/schemas';
import { serializePatient } from '@/lib/serializers';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const denied = requireDoctor(user);
    if (denied) return denied;

    const { id } = await params;
    const patient = await prisma.patient.findUnique({ where: { id } });

    if (!patient) return notFound('Patient');
    if (!canAccessPatient(user, patient.doctorId)) return forbidden();

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
    const denied = requireDoctor(user);
    if (denied) return denied;

    const { id } = await params;
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) return notFound('Patient');
    if (!canAccessPatient(user, existing.doctorId)) return forbidden();

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
 * A doctor may only delete their own patients.
 */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const denied = requireDoctor(user);
    if (denied) return denied;

    const { id } = await params;
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) return notFound('Patient');
    if (!canAccessPatient(user, existing.doctorId)) return forbidden();

    await prisma.patient.delete({ where: { id } });
    return ok({ success: true });
  } catch (err) {
    console.error('[api/patients/:id DELETE]', err);
    return fail('Erreur serveur', 500);
  }
}
