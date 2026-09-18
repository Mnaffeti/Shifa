/**
 * Typed client for the SHIFA backend — back-office subset.
 *
 * Deliberately narrower than the doctor app's client: an admin never reads
 * patients, charts, appointments or consultations, so those modules are absent
 * here rather than shipped and unused.
 *
 * Every call sends `credentials: 'include'` so the httpOnly session cookie
 * travels with the request — the frontend never handles a token itself.
 */

/**
 * Where the API lives.
 *
 * The back office is served on its own origin (a separate nginx), so unlike
 * the doctor app it cannot rely on a same-origin /api path. VITE_API_URL is
 * therefore required, and the API must list this origin in ALLOWED_ORIGIN or
 * the session cookie is refused.
 */
const BASE_URL = (import.meta.env.VITE_API_URL?.trim() ?? '').replace(/\/$/, '');

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
  email?: string;
  matricule?: string;
  name: string;
  avatar: string;
  role: 'DOCTOR' | 'ADMIN';
  specialty?: string;
  phone?: string;
  mustChangePassword: boolean;
}

export const authApi = {
  me: () => get<{ user: ApiUser | null }>('/api/auth/me'),
  /** `identifier` is an e-mail for admins, a matricule for doctors. */
  login: (identifier: string, password: string) =>
    post<{ user: ApiUser }>('/api/auth/login', { identifier, password }),
  logout: () => post<{ success: true }>('/api/auth/logout'),
};

// ─── Back office ────────────────────────────────────────────────────────────

export interface DoctorRequest {
  id: string;
  name: string;
  matricule: string;
  specialty: string;
  phone: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

/** A doctor account, with the activity counters kept on the row itself. */
export interface DoctorAccount {
  id: string;
  name: string;
  matricule: string | null;
  specialty: string | null;
  phone: string | null;
  mustChangePassword: boolean;
  /** False once the back office revokes access; the account cannot sign in. */
  isActive: boolean;
  /** Null until the doctor signs in for the first time. */
  lastLoginAt: string | null;
  /** Successful sign-ins, counted on the account itself. */
  loginCount: number;
  /** End of the free trial; null once converted to unlimited access. */
  trialEndsAt: string | null;
  /** Whole days left. Null = unlimited, 0 = expired (sign-in blocked). */
  trialDaysLeft: number | null;
  createdAt: string;
}

/**
 * Activity counters for one doctor. Counters only — an admin never sees
 * patient names or any clinical content.
 */
export interface DoctorStats {
  patients: number;
  appointments: number;
  consultations: number;
  /** Appointments from today onward that are still pending or confirmed. */
  upcoming: number;
}

/** Issued once when an account is provisioned; never re-displayed. */
export interface ProvisionResult {
  doctor: { name: string; matricule: string; specialty: string; phone: string };
  temporaryPassword: string;
}

/** An administrator account. */
export interface AdminAccount {
  id: string;
  name: string;
  email: string | null;
  lastLoginAt: string | null;
  loginCount: number;
  createdAt: string;
  /** True for the signed-in admin's own row. */
  isSelf: boolean;
}

/** One back-office action, as recorded at the time it happened. */
export type AuditAction =
  | 'ADMIN_CREATED' | 'ADMIN_DELETED'
  | 'TRIAL_EXTENDED' | 'TRIAL_CONVERTED'
  | 'DOCTOR_CREATED' | 'DOCTOR_UPDATED' | 'DOCTOR_ACTIVATED' | 'DOCTOR_DEACTIVATED'
  | 'DOCTOR_DELETED' | 'DOCTOR_PASSWORD_RESET' | 'REQUEST_ACCEPTED' | 'REQUEST_REJECTED';

export interface AuditEntry {
  id: string;
  action: AuditAction;
  /** The admin's name at the time — not re-resolved, so it never shifts. */
  actorName: string;
  /** The account acted upon, labelled as it was then. */
  targetLabel: string;
  details: string | null;
  createdAt: string;
}

export const adminApi = {
  doctors: {
    list: () => get<{ doctors: DoctorAccount[] }>('/api/admin/doctors'),
    create: (data: { name: string; matricule: string; specialty: string; phone: string }) =>
      post<ProvisionResult>('/api/admin/doctors', data),
    /** Edit details, or revoke/restore access with `isActive`. */
    update: (id: string, data: Partial<{
      name: string; matricule: string; specialty: string; phone: string; isActive: boolean;
    }>) => patch<{ doctor: DoctorAccount }>(`/api/admin/doctors/${id}`, data),
    /** Only permitted for an account that never signed in and owns no patients. */
    remove: (id: string) => del<{ success: true }>(`/api/admin/doctors/${id}`),
    /**
     * Issues a fresh temporary password, returned once. Use when a doctor
     * lost the one relayed at provisioning — there is no self-service reset,
     * since accounts sign in with a matricule and carry no verified e-mail.
     */
    /** Grant more trial days, or convert to unlimited access. */
    trial: (id: string, data: { extendDays: number } | { convert: true }) =>
      post<{ doctor: { id: string; name: string; trialEndsAt: string | null; trialDaysLeft: number | null } }>(
        `/api/admin/doctors/${id}/trial`, data,
      ),
    /** Counters for the detail panel; carries no patient data. */
    stats: (id: string) => get<{ stats: DoctorStats }>(`/api/admin/doctors/${id}/stats`),
    resetPassword: (id: string) =>
      post<{
        doctor: { name: string; matricule: string };
        temporaryPassword: string;
      }>(`/api/admin/doctors/${id}/reset-password`),
  },

  admins: {
    list: () => get<{ admins: AdminAccount[] }>('/api/admin/admins'),
    create: (data: { name: string; email: string; password: string }) =>
      post<{ admin: AdminAccount }>('/api/admin/admins', data),
    /** Refused for your own account, and for the last remaining admin. */
    remove: (id: string) => del<{ success: true }>(`/api/admin/admins/${id}`),
  },

  /** Read-only: there is no endpoint to edit or remove an entry. */
  audit: {
    list: (params?: { action?: AuditAction; targetId?: string; limit?: number; cursor?: string }) => {
      const q = new URLSearchParams(
        Object.entries(params ?? {})
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)]),
      ).toString();
      return get<{ entries: AuditEntry[]; nextCursor: string | null }>(
        `/api/admin/audit${q ? `?${q}` : ''}`,
      );
    },
  },

  doctorRequests: {
    list: () => get<{ requests: DoctorRequest[] }>('/api/admin/doctor-requests'),
    /** Accepts a pending request: creates the account and issues a password. */
    accept: (id: string) =>
      post<ProvisionResult>(`/api/admin/doctor-requests/${id}/accept`),
    reject: (id: string) =>
      post<{ success: true }>(`/api/admin/doctor-requests/${id}/reject`),
  },
};
