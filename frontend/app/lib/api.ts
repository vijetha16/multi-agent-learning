const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export function getToken() {
  return typeof window === "undefined" ? null : window.localStorage.getItem("lumio_token");
}

export function saveSession(token: string, user: unknown) {
  window.localStorage.setItem("lumio_token", token);
  window.localStorage.setItem("lumio_user", JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem("lumio_token");
  window.localStorage.removeItem("lumio_user");
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401 && token) clearSession();
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error ?? "Request failed");
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
