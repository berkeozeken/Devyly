import type { User } from "@/types";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const USER_KEY = "user";

const getStorage = (rememberMe: boolean) =>
  rememberMe ? localStorage : sessionStorage;

export const setTokens = (access: string, refresh: string, rememberMe = true) => {
  if (typeof window === "undefined") return;
  const s = getStorage(rememberMe);
  s.setItem(ACCESS_KEY, access);
  s.setItem(REFRESH_KEY, refresh);
};

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);
};

const LEGACY_KEYS = [
  "token", "access", "refresh",
  "auth_token",
  "devyly_user", "devyly_access_token", "devyly_refresh_token",
];

export const clearTokens = () => {
  if (typeof window === "undefined") return;
  for (const s of [localStorage, sessionStorage]) {
    s.removeItem(ACCESS_KEY);
    s.removeItem(REFRESH_KEY);
    s.removeItem(USER_KEY);
    for (const k of LEGACY_KEYS) s.removeItem(k);
  }
};

export const setUser = (user: User, rememberMe = true) => {
  if (typeof window === "undefined") return;
  getStorage(rememberMe).setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent("devyly:user-updated", { detail: user }));
};

export const getUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as User;
  } catch {
    clearTokens();
    return null;
  }
};

export const isAuthenticated = () => !!getAccessToken() && !!getUser();
