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

export const clearTokens = () => {
  if (typeof window === "undefined") return;
  for (const s of [localStorage, sessionStorage]) {
    s.removeItem(ACCESS_KEY);
    s.removeItem(REFRESH_KEY);
    s.removeItem(USER_KEY);
    // legacy keys from older auth attempts
    s.removeItem("token");
    s.removeItem("access");
    s.removeItem("refresh");
  }
};

export const setUser = (user: User, rememberMe = true) => {
  if (typeof window === "undefined") return;
  getStorage(rememberMe).setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
};

export const isAuthenticated = () => !!getAccessToken() && !!getUser();
