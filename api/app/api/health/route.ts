import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/api';

/** Unauthenticated liveness probe — confirms the DB connection works. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('[api/health]', err);
    return fail('Base de données injoignable', 503);
  }
}
