import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { canAccessPatient, fail, forbidden, notFound, ok, unauthorized } from '@/lib/api';
import { serializeConsultation } from '@/lib/serializers';
import { CONSULTATION_INCLUDE } from '../../route';

type Params = { params: Promise<{ id: string }> };

/**
 * POST — returns a signed consultation to draft so it can be corrected.
 * Only the signing doctor may unlock their own record.
 */
export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== 'DOCTOR') return forbidden();

    const { id } = await params;
    const existing = await prisma.consultation.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!existing) return notFound('Consultation');
    if (!canAccessPatient(user, existing.patient.assignedDoctor)) return forbidden();
    if (existing.status !== 'signed') return fail("Consultation déjà en cours d'édition", 409);

    if (existing.signedBy && existing.signedBy !== user.name) {
      return fail('Seul le médecin signataire peut déverrouiller cette consultation', 403);
    }

    const consultation = await prisma.consultation.update({
      where: { id },
      data: { status: 'draft', signedAt: null, signedBy: null },
      include: CONSULTATION_INCLUDE,
    });

    return ok({ consultation: serializeConsultation(consultation) });
  } catch (err) {
    console.error('[api/consultations/:id/unlock POST]', err);
    return fail('Erreur serveur', 500);
  }
}
