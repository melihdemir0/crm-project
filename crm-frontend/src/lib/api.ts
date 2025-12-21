import type { ActivityDTO, ActivityType } from "../types/activity";

/** Backend base URL */
const API_URL = "http://localhost:3000/api";

/** ----------------------------- */
/** Storage helpers               */
/** ----------------------------- */
const ACCESS_KEY = "accessToken";
const EMAIL_KEY = "email";
const ROLE_KEY = "role";

function getAny(key: string) {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? null;
}
function clearKeys(...keys: string[]) {
  keys.forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

function qsFrom(params?: Record<string, any>) {
  const sp = new URLSearchParams();
  if (!params) return "";
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** ----------------------------- */
/** Temel istek fonksiyonu        */
/** ----------------------------- */
export async function req<T = any>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const headers = new Headers(opts.headers || {});
  if (!headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");

  const token = getAny(ACCESS_KEY);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(API_URL + path, { ...opts, headers });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = (j as any)?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

/* ============================================================
   AI
============================================================ */
export const Ai = {
  chat: (
    messages: { role: "system" | "user" | "assistant"; content: string }[]
  ) =>
    req<{ reply: string }>(`/ai/chat`, {
      method: "POST",
      body: JSON.stringify({ messages }),
    }),
};

/** ----------------------------- */
/** JWT decode (payload)          */
/** ----------------------------- */
export function decodeJwt<T = any>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    const json = decodeURIComponent(
      atob(payload)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** ----------------------------- */
/** Ortak tipler                  */
/** ----------------------------- */
export type Order = "ASC" | "DESC";
export type Paginated<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    sort: string;
    order: Order;
  };
};

function qs(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/* ============================================================
   AUTH
============================================================ */
export const Auth = {
  // Artık storage'a yazmıyoruz. Token'ı AuthProvider yazacak.
  async login(email: string, password: string) {
    const data = await req<{ accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return data; // { accessToken }
  },

  async register(email: string, password: string) {
    await req("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  logout() {
    clearKeys(ACCESS_KEY, ROLE_KEY, EMAIL_KEY);
  },

  role(): "admin" | "user" | null {
    return (getAny(ROLE_KEY) as "admin" | "user" | null) ?? null;
  },
  email(): string | null {
    return getAny(EMAIL_KEY);
  },
  isAuthed(): boolean {
    return !!getAny(ACCESS_KEY);
  },
};

export const Leads = {
  // ✅ 2 kullanım da destekleniyor:
  // Leads.list("", 1, 500)  (eski)
  // Leads.list({ page: 1, limit: 10, q: "ali" }) (yeni)
  list: (
    params?:
      | string
      | {
          page?: number;
          limit?: number;
          sort?: string;
          order?: Order;
          q?: string;
        },
    page?: number,
    limit?: number
  ) => {
    // eski kullanım: list("", 1, 500)
    if (typeof params === "string") {
      const p: any = {};
      if (page !== undefined) p.page = page;
      if (limit !== undefined) p.limit = limit;

      const extra = params?.trim() || "";
      // params string'i "?a=1" veya "a=1" veya "" olabilir
      const extraQs = !extra ? "" : extra.startsWith("?") ? extra : `?${extra}`;

      // hem extra hem page/limit varsa birleştir
      const merged = new URLSearchParams(extraQs.replace("?", ""));
      Object.entries(p).forEach(([k, v]) => merged.set(k, String(v)));
      const s = merged.toString();
      return req(`/leads${s ? `?${s}` : ""}`);
    }

    // yeni kullanım: list({ page, limit, q })
    return req(`/leads${qsFrom(params)}`);
  },

  create: (payload: any) =>
    req(`/leads`, { method: "POST", body: JSON.stringify(payload) }),

  update: (id: number, payload: any) =>
    req(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  remove: (id: number) => req(`/leads/${id}`, { method: "DELETE" }),

  convert: (id: number) => req(`/leads/${id}/convert`, { method: "POST" }),

  lost: (id: number, reason?: string) =>
    req(`/leads/${id}/lost`, {
      method: "POST",
      body: JSON.stringify(reason ? { reason } : {}),
    }),

  getById: (id: number) => req(`/leads/${id}`),

  changeStatus: (id: number, status: string, note?: string) =>
    req(`/leads/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(note ? { status, note } : { status }),
    }),
};

/* ============================================================
   CUSTOMERS API (CRUD + soft delete + restore)
============================================================ */
export const Customers = {
  list: (params = "", _p0?: number, _p1?: number) => req(`/customers${params}`),

  create: (payload: any) =>
    req(`/customers`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: any) =>
    req(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  /** Soft Delete */
  remove: (id: number) =>
    req(`/customers/${id}`, {
      method: "DELETE",
    }),

  /** Restore */
  restore: (id: number) =>
    req(`/customers/${id}/restore`, {
      method: "POST",
    }),

  getById: (id: number) => req(`/customers/${id}`),
};

/* ============================================================
   UYUMLULUK KATMANI
============================================================ */
export const Api = {
  get: <T = any>(path: string) => req<T>(path),
  post: <T = any>(path: string, body?: unknown) =>
    req<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T = any>(path: string, body?: unknown) =>
    req<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  patch: <T = any>(path: string, body?: unknown) =>
    req<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  del: <T = any>(path: string) => req<T>(path, { method: "DELETE" }),
};

/* ============================================================
   ACTIVITIES
============================================================ */
export const Activities = {
  list: (
    params: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: Order;

      // filters
      type?: ActivityType; // ✅ type-safe
      leadId?: number; // XOR
      customerId?: number; // XOR
      q?: string;

      // ✅ ISO string (e.g. 2025-12-16T20:00:00.000Z)
      from?: string;
      to?: string;
    } = {}
  ) => {
    // ✅ XOR safety (if both somehow set, prefer the one that exists last)
    const leadId = params.customerId ? undefined : params.leadId;
    const customerId = params.leadId ? undefined : params.customerId;

    return req<Paginated<ActivityDTO>>(
      `/activities${qs({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        sort: params.sort ?? "createdAt",
        order: params.order ?? "DESC",

        type: params.type,
        leadId,
        customerId,
        q: params.q,

        from: params.from,
        to: params.to,
      })}`
    );
  },

  create: (payload: any) =>
    req(`/activities`, { method: "POST", body: JSON.stringify(payload) }),

  update: (id: number, payload: any) =>
    req(`/activities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (id: number) => req(`/activities/${id}`, { method: "DELETE" }),
};
/* ============================================================
   USERS (ADMIN)
============================================================ */
export const Users = {
  list: (params = "", _p0?: number, _p1?: number) => req(`/users${params}`),

  updateRole: (id: number, role: "admin" | "user") =>
    req(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  remove: (id: number) => req(`/users/${id}`, { method: "DELETE" }),
};
