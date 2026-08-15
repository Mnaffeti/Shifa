import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { canAccessPatient, fail, forbidden, notFound, ok, parseBody, unauthorized } from '@/lib/api';
import { updateConsultationSchema } from '@/lib/schemas';
import { serializeConsultation } from '@/lib/serializers';
import { CONSULTATION_INCLUDE } from '../route';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: { ...CONSULTATION_INCLUDE, patient: true },
    });
    if (!consultation) return notFound('Consultation');
    if (!canAccessPatient(user, consultation.patient.assignedDoctor)) return forbidden();

    return ok({ consultation: serializeConsultation(consultation) });
  } catch (err) {
    console.error('[api/consultations/:id GET]', err);
    return fail('Erreur serveur', 500);
  }
}

/**
 * PATCH — edits the SOAP note, diagnoses, vitals and prescription.
 * A signed consultation is immutable: it must be unlocked first, or amended
 * with an addendum. This is the medico-legal guarantee the old localStorage
 * model could not enforce.
 */
export async function PATCH(request: Request, { params }: Params) {
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

    if (existing.status === 'signed') {
      return fail(
        'Consultation signée : déverrouillez-la ou ajoutez un addendum pour la modifier',
        409,
      );
    }

    const parsed = await parseBody(request, updateConsultationSchema);
    if (!parsed.ok) return parsed.response;

    const { soap, diagnoses, constantes, ordonnance } = parsed.data;

    await prisma.$transaction(async tx => {
      await tx.consultation.update({
        where: { id },
        data: {
          ...(soap?.subjectif !== undefined ? { subjectif: soap.subjectif } : {}),
          ...(soap?.objectif !== undefined ? { objectif: soap.objectif } : {}),
          ...(soap?.assessment !== undefined ? { assessment: soap.assessment } : {}),
          ...(soap?.plan !== undefined ? { plan: soap.plan } : {}),
          ...(diagnoses ? { diagnoses } : {}),
          ...(ordonnance?.renewedFromId !== undefined
            ? { renewedFromId: ordonnance.renewedFromId }
            : {}),
          ...(ordonnance?.templateName !== undefined
            ? { templateName: ordonnance.templateName }
            : {}),
        },
      });

      if (constantes) {
        const v = await tx.vitals.findUnique({ where: { consultationId: id } });
        if (v) await tx.vitals.update({ where: { id: v.id }, data: constantes });
        else await tx.vitals.create({ data: { ...constantes, consultationId: id } });
      }

      // The prescription is replaced as a unit; `position` preserves order.
      if (ordonnance?.items) {
        await tx.ordonnanceItem.deleteMany({ where: { consultationId: id } });
        if (ordonnance.items.length) {
          await tx.ordonnanceItem.createMany({
            data: ordonnance.items.map((item, i) => ({
              ...item, consultationId: id, position: i,
            })),
          });
        }
      }
    });

    const updated = await prisma.consultation.findUniqueOrThrow({
      where: { id },
      include: CONSULTATION_INCLUDE,
    });

    return ok({ consultation: serializeConsultation(updated) });
  } catch (err) {
    console.error('[api/consultations/:id PATCH]', err);
    return fail('Erreur serveur', 500);
  }
}
