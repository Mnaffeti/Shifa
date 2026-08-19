/**
 * Typed client for the SHIFA backend.
 *
 * Every call sends `credentials: 'include'` so the httpOnly session cookie
 * travels with the request — the frontend never handles a token itself.
 *
 * Response shapes intentionally match the interfaces the React contexts were
 * already written against, so swapping localStorage for these calls does not
 * reshape any component.
 */

import type { Patient } from '../context/PatientContext';
import type { Appointment } from '../context/AppointmentContext';
import type { PatientChart, Vitals, ClinicalNote, Attachment } from '../context/ChartContext';
import type { Consultation } from '../context/ConsultationContext';
import type { Reminder } from '../context/ReminderContext';

/**
 * Where the API lives.
 *
 * In production this is empty on purpose: `vercel.json` rewrites /api/* to the
 * backend deployment, so requests stay on the frontend's own origin and the
 * session cookie is first-party. Pointing straight at the backend domain makes
 * it a third-party cookie, which Safari blocks outright and Chrome and Brave
 * block by default — the user appears logged in, then every call returns 401.
 *
 * In development there is no rewrite, so VITE_API_URL points at the local API.
 */
const BASE_URL = (() => {
  const configured = import.meta.env.VITE_API_URL?.trim();

  // A cross-origin absolute URL in production would defeat the rewrite and
  // reintroduce the third-party cookie, so ignore it there. Development still
  // honours it, since no rewrite exists locally.
  if (configured && (import.meta.env.DEV || configured.startsWith('/'))) {
    return configured.replace(/\/$/, '');
  }

  return import.meta.env.DEV ? 'http://localhost:4000' : '';
})();

/** Thrown for any non-2xx response; carries the status so callers can branch. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** True when the session is missing or expired. */
  get isUnauthenticated(): boolean {
    return this.status === 401;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    // Network-level failure: server down, DNS, CORS preflight rejected.
    throw new ApiError('Impossible de joindre le serveur', 0);
  }

  if (response.status === 204) return undefined as T;

  let payload: any;
  try {
    payload = await response.json();
  } catch {
    if (!response.ok) throw new ApiError('Erreur serveur', response.status);
    throw new ApiError('Réponse invalide du serveur', response.status);
  }

  if (!response.ok) {
    throw new ApiError(payload?.error ?? 'Erreur serveur', response.status, payload?.details);
  }

  return payload as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface ApiUser {
  email: string;
  name: string;
  avatar: string;
  role: 'DOCTOR' | 'SECRETARY';
  specialty?: string;
}

export const demoApi = {
  /** Provisions an isolated demo workspace and signs the visitor into it. */
  start: (data: { name: string; phone: string; specialty?: string }) =>
    post<{ user: ApiUser }>('/api/demo/start', data),
  /** Visitors who opened the demo, most recent first. Requires a session. */
  leads: () => get<{ leads: DemoLead[] }>('/api/demo/leads'),
};

export interface DemoLead {
  id: string;
  name: string;
  phone: string;
  specialty: string | null;
  visits: number;
  createdAt: string;
  lastSeenAt: string;
}

export const authApi = {
  me: () => get<{ user: ApiUser | null }>('/api/auth/me'),
  login: (email: string, password: string) =>
    post<{ user: ApiUser }>('/api/auth/login', { email, password }),
  signup: (data: {
    name: string; email: string; password: string;
    role: 'DOCTOR' | 'SECRETARY'; specialty?: string;
  }) => post<{ user: ApiUser }>('/api/auth/signup', data),
  logout: () => post<{ success: true }>('/api/auth/logout'),
};

// ─── Patients ───────────────────────────────────────────────────────────────

export type NewPatientInput = Omit<Patient, 'id' | 'lastVisit' | 'avatar' | 'createdAt' | 'status'>
  & { status?: Patient['status'] };

export const patientsApi = {
  list: () => get<{ patients: Patient[] }>('/api/patients'),
  get: (id: string) => get<{ patient: Patient }>(`/api/patients/${id}`),
  create: (data: NewPatientInput) => post<{ patient: Patient }>('/api/patients', data),
  update: (id: string, data: Partial<Patient>) =>
    patch<{ patient: Patient }>(`/api/patients/${id}`, data),
  remove: (id: string) => del<{ success: true }>(`/api/patients/${id}`),
};

// ─── Appointments ───────────────────────────────────────────────────────────

