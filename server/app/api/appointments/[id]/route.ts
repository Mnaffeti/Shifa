import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, forbidden, notFound, ok, parseBody, unauthorized } from '@/lib/api';
import { updateAppointmentSchema } from '@/lib/schemas';
import { serializeAppointment } from '@/lib/serializers';
import { toDbType } from '../route';

type Params = { params: Promise<{ id: string }> };

/** A doctor may only touch appointments on their own schedule. */
function canTouch(role: string, name: string, doctor: string): boolean {
  return role === 'SECRETARY' || doctor === name;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return notFound('Rendez-vous');
    if (!canTouch(user.role, user.name, existing.doctor)) return forbidden();

    const parsed = await parseBody(request, updateAppointmentSchema);
    if (!parsed.ok) return parsed.response;

    const { type, ...rest } = parsed.data;

    const startTime = rest.startTime ?? existing.startTime;
    const endTime = rest.endTime ?? existing.endTime;
    if (endTime <= startTime) {
      return fail("L'heure de fin doit être postérieure à l'heure de début", 400);
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { ...rest, ...(type ? { type: toDbType(type) } : {}) },
    });

    return ok({ appointment: serializeAppointment(appointment) });
  } catch (err) {
    console.error('[api/appointments/:id PATCH]', err);
    return fail('Erreur serveur', 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return notFound('Rendez-vous');
    if (!canTouch(user.role, user.name, existing.doctor)) return forbidden();

    await prisma.appointment.delete({ where: { id } });
    return ok({ success: true });
  } catch (err) {
    console.error('[api/appointments/:id DELETE]', err);
    return fail('Erreur serveur', 500);
  }
}
