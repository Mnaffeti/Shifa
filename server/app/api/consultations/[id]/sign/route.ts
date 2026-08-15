import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { canAccessPatient, fail, forbidden, notFound, ok, parseBody, unauthorized } from '@/lib/api';
import { signConsultationSchema } from '@/lib/schemas';
import { serializeConsultation } from '@/lib/serializers';
import { CONSULTATION_INCLUDE } from '../../route';

type Params = { params: Promise<{ id: string }> };

/** POST — signs the consultation, locking it against further edits. */
export async function POST(request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    // Signing is a clinical act: only a doctor may do it.
    if (user.role !== 'DOCTOR') return forbidden();

    const { id } = await params;
    const existing = await prisma.consultation.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!existing) return notFound('Consultation');
    if (!canAccessPatient(user, existing.patient.assignedDoctor)) return forbidden();
    if (existing.status === 'signed') return fail('Consultation déjà signée', 409);

    const parsed = await parseBody(request, signConsultationSchema);
    if (!parsed.ok) return parsed.response;

    const consultation = await prisma.consultation.update({
      where: { id },
      data: { status: 'signed', signedAt: new Date(), signedBy: parsed.data.doctor },
      include: CONSULTATION_INCLUDE,
    });

    return ok({ consultation: serializeConsultation(consultation) });
  } catch (err) {
    console.error('[api/consultations/:id/sign POST]', err);
    return fail('Erreur serveur', 500);
  }
}
