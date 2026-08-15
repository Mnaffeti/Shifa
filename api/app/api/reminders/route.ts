import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, ok, parseBody, unauthorized } from '@/lib/api';
import { createReminderSchema } from '@/lib/schemas';
import { serializeReminder } from '@/lib/serializers';

/** Reminders are a shared clinic board — both roles see all of them. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const reminders = await prisma.reminder.findMany({
      orderBy: [{ done: 'asc' }, { createdAt: 'desc' }],
    });

    return ok({ reminders: reminders.map(serializeReminder) });
  } catch (err) {
    console.error('[api/reminders GET]', err);
    return fail('Erreur serveur', 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const parsed = await parseBody(request, createReminderSchema);
    if (!parsed.ok) return parsed.response;

    const reminder = await prisma.reminder.create({ data: parsed.data });
    return ok({ reminder: serializeReminder(reminder) }, 201);
  } catch (err) {
    console.error('[api/reminders POST]', err);
    return fail('Erreur serveur', 500);
  }
}
