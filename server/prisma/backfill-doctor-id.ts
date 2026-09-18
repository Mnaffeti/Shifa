/**
 * One-off migration: fill doctorId on patients, appointments and consultations
 * — and authorId on reminders — from the doctor *name* they were previously
 * linked by.
 *
 *   npm run db:backfill-doctor-id
 *
 * Why this exists: ownership used to be a name-string comparison
 * (`assignedDoctor === user.name`), so renaming a doctor silently detached
 * every record they owned, and two doctors sharing a name shared patients.
 * doctorId fixes both, but existing rows have to be matched by name once.
 *
 * Idempotent: rows that already carry a doctorId are left alone, so it is safe
 * to re-run. Rows whose name matches no account, or matches several, are
 * reported and left null rather than guessed at.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Backfilling doctorId…');

  const doctors = await prisma.account.findMany({
    where: { role: 'DOCTOR' },
    select: { id: true, name: true },
  });

  // A name shared by two accounts cannot be resolved safely — that ambiguity
  // is precisely the bug this migration exists to end, so refuse to guess.
  const byName = new Map<string, string | null>();
  for (const d of doctors) {
    byName.set(d.name, byName.has(d.name) ? null : d.id);
  }

  const ambiguous = [...byName.entries()].filter(([, id]) => id === null).map(([n]) => n);
  if (ambiguous.length > 0) {
    console.warn(`  ⚠ ${ambiguous.length} name(s) shared by several accounts, skipped: ${ambiguous.join(', ')}`);
  }

  const unmatched = new Set<string>();
  let patients = 0;
  let appointments = 0;
  let consultations = 0;
  let reminders = 0;

  for (const [name, id] of byName) {
    if (!id) continue;

    patients += (await prisma.patient.updateMany({
      where: { assignedDoctor: name, doctorId: null },
      data: { doctorId: id },
    })).count;

    appointments += (await prisma.appointment.updateMany({
      where: { doctor: name, doctorId: null },
      data: { doctorId: id },
    })).count;

    consultations += (await prisma.consultation.updateMany({
      where: { doctor: name, doctorId: null },
      data: { doctorId: id },
    })).count;

    reminders += (await prisma.reminder.updateMany({
      where: { authorName: name, authorId: null },
      data: { authorId: id },
    })).count;
  }

  console.log(`  patients:      ${patients}`);
  console.log(`  appointments:  ${appointments}`);
  console.log(`  consultations: ${consultations}`);
  console.log(`  reminders:     ${reminders}`);

  // Anything still null points at a name with no matching account — usually
  // demo data, or a doctor whose account was removed. Report it so it can be
  // reassigned by hand rather than disappearing quietly.
  for (const [label, rows] of [
    ['patients', await prisma.patient.findMany({ where: { doctorId: null }, select: { assignedDoctor: true } })],
    ['appointments', await prisma.appointment.findMany({ where: { doctorId: null }, select: { doctor: true } })],
    ['consultations', await prisma.consultation.findMany({ where: { doctorId: null }, select: { doctor: true } })],
    ['reminders', await prisma.reminder.findMany({ where: { authorId: null }, select: { authorName: true } })],
  ] as const) {
    if (rows.length === 0) continue;
    for (const r of rows) {
      unmatched.add(
        'assignedDoctor' in r ? r.assignedDoctor : 'authorName' in r ? r.authorName : r.doctor,
      );
    }
    console.warn(`  ⚠ ${rows.length} ${label} left unassigned`);
  }

  if (unmatched.size > 0) {
    console.warn(`  ⚠ no DOCTOR account matches: ${[...unmatched].join(', ')}`);
  }

  console.log('Done.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
