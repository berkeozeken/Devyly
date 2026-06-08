import { getAccessToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export function getWsUrl(path: string): string {
  const token = getAccessToken();
  const wsBase = API_URL
    .replace(/^https:\/\//, "wss://")
    .replace(/^http:\/\//, "ws://")
    .replace(/\/api\/?$/, "");
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${wsBase}${path}${tokenParam}`;
}
