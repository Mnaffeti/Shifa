import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, ok, parseBody, requireDoctor, unauthorized } from '@/lib/api';
import { createReminderSchema } from '@/lib/schemas';
import { serializeReminder } from '@/lib/serializers';

/**
 * GET /api/reminders — the caller's own reminders.
 *
 * Scoped to authorId. These memos quote patients by name ("call Ahmed about
 * his results"), so a board shared across every account in the database would
 * leak clinical context between unrelated practices.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const denied = requireDoctor(user);
    if (denied) return denied;

    const reminders = await prisma.reminder.findMany({
      where: { authorId: user.id },
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
    const denied = requireDoctor(user);
    if (denied) return denied;

    const parsed = await parseBody(request, createReminderSchema);
    if (!parsed.ok) return parsed.response;

    // Authorship comes from the session, not the body: `authorName` is only
    // the printed label.
    const reminder = await prisma.reminder.create({
      data: { ...parsed.data, authorId: user.id, authorName: user.name },
    });
    return ok({ reminder: serializeReminder(reminder) }, 201);
  } catch (err) {
    console.error('[api/reminders POST]', err);
    return fail('Erreur serveur', 500);
  }
}
