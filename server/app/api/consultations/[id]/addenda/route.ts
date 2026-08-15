import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { canAccessPatient, fail, forbidden, notFound, ok, parseBody, unauthorized } from '@/lib/api';
import { addendumSchema } from '@/lib/schemas';
import { serializeConsultation } from '@/lib/serializers';
import { CONSULTATION_INCLUDE } from '../../route';

type Params = { params: Promise<{ id: string }> };

/**
 * POST — appends an addendum. This is the correct way to amend a signed
 * consultation: the original text stays intact and the addition is attributed
 * and timestamped, preserving the audit trail.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const existing = await prisma.consultation.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!existing) return notFound('Consultation');
    if (!canAccessPatient(user, existing.patient.assignedDoctor)) return forbidden();

    const parsed = await parseBody(request, addendumSchema);
    if (!parsed.ok) return parsed.response;

    await prisma.addendum.create({ data: { ...parsed.data, consultationId: id } });

    const consultation = await prisma.consultation.findUniqueOrThrow({
      where: { id },
      include: CONSULTATION_INCLUDE,
    });

    return ok({ consultation: serializeConsultation(consultation) }, 201);
  } catch (err) {
    console.error('[api/consultations/:id/addenda POST]', err);
    return fail('Erreur serveur', 500);
  }
}
