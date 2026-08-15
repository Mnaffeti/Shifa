/**
 * Seeds the database with the demo data that previously lived in the React
 * contexts' localStorage fallbacks. Idempotent: safe to re-run.
 *
 *   npm run db:seed
 */
import { PrismaClient, type AppointmentStatus, type AppointmentType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

const avatarFor = (first: string, last: string) =>
  `https://picsum.photos/seed/patient-${`${first} ${last}`.toLowerCase().replace(/\s+/g, '-')}/100/100`;

const PATIENTS = [
  { id: 'PT-001', firstName: 'Ahmed', lastName: 'Mansour', dob: '1985-05-15', gender: 'Homme', phone: '+216 22 345 678', email: 'ahmed.mansour@example.com', address: '12 Rue de Carthage, Tunis', profession: 'Ingénieur', cin: '08123456', bloodType: 'A+', status: 'Active' as const, lastVisit: daysAgo(9), createdAt: daysAgo(210) },
  { id: 'PT-002', firstName: 'Sarah', lastName: 'Ben Ammar', dob: '1992-08-22', gender: 'Femme', phone: '+216 98 765 432', email: 'sarah.benammar@example.com', address: '45 Avenue Habib Bourguiba, Sousse', profession: 'Enseignante', cin: '09234567', bloodType: 'O-', status: 'New' as const, lastVisit: null, createdAt: daysAgo(0) },
  { id: 'PT-003', firstName: 'Youssef', lastName: 'Trabelsi', dob: '1978-11-03', gender: 'Homme', phone: '+216 55 112 998', email: 'youssef.trabelsi@example.com', address: '7 Rue Ibn Khaldoun, Sfax', profession: 'Comptable', cin: '05987321', bloodType: 'B+', status: 'Active' as const, lastVisit: daysAgo(4), createdAt: daysAgo(160) },
  { id: 'PT-004', firstName: 'Leila', lastName: 'Haddad', dob: '1996-02-17', gender: 'Femme', phone: '+216 24 668 100', email: 'leila.haddad@example.com', address: '30 Rue de la Liberté, Bizerte', profession: 'Architecte', cin: '11445566', bloodType: 'A-', status: 'Active' as const, lastVisit: daysAgo(1), createdAt: daysAgo(95) },
  { id: 'PT-005', firstName: 'Karim', lastName: 'Bouazizi', dob: '2001-06-29', gender: 'Homme', phone: '+216 50 334 221', email: 'karim.bouazizi@example.com', address: '18 Avenue de Paris, Tunis', profession: 'Étudiant', cin: '14778899', bloodType: 'AB+', status: 'New' as const, lastVisit: null, createdAt: daysAgo(2) },
  { id: 'PT-006', firstName: 'Nour', lastName: 'Gharbi', dob: '1988-09-12', gender: 'Femme', phone: '+216 21 909 887', email: 'nour.gharbi@example.com', address: '5 Rue du Lac, Tunis', profession: 'Pharmacienne', cin: '07665544', bloodType: 'O+', status: 'Active' as const, lastVisit: daysAgo(6), createdAt: daysAgo(140) },
  { id: 'PT-007', firstName: 'Mehdi', lastName: 'Khelifi', dob: '1970-12-05', gender: 'Homme', phone: '+216 97 445 663', email: 'mehdi.khelifi@example.com', address: '22 Rue Alain Savary, Ariana', profession: 'Retraité', cin: '02334455', bloodType: 'B-', status: 'Inactive' as const, lastVisit: daysAgo(85), createdAt: daysAgo(300) },
  { id: 'PT-008', firstName: 'Emna', lastName: 'Jaziri', dob: '1999-04-08', gender: 'Femme', phone: '+216 26 771 200', email: 'emna.jaziri@example.com', address: '9 Rue de Rome, Nabeul', profession: 'Infirmière', cin: '13221100', bloodType: 'A+', status: 'Active' as const, lastVisit: daysAgo(3), createdAt: daysAgo(70) },
  { id: 'PT-009', firstName: 'Rania', lastName: 'Sassi', dob: '1983-07-25', gender: 'Femme', phone: '+216 52 118 334', email: 'rania.sassi@example.com', address: '61 Avenue de la République, Monastir', profession: 'Avocate', cin: '06554433', bloodType: 'AB-', status: 'Active' as const, lastVisit: daysAgo(12), createdAt: daysAgo(180) },
  { id: 'PT-010', firstName: 'Hedi', lastName: 'Belhaj', dob: '1965-03-19', gender: 'Homme', phone: '+216 23 556 778', email: 'hedi.belhaj@example.com', address: '3 Rue Farhat Hached, Gabès', profession: 'Commerçant', cin: '01998877', bloodType: 'O+', status: 'Active' as const, lastVisit: daysAgo(20), createdAt: daysAgo(240) },
  { id: 'PT-011', firstName: 'Amine', lastName: 'Zouari', dob: '1990-01-30', gender: 'Homme', phone: '+216 55 802 114', email: 'amine.zouari@example.com', address: '14 Rue de Marseille, Tunis', profession: 'Développeur', cin: '10442233', bloodType: 'A+', status: 'Active' as const, lastVisit: daysAgo(7), createdAt: daysAgo(120) },
  { id: 'PT-012', firstName: 'Ines', lastName: 'Chaabane', dob: '1994-06-11', gender: 'Femme', phone: '+216 98 220 447', email: 'ines.chaabane@example.com', address: '8 Rue de Palestine, Sousse', profession: 'Graphiste', cin: '12009988', bloodType: 'O+', status: 'Active' as const, lastVisit: daysAgo(2), createdAt: daysAgo(64) },
  { id: 'PT-013', firstName: 'Slim', lastName: 'Feriani', dob: '1958-10-02', gender: 'Homme', phone: '+216 22 771 900', email: 'slim.feriani@example.com', address: '2 Avenue Bourguiba, Kairouan', profession: 'Retraité', cin: '00223344', bloodType: 'B+', status: 'Active' as const, lastVisit: daysAgo(15), createdAt: daysAgo(320) },
  { id: 'PT-014', firstName: 'Yasmine', lastName: 'Dridi', dob: '2003-03-27', gender: 'Femme', phone: '+216 26 660 512', email: 'yasmine.dridi@example.com', address: '19 Rue du Caire, Ariana', profession: 'Étudiante', cin: '15778822', bloodType: 'A-', status: 'New' as const, lastVisit: null, createdAt: daysAgo(1), parentFirstName: 'Fatma', parentLastName: 'Dridi', parentComments: 'Mère — contact : +216 20 111 222' },
  { id: 'PT-015', firstName: 'Walid', lastName: 'Amri', dob: '1975-08-14', gender: 'Homme', phone: '+216 50 448 907', email: 'walid.amri@example.com', address: '41 Rue Ibn Sina, Sfax', profession: 'Professeur', cin: '04556677', bloodType: 'AB+', status: 'Active' as const, lastVisit: daysAgo(30), createdAt: daysAgo(200) },
  { id: 'PT-016', firstName: 'Salma', lastName: 'Ayari', dob: '1987-11-19', gender: 'Femme', phone: '+216 24 335 118', email: 'salma.ayari@example.com', address: '6 Rue de Grèce, Tunis', profession: 'Comptable', cin: '08772211', bloodType: 'O-', status: 'Active' as const, lastVisit: daysAgo(5), createdAt: daysAgo(110) },
  { id: 'PT-017', firstName: 'Bilel', lastName: 'Nasri', dob: '1998-05-06', gender: 'Homme', phone: '+216 97 009 663', email: 'bilel.nasri@example.com', address: '27 Avenue de Carthage, Nabeul', profession: 'Cuisinier', cin: '14003399', bloodType: 'B-', status: 'New' as const, lastVisit: null, createdAt: daysAgo(3) },
  { id: 'PT-018', firstName: 'Mariem', lastName: 'Loued', dob: '1969-02-23', gender: 'Femme', phone: '+216 52 664 900', email: 'mariem.loued@example.com', address: '11 Rue de Russie, Bizerte', profession: 'Fonctionnaire', cin: '02887766', bloodType: 'A+', status: 'Active' as const, lastVisit: daysAgo(18), createdAt: daysAgo(260) },
  { id: 'PT-019', firstName: 'Firas', lastName: 'Guesmi', dob: '2010-09-01', gender: 'Homme', phone: '+216 21 550 034', email: 'firas.guesmi@example.com', address: '3 Rue de Turquie, Monastir', profession: 'Écolier', cin: '—', bloodType: 'O+', status: 'Active' as const, lastVisit: daysAgo(11), createdAt: daysAgo(150), parentFirstName: 'Sami', parentLastName: 'Guesmi', parentComments: 'Père — suivi pédiatrique, asthme léger.' },
  { id: 'PT-020', firstName: 'Dorra', lastName: 'Mabrouk', dob: '1981-12-15', gender: 'Femme', phone: '+216 55 118 226', email: 'dorra.mabrouk@example.com', address: '50 Avenue de la Liberté, Gabès', profession: 'Dentiste', cin: '06009911', bloodType: 'AB-', status: 'Inactive' as const, lastVisit: daysAgo(120), createdAt: daysAgo(400) },
];

const DEMO_ROSTER = [
  'PT-001', 'PT-002', 'PT-003', 'PT-004', 'PT-005', 'PT-006', 'PT-008', 'PT-009',
  'PT-010', 'PT-011', 'PT-012', 'PT-013', 'PT-015', 'PT-016', 'PT-018', 'PT-019',
];
const DEMO_TYPES: AppointmentType[] = ['Consultation', 'FollowUp', 'Surgery'];
const DEMO_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'];

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}

