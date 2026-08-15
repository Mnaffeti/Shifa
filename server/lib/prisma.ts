import { PrismaClient } from '@prisma/client';

/**
 * Single Prisma client for the process. Next.js hot-reload re-evaluates
 * modules on every edit, so without this global cache dev would open a new
 * connection pool per reload and exhaust Supabase's connection limit.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
