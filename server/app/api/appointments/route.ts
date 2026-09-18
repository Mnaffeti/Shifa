import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, notFound, ok, parseBody, requireDoctor, unauthorized } from '@/lib/api';
import { createAppointmentSchema } from '@/lib/schemas';
import { serializeAppointment } from '@/lib/serializers';
import type { AppointmentType } from '@prisma/client';

/** The frontend union uses "Follow-up"; the DB enum member is FollowUp. */
export function toDbType(t: string): AppointmentType {
  return (t === 'Follow-up' ? 'FollowUp' : t) as AppointmentType;
}

/**
 * GET /api/appointments — optionally filtered by ?date=yyyy-MM-dd,
 * ?patientId=, or ?from=&to= for a range.
 */
export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const denied = requireDoctor(user);
    if (denied) return denied;

    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const patientId = url.searchParams.get('patientId');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    const appointments = await prisma.appointment.findMany({
      where: {
        // A doctor's schedule is their own. Scoped by account id, not by
        // display name, so a rename never hides their own appointments.
        doctorId: user.id,
        ...(patientId ? { patientId } : {}),
        // `date` and `from`/`to` both target the same column, so spreading
        // them as two keys meant the range silently overwrote an exact date.
        // Build one clause instead: an exact date wins, otherwise the range.
        ...(date
          ? { date }
          : from || to
            ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
            : {}),
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return ok({ appointments: appointments.map(serializeAppointment) });
  } catch (err) {
    console.error('[api/appointments GET]', err);
    return fail('Erreur serveur', 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const denied = requireDoctor(user);
    if (denied) return denied;

    const parsed = await parseBody(request, createAppointmentSchema);
    if (!parsed.ok) return parsed.response;

    const { type, status, patientId, ...rest } = parsed.data;

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return notFound('Patient');

    if (rest.endTime <= rest.startTime) {
      return fail("L'heure de fin doit être postérieure à l'heure de début", 400);
    }

    const appointment = await prisma.appointment.create({
      data: {
        ...rest,
        patientId,
        // Ownership comes from the session, not the body; `doctor` is only the
        // printed label.
        doctorId: user.id,
        doctor: user.name,
        type: toDbType(type),
        status: status ?? 'Pending',
      },
    });

    return ok({ appointment: serializeAppointment(appointment) }, 201);
  } catch (err) {
    console.error('[api/appointments POST]', err);
    return fail('Erreur serveur', 500);
  }
}