/** Rebuilds the current-week schedule the frontend used to generate at runtime. */
function generateWeek(patientNames: Map<string, string>) {
  const today = new Date().toISOString().split('T')[0];
  const todayUTC = new Date(today + 'T00:00:00Z');
  const monday = new Date(todayUTC);
  monday.setUTCDate(todayUTC.getUTCDate() - ((todayUTC.getUTCDay() + 6) % 7));

  const out: Array<{
    patientId: string; patientName: string; doctor: string; date: string;
    startTime: string; endTime: string; duration: number;
    type: AppointmentType; status: AppointmentStatus;
  }> = [];

  let counter = 1;
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + i);
    const dateStr = day.toISOString().split('T')[0];
    const isPast = dateStr < today;
    const isToday = dateStr === today;
    const count = i >= 5 ? 3 : isToday ? 7 : 6;

    for (let j = 0; j < count; j++) {
      const patientId = DEMO_ROSTER[(counter - 1) % DEMO_ROSTER.length];
      const type = DEMO_TYPES[(i + j) % DEMO_TYPES.length];
      const startTime = DEMO_SLOTS[j % DEMO_SLOTS.length];
      const duration = type === 'Surgery' ? 60 : 30;

      const status: AppointmentStatus = isPast
        ? 'Completed'
        : isToday
          ? (j < 2 ? 'Completed' : j === 5 ? 'Pending' : 'Confirmed')
          : 'Confirmed';

      out.push({
        patientId,
        patientName: patientNames.get(patientId) ?? patientId,
        doctor: 'Dr. Youssef',
        date: dateStr,
        startTime,
        endTime: addMinutes(startTime, duration),
        duration,
        type,
        status,
      });
      counter++;
    }
  }
  return out;
}

