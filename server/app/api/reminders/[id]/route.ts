import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, notFound, ok, parseBody, unauthorized } from '@/lib/api';
import { updateReminderSchema } from '@/lib/schemas';
import { serializeReminder } from '@/lib/serializers';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const existing = await prisma.reminder.findUnique({ where: { id } });
    if (!existing) return notFound('Rappel');

    const parsed = await parseBody(request, updateReminderSchema);
    if (!parsed.ok) return parsed.response;

    const reminder = await prisma.reminder.update({ where: { id }, data: parsed.data });
    return ok({ reminder: serializeReminder(reminder) });
  } catch (err) {
    console.error('[api/reminders/:id PATCH]', err);
    return fail('Erreur serveur', 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const existing = await prisma.reminder.findUnique({ where: { id } });
    if (!existing) return notFound('Rappel');

    await prisma.reminder.delete({ where: { id } });
    return ok({ success: true });
  } catch (err) {
    console.error('[api/reminders/:id DELETE]', err);
    return fail('Erreur serveur', 500);
  }
}
