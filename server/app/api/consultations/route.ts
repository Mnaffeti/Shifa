import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { canAccessPatient, fail, forbidden, notFound, ok, parseBody, requireDoctor, unauthorized } from '@/lib/api';
import { createConsultationSchema } from '@/lib/schemas';
import { serializeConsultation } from '@/lib/serializers';

export const CONSULTATION_INCLUDE = {
  ordonnance: true,
  addenda: { orderBy: { addedAt: 'asc' } },
  constantes: true,
} as const;

/** GET /api/consultations — optionally ?patientId= or ?appointmentId=. */
export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const denied = requireDoctor(user);
    if (denied) return denied;

    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    const appointmentId = url.searchParams.get('appointmentId');

    const consultations = await prisma.consultation.findMany({
      where: {
        ...(patientId ? { patientId } : {}),
        ...(appointmentId ? { appointmentId } : {}),
        // A doctor only sees consultations for patients on their list.
        ...(user.role === 'DOCTOR' ? { patient: { doctorId: user.id } } : {}),
      },
      include: CONSULTATION_INCLUDE,
      orderBy: { date: 'desc' },
    });

    return ok({ consultations: consultations.map(serializeConsultation) });
  } catch (err) {
    console.error('[api/consultations GET]', err);
    return fail('Erreur serveur', 500);
  }
}

/**
 * POST /api/consultations — get-or-create the draft for an appointment.
 * Mirrors the frontend's `getOrCreateDraft`: calling it twice for the same
 * appointment returns the existing consultation rather than duplicating it.
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const denied = requireDoctor(user);
    if (denied) return denied;

    const parsed = await parseBody(request, createConsultationSchema);
    if (!parsed.ok) return parsed.response;

    const { patientId, appointmentId, date, doctor } = parsed.data;

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return notFound('Patient');
    if (!canAccessPatient(user, patient.doctorId)) return forbidden();

    if (appointmentId) {
      const existing = await prisma.consultation.findFirst({
        where: { appointmentId },
        include: CONSULTATION_INCLUDE,
      });
      if (existing) return ok({ consultation: serializeConsultation(existing) });

      // Reject an unknown appointment here rather than letting the insert
      // fail on the foreign key, which would surface as an opaque 500.
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { id: true },
      });
      if (!appointment) return fail('Rendez-vous introuvable', 400);
    }

    const consultation = await prisma.consultation.create({
      // Ownership from the session; `doctor` is the label kept on the record.
      data: { patientId, appointmentId: appointmentId ?? null, date, doctor, doctorId: user.id },
      include: CONSULTATION_INCLUDE,
    });

    return ok({ consultation: serializeConsultation(consultation) }, 201);
  } catch (err) {
    console.error('[api/consultations POST]', err);
    return fail('Erreur serveur', 500);
  }
}
