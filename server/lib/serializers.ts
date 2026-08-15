import type {
  Patient, Appointment, Consultation, Chart, Vitals, Reminder,
  Allergy, Antecedent, ActiveProblem, ChronicTreatment, MedicalAlert,
  ClinicalNote, Attachment, OrdonnanceItem, Addendum, Account,
} from '@prisma/client';

/**
 * Maps database rows back to the exact object shapes the frontend contexts
 * were already built against. Keeping this translation in one place means the
 * React code needs no reshaping when it swaps localStorage for fetch().
 *
 * Two conversions matter throughout:
 *   - `lastVisit: null` in the DB is the old sentinel string "Never".
 *   - DateTime columns serialize to ISO strings, matching the old model.
 */

export function serializeAccount(a: Account) {
  return {
    email: a.email,
    name: a.name,
    avatar: a.avatar,
    role: a.role,
    ...(a.specialty ? { specialty: a.specialty } : {}),
  };
}

export function serializePatient(p: Patient) {
  return {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    dob: p.dob,
    gender: p.gender,
    phone: p.phone,
    email: p.email,
    address: p.address,
    profession: p.profession,
    cin: p.cin,
    ...(p.parentFirstName ? { parentFirstName: p.parentFirstName } : {}),
    ...(p.parentLastName ? { parentLastName: p.parentLastName } : {}),
    ...(p.parentComments ? { parentComments: p.parentComments } : {}),
    assignedDoctor: p.assignedDoctor,
    bloodType: p.bloodType,
    status: p.status,
    lastVisit: p.lastVisit ?? 'Never',
    avatar: p.avatar,
    createdAt: p.createdAt,
  };
}

/** The DB enum uses FollowUp; the frontend union uses "Follow-up". */
function appointmentType(t: Appointment['type']): string {
  return t === 'FollowUp' ? 'Follow-up' : t;
}

export function serializeAppointment(a: Appointment) {
  return {
    id: a.id,
    patientId: a.patientId,
    patientName: a.patientName,
    doctor: a.doctor,
    date: a.date,
    startTime: a.startTime,
    endTime: a.endTime,
    ...(a.duration !== null ? { duration: a.duration } : {}),
    type: appointmentType(a.type),
    status: a.status,
    ...(a.notes ? { notes: a.notes } : {}),
  };
}

export function serializeVitals(v: Vitals | null | undefined) {
  if (!v) return undefined;
  return {
    date: v.date,
    ...(v.weight !== null ? { weight: v.weight } : {}),
    ...(v.height !== null ? { height: v.height } : {}),
    ...(v.bp !== null ? { bp: v.bp } : {}),
    ...(v.hr !== null ? { hr: v.hr } : {}),
    ...(v.temp !== null ? { temp: v.temp } : {}),
    ...(v.spo2 !== null ? { spo2: v.spo2 } : {}),
  };
}

type ChartWithRelations = Chart & {
  allergies: Allergy[];
  antecedents: Antecedent[];
  problemesActifs: ActiveProblem[];
  traitements: ChronicTreatment[];
  alertes: MedicalAlert[];
  notes: ClinicalNote[];
  attachments: Attachment[];
  vitals: Vitals | null;
};

/**
 * @param includeAttachmentData when false, attachment `dataUrl` blobs are
 * replaced with an empty string. List views never need the base64 payload,
 * and including it makes chart responses enormous.
 */
export function serializeChart(c: ChartWithRelations, includeAttachmentData = false) {
  return {
    patientId: c.patientId,
    allergies: c.allergies.map(a => ({
      id: a.id, substance: a.substance, severity: a.severity, reaction: a.reaction,
    })),
    antecedents: c.antecedents.map(a => ({
      id: a.id, type: a.type, description: a.description,
      ...(a.date ? { date: a.date } : {}),
    })),
    problemesActifs: c.problemesActifs.map(p => ({
      id: p.id,
      ...(p.cimCode ? { cimCode: p.cimCode } : {}),
      label: p.label, dateOnset: p.dateOnset, status: p.status,
    })),
    traitements: c.traitements.map(t => ({
      id: t.id, name: t.name, dosage: t.dosage, frequency: t.frequency, since: t.since,
    })),
    alertes: c.alertes.map(a => ({ id: a.id, label: a.label })),
    notes: c.notes.map(n => ({
      id: n.id, text: n.text, author: n.author, createdAt: n.createdAt.toISOString(),
    })),
    attachments: c.attachments.map(a => ({
      id: a.id, name: a.name, kind: a.kind, mimeType: a.mimeType,
      dataUrl: includeAttachmentData ? a.dataUrl : '',
      addedAt: a.addedAt.toISOString(), addedBy: a.addedBy,
    })),
    dernieresConstantes: serializeVitals(c.vitals),
  };
}

/** An empty chart, matching the frontend's default when none exists yet. */
export function emptyChart(patientId: string) {
  return {
    patientId,
    allergies: [], antecedents: [], problemesActifs: [], traitements: [],
    alertes: [], notes: [], attachments: [],
    dernieresConstantes: undefined,
  };
}

type ConsultationWithRelations = Consultation & {
  ordonnance: OrdonnanceItem[];
  addenda: Addendum[];
  constantes: Vitals | null;
};

export function serializeConsultation(c: ConsultationWithRelations) {
  return {
    id: c.id,
    patientId: c.patientId,
    appointmentId: c.appointmentId ?? '',
    date: c.date,
    doctor: c.doctor,
    soap: {
      subjectif: c.subjectif,
      objectif: c.objectif,
      assessment: c.assessment,
      plan: c.plan,
    },
    diagnoses: c.diagnoses,
    constantes: serializeVitals(c.constantes),
    ordonnance: {
      items: [...c.ordonnance]
        .sort((a, b) => a.position - b.position)
        .map(i => ({
          id: i.id, medication: i.medication, dosage: i.dosage,
          frequency: i.frequency, duration: i.duration,
          ...(i.instructions ? { instructions: i.instructions } : {}),
        })),
      ...(c.renewedFromId ? { renewedFromId: c.renewedFromId } : {}),
      ...(c.templateName ? { templateName: c.templateName } : {}),
    },
    status: c.status,
    ...(c.signedAt ? { signedAt: c.signedAt.toISOString() } : {}),
    ...(c.signedBy ? { signedBy: c.signedBy } : {}),
    addenda: c.addenda.map(a => ({
      text: a.text, addedBy: a.addedBy, addedAt: a.addedAt.toISOString(),
    })),
  };
}

export function serializeReminder(r: Reminder) {
  return {
    id: r.id,
    text: r.text,
    ...(r.dueTime ? { dueTime: r.dueTime } : {}),
    authorRole: r.authorRole,
    authorName: r.authorName,
    done: r.done,
    createdAt: r.createdAt.toISOString(),
  };
}
