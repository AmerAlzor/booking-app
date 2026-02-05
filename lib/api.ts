import { getToken } from "./tokenStorage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;
  return res.json();
}
