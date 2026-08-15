import { z } from 'zod';

/** Request-body schemas. Mirrors the field sets the frontend forms already send. */

export const loginSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const signupSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  role: z.enum(['DOCTOR', 'SECRETARY']),
  specialty: z.string().optional(),
});

const patientFields = {
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dob: z.string(),
  gender: z.string(),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
  profession: z.string(),
  cin: z.string(),
  parentFirstName: z.string().optional(),
  parentLastName: z.string().optional(),
  parentComments: z.string().optional(),
  assignedDoctor: z.string().min(1),
  bloodType: z.string(),
  status: z.enum(['Active', 'New', 'Inactive']).optional(),
};

export const createPatientSchema = z.object(patientFields);
export const updatePatientSchema = z.object({
  ...patientFields,
  lastVisit: z.string().optional(),
}).partial();

const APPOINTMENT_TYPES = ['Consultation', 'Follow-up', 'Surgery', 'Cancelled'] as const;
const APPOINTMENT_STATUSES = ['Pending', 'Confirmed', 'Cancelled', 'Completed'] as const;

export const createAppointmentSchema = z.object({
  patientId: z.string().min(1),
  patientName: z.string().min(1),
  doctor: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format yyyy-MM-dd'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Heure attendue au format HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Heure attendue au format HH:MM'),
  duration: z.number().int().positive().optional(),
  type: z.enum(APPOINTMENT_TYPES),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  notes: z.string().optional(),
});

export const updateAppointmentSchema = createAppointmentSchema.partial();

export const vitalsSchema = z.object({
  date: z.string(),
  weight: z.number().optional(),
  height: z.number().optional(),
  bp: z.string().optional(),
  hr: z.number().optional(),
  temp: z.number().optional(),
  spo2: z.number().optional(),
});

export const chartUpdateSchema = z.object({
  allergies: z.array(z.object({
    substance: z.string(),
    severity: z.enum(['mild', 'moderate', 'severe']),
    reaction: z.string(),
  })).optional(),
  antecedents: z.array(z.object({
    type: z.enum(['medical', 'surgical', 'familial']),
    description: z.string(),
    date: z.string().optional(),
  })).optional(),
  problemesActifs: z.array(z.object({
    cimCode: z.string().optional(),
    label: z.string(),
    dateOnset: z.string(),
    status: z.enum(['active', 'resolved']).optional(),
  })).optional(),
  traitements: z.array(z.object({
    name: z.string(), dosage: z.string(), frequency: z.string(), since: z.string(),
  })).optional(),
  alertes: z.array(z.object({ label: z.string() })).optional(),
  dernieresConstantes: vitalsSchema.optional(),
});

export const noteSchema = z.object({
  text: z.string().min(1),
  author: z.string().min(1),
});

export const attachmentSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(['scan', 'photo', 'document']),
  mimeType: z.string(),
  dataUrl: z.string(),
  addedBy: z.string(),
});

export const createConsultationSchema = z.object({
  patientId: z.string().min(1),
  appointmentId: z.string().optional(),
  date: z.string(),
  doctor: z.string().min(1),
});

export const updateConsultationSchema = z.object({
  soap: z.object({
    subjectif: z.string().optional(),
    objectif: z.string().optional(),
    assessment: z.string().optional(),
    plan: z.string().optional(),
  }).optional(),
  diagnoses: z.array(z.string()).optional(),
  constantes: vitalsSchema.optional(),
  ordonnance: z.object({
    items: z.array(z.object({
      medication: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      duration: z.string(),
      instructions: z.string().optional(),
    })),
    renewedFromId: z.string().optional(),
    templateName: z.string().optional(),
  }).optional(),
});

export const signConsultationSchema = z.object({ doctor: z.string().min(1) });
export const addendumSchema = z.object({
  text: z.string().min(1),
  addedBy: z.string().min(1),
});

export const createReminderSchema = z.object({
  text: z.string().min(1),
  dueTime: z.string().optional(),
  authorRole: z.enum(['DOCTOR', 'SECRETARY']),
  authorName: z.string().min(1),
});

export const updateReminderSchema = z.object({
  text: z.string().min(1).optional(),
  dueTime: z.string().optional(),
  done: z.boolean().optional(),
});

export const waitlistSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  reason: z.string().optional(),
});
