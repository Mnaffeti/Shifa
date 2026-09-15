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

/** A real doctor account, as opposed to the DemoLead registration log. */
export interface DoctorAccount {
  id: string;
  name: string;
  matricule: string | null;
  specialty: string | null;
  phone: string | null;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface DemoLead {
  id: string;
  name: string;
  phone: string;
  specialty: string | null;
  email: string | null;
  visits: number;
  createdAt: string;
  lastSeenAt: string;
}

/** Issued once when an account is provisioned; never re-displayed. */
export interface ProvisionResult {
  doctor: { name: string; matricule: string; specialty: string; phone: string };
  temporaryPassword: string;
}

export const adminApi = {
  /** Registration log — may drift from the account list; see doctors.list. */
  leads: () => get<{ leads: DemoLead[] }>('/api/demo/leads'),

  doctors: {
    list: () => get<{ doctors: DoctorAccount[] }>('/api/admin/doctors'),
    create: (data: { name: string; matricule: string; specialty: string; phone: string }) =>
      post<ProvisionResult>('/api/admin/doctors', data),
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