export const appointmentsApi = {
  list: (params?: { date?: string; patientId?: string; from?: string; to?: string }) => {
    const q = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][],
    ).toString();
    return get<{ appointments: Appointment[] }>(`/api/appointments${q ? `?${q}` : ''}`);
  },
  create: (data: Omit<Appointment, 'id'>) =>
    post<{ appointment: Appointment }>('/api/appointments', data),
  update: (id: string, data: Partial<Appointment>) =>
    patch<{ appointment: Appointment }>(`/api/appointments/${id}`, data),
  remove: (id: string) => del<{ success: true }>(`/api/appointments/${id}`),
};

// ─── Charts ─────────────────────────────────────────────────────────────────

export const chartsApi = {
  /** Attachment blobs are omitted unless `withAttachmentData` is set. */
  get: (patientId: string, withAttachmentData = false) =>
    get<{ chart: PatientChart }>(
      `/api/patients/${patientId}/chart${withAttachmentData ? '?withAttachmentData=1' : ''}`,
    ),
  update: (patientId: string, fields: Partial<PatientChart>) =>
    patch<{ chart: PatientChart }>(`/api/patients/${patientId}/chart`, fields),
  updateVitals: (patientId: string, vitals: Vitals) =>
    patch<{ chart: PatientChart }>(`/api/patients/${patientId}/chart`, {
      dernieresConstantes: vitals,
    }),

  addNote: (patientId: string, text: string, author: string) =>
    post<{ note: ClinicalNote }>(`/api/patients/${patientId}/chart/notes`, { text, author }),
  removeNote: (patientId: string, noteId: string) =>
    del<{ success: true }>(`/api/patients/${patientId}/chart/notes/${noteId}`),

  addAttachment: (patientId: string, a: Omit<Attachment, 'id' | 'addedAt'>) =>
    post<{ attachment: Attachment }>(`/api/patients/${patientId}/chart/attachments`, a),
  /** Fetches the full base64 payload for a single attachment, on demand. */
  getAttachment: (patientId: string, attachmentId: string) =>
    get<{ attachment: Attachment }>(
      `/api/patients/${patientId}/chart/attachments/${attachmentId}`,
    ),
  removeAttachment: (patientId: string, attachmentId: string) =>
    del<{ success: true }>(`/api/patients/${patientId}/chart/attachments/${attachmentId}`),
};

// ─── Consultations ──────────────────────────────────────────────────────────

export const consultationsApi = {
  list: (params?: { patientId?: string; appointmentId?: string }) => {
    const q = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][],
    ).toString();
    return get<{ consultations: Consultation[] }>(`/api/consultations${q ? `?${q}` : ''}`);
  },
  /** Get-or-create: returns the existing draft when one already exists. */
  getOrCreate: (data: {
    patientId: string; appointmentId?: string; date: string; doctor: string;
  }) => post<{ consultation: Consultation }>('/api/consultations', data),
  update: (id: string, data: Partial<Pick<Consultation, 'soap' | 'diagnoses' | 'constantes' | 'ordonnance'>>) =>
    patch<{ consultation: Consultation }>(`/api/consultations/${id}`, data),
  sign: (id: string, doctor: string) =>
    post<{ consultation: Consultation }>(`/api/consultations/${id}/sign`, { doctor }),
  unlock: (id: string) =>
    post<{ consultation: Consultation }>(`/api/consultations/${id}/unlock`),
  addAddendum: (id: string, text: string, addedBy: string) =>
    post<{ consultation: Consultation }>(`/api/consultations/${id}/addenda`, { text, addedBy }),
};

// ─── Reminders ──────────────────────────────────────────────────────────────

export const remindersApi = {
  list: () => get<{ reminders: Reminder[] }>('/api/reminders'),
  create: (data: Pick<Reminder, 'text' | 'authorRole' | 'authorName'> & { dueTime?: string }) =>
    post<{ reminder: Reminder }>('/api/reminders', data),
  update: (id: string, data: Partial<Pick<Reminder, 'text' | 'dueTime' | 'done'>>) =>
    patch<{ reminder: Reminder }>(`/api/reminders/${id}`, data),
  remove: (id: string) => del<{ success: true }>(`/api/reminders/${id}`),
};

// ─── Waitlist ───────────────────────────────────────────────────────────────

export interface WaitlistEntry {
  id: string;
  name: string;
  phone: string;
  reason?: string;
  createdAt: string;
}

export const waitlistApi = {
  list: () => get<{ entries: WaitlistEntry[] }>('/api/waitlist'),
  add: (data: { name: string; phone: string; reason?: string }) =>
    post<{ entry: WaitlistEntry }>('/api/waitlist', data),
};

export const healthApi = {
  check: () => get<{ status: string; database: string }>('/api/health'),
};