async function main() {
  // Demo data doesn't belong in a production database. Require an explicit
  // opt-in so a stray `npm run db:seed` against prod can't happen by accident.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    throw new Error(
      'Refusing to seed a production database. Set ALLOW_PROD_SEED=true if you ' +
      'really intend to insert demo patients here.',
    );
  }

  console.log('Seeding…');

  // ── Accounts ──
  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword) {
    throw new Error(
      'SEED_PASSWORD is required so demo accounts do not ship with a hardcoded ' +
      'password. Set it in .env.local, e.g. SEED_PASSWORD="choose-a-strong-one".',
    );
  }

  const hash = await bcrypt.hash(seedPassword, 10);
  await prisma.account.upsert({
    where: { email: 'doctor@shifa.com' },
    create: {
      email: 'doctor@shifa.com', passwordHash: hash, name: 'Dr. Youssef',
      role: 'DOCTOR', specialty: 'Spécialiste',
      avatar: 'https://picsum.photos/seed/doctor-youssef/100/100',
    },
    update: {},
  });
  await prisma.account.upsert({
    where: { email: 'secretary@shifa.com' },
    create: {
      email: 'secretary@shifa.com', passwordHash: hash, name: 'Foulena',
      role: 'SECRETARY',
      avatar: 'https://picsum.photos/seed/secretary-sophie/100/100',
    },
    update: {},
  });
  console.log('  accounts: 2');

  // ── Patients + empty charts ──
  for (const p of PATIENTS) {
    await prisma.patient.upsert({
      where: { id: p.id },
      create: {
        ...p,
        assignedDoctor: 'Dr. Youssef',
        avatar: avatarFor(p.firstName, p.lastName),
        chart: { create: {} },
      },
      update: {},
    });
  }
  console.log(`  patients: ${PATIENTS.length}`);

  // ── Chart detail for PT-001 (the richest demo record) ──
  const chart1 = await prisma.chart.findUnique({
    where: { patientId: 'PT-001' },
    include: { allergies: true },
  });
  if (chart1 && chart1.allergies.length === 0) {
    await prisma.allergy.createMany({
      data: [
        { chartId: 'PT-001', substance: 'Pénicilline', severity: 'severe', reaction: 'Choc anaphylactique' },
        { chartId: 'PT-001', substance: 'Aspirine', severity: 'mild', reaction: 'Urticaire' },
      ],
    });
    await prisma.antecedent.createMany({
      data: [
        { chartId: 'PT-001', type: 'medical', description: 'Hypertension artérielle', date: '2018' },
        { chartId: 'PT-001', type: 'medical', description: 'Diabète de type 2', date: '2020' },
        { chartId: 'PT-001', type: 'surgical', description: 'Appendicectomie', date: '2010' },
        { chartId: 'PT-001', type: 'familial', description: 'Cardiopathie ischémique (père)' },
      ],
    });
    await prisma.activeProblem.createMany({
      data: [
        { chartId: 'PT-001', cimCode: 'I10', label: 'Hypertension artérielle', dateOnset: '2018-03-01', status: 'active' },
        { chartId: 'PT-001', cimCode: 'E11', label: 'Diabète de type 2', dateOnset: '2020-06-15', status: 'active' },
      ],
    });
    await prisma.chronicTreatment.createMany({
      data: [
        { chartId: 'PT-001', name: 'Amlodipine', dosage: '5 mg', frequency: '1×/jour', since: '2018-04' },
        { chartId: 'PT-001', name: 'Metformine', dosage: '850 mg', frequency: '2×/jour', since: '2020-07' },
        { chartId: 'PT-001', name: 'Périndopril', dosage: '5 mg', frequency: '1×/jour matin', since: '2021-01' },
      ],
    });
    await prisma.vitals.create({
      data: { chartId: 'PT-001', date: '2024-04-10', weight: 83, height: 175, bp: '148/92', hr: 82, temp: 36.9, spo2: 97 },
    });
    console.log('  chart PT-001: populated');
  }

  // ── Appointments ──
  const existingAppointments = await prisma.appointment.count();
  if (existingAppointments === 0) {
    const names = new Map(PATIENTS.map(p => [p.id, `${p.firstName} ${p.lastName}`]));
    const week = generateWeek(names);
    await prisma.appointment.createMany({ data: week });
    console.log(`  appointments: ${week.length}`);
  } else {
    console.log(`  appointments: ${existingAppointments} already present, skipped`);
  }

  // ── Reminders ──
  if (await prisma.reminder.count() === 0) {
    await prisma.reminder.createMany({
      data: [
        { text: 'Transmettre les résultats de laboratoire à Ahmed Mansour', dueTime: '14:00', authorRole: 'SECRETARY', authorName: 'Foulena', done: false },
        { text: 'Revoir la posologie avant la prochaine consultation', authorRole: 'DOCTOR', authorName: 'Dr. Youssef', done: false },
      ],
    });
    console.log('  reminders: 2');
  }

  console.log('Done.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
