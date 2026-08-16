import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { fail, ok, parseBody, unauthorized } from '@/lib/api';
import { waitlistSchema } from '@/lib/schemas';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const entries = await prisma.waitlistEntry.findMany({ orderBy: { createdAt: 'desc' } });
    return ok({
      entries: entries.map(e => ({
        id: e.id,
        name: e.name,
        phone: e.phone,
        ...(e.reason ? { reason: e.reason } : {}),
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('[api/waitlist GET]', err);
    return fail('Erreur serveur', 500);
  }
}

/**
 * POST — deduped on (name, phone), matching the old localStorage behaviour.
 *
 * Deliberately unauthenticated: this is how a visitor on the pre-login gate
 * requests a demo. It only ever writes a name, phone and free-text reason —
 * it exposes no patient data, and GET still requires a session.
 */
export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, waitlistSchema);
    if (!parsed.ok) return parsed.response;

    const { name, phone, reason } = parsed.data;

    const entry = await prisma.waitlistEntry.upsert({
      where: { name_phone: { name, phone } },
      create: { name, phone, reason: reason ?? null },
      update: { reason: reason ?? null },
    });

    return ok({
      entry: {
        id: entry.id,
        name: entry.name,
        phone: entry.phone,
        ...(entry.reason ? { reason: entry.reason } : {}),
        createdAt: entry.createdAt.toISOString(),
      },
    }, 201);
  } catch (err) {
    console.error('[api/waitlist POST]', err);
    return fail('Erreur serveur', 500);
  }
}
