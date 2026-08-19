/**
 * Creates (or updates) the admin account used to view demo visitors.
 *
 * Admins cannot be self-registered — the public signup endpoint only accepts
 * DOCTOR and SECRETARY — so this script is the way to provision one.
 *
 *   ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="..." npm run db:create-admin
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'Administrateur';

  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD are required.\n' +
      'Example: ADMIN_EMAIL="admin@shifa.com" ADMIN_PASSWORD="..." npm run db:create-admin',
    );
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const account = await prisma.account.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      name,
      role: 'ADMIN',
      avatar: `https://picsum.photos/seed/${encodeURIComponent(email)}/100/100`,
    },
    // Re-running rotates the password rather than creating a duplicate.
    update: { passwordHash, name, role: 'ADMIN' },
  });

  console.log(`Admin ready: ${account.email} (${account.name})`);
}

main()
  .catch(e => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
