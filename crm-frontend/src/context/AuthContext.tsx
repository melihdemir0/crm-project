import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Auth, decodeJwt } from "../lib/api";
import { connectRealtime, disconnectRealtime } from "../lib/realtime";

/* --------------------------
    Storage helpers
--------------------------- */
const ACCESS_KEY = "accessToken";
const EMAIL_KEY = "email";
const ROLE_KEY = "role";

function getAny(key: string) {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? null;
}

function setWithRemember(key: string, value: string, remember: boolean) {
  // ikisinde birden kalmasın
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);

  if (remember) localStorage.setItem(key, value);
  else sessionStorage.setItem(key, value);
}

function clearEverywhere() {
  [ACCESS_KEY, EMAIL_KEY, ROLE_KEY].forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

function hasToken() {
  return !!getAny(ACCESS_KEY);
}

/* --------------------------
    Auth Types
--------------------------- */
export type AuthState = {
  isAuthed: boolean;
  email: string | null;
  role: "admin" | "user" | null;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => void;
};

/* Context */
const Ctx = createContext<AuthState>(null!);

/* --------------------------
    Provider
--------------------------- */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(() => getAny(EMAIL_KEY));
  const [role, setRole] = useState<"admin" | "user" | null>(() => {
    const r = getAny(ROLE_KEY);
    return (r as any) ?? null;
  });
  const [isAuthed, setIsAuthed] = useState<boolean>(() => hasToken());

  /* LOGIN */
  async function login(email: string, password: string, remember: boolean) {
    const res: any = await Auth.login(email, password);

    const accessToken =
      res?.accessToken ?? res?.token ?? res?.data?.accessToken ?? null;

    if (!accessToken)
      throw new Error("Login response içinde accessToken bulunamadı.");

    // JWT payload’dan role/email çek
    const payload: any = decodeJwt<any>(accessToken);
    const nextRole: "admin" | "user" =
      String(payload?.role || "user").toLowerCase() === "admin"
        ? "admin"
        : "user";
    const nextEmail: string = payload?.email ?? email;

    setWithRemember(ACCESS_KEY, accessToken, remember);
    setWithRemember(EMAIL_KEY, nextEmail, remember);
    setWithRemember(ROLE_KEY, nextRole, remember);

    setEmail(nextEmail);
    setRole(nextRole);
    setIsAuthed(true);

    // admin ise realtime bağla
    if (nextRole === "admin") connectRealtime();
  }

  /* LOGOUT */
  function logout() {
    try {
      Auth.logout();
    } finally {
      disconnectRealtime();
      clearEverywhere();
      setEmail(null);
      setRole(null);
      setIsAuthed(false);
    }
  }

  /* ✅ Sayfa refresh / role değişimi → socket aç-kapa */
  useEffect(() => {
    if (isAuthed && role === "admin") {
      connectRealtime();
    } else {
      disconnectRealtime();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, role]);

  /* storage event → başka tabda login/logout olursa */
  useEffect(() => {
    const sync = () => {
      setIsAuthed(hasToken());
      setEmail(getAny(EMAIL_KEY));
      const r = getAny(ROLE_KEY);
      setRole((r as any) ?? null);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  /* Memo */
  const value = useMemo<AuthState>(
    () => ({
      isAuthed,
      email,
      role,
      login,
      logout,
    }),
    [isAuthed, email, role]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
