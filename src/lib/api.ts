/**
 * lib/api.ts
 * ─────────────────────────────────────────────────────────────
 * Centralised fetch wrapper with:
 *  • 8-second timeout (no hanging requests)
 *  • In-flight deduplication (same URL called twice → 1 request)
 *  • Automatic credentials: "include"
 *  • JSON parsing with error propagation
 */

const IN_FLIGHT = new Map<string, Promise<any>>();

export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const key = `${options.method ?? "GET"}:${url}`;

  // Deduplicate concurrent GET requests for the same URL
  if (!options.method || options.method === "GET") {
    if (IN_FLIGHT.has(key)) return IN_FLIGHT.get(key) as Promise<T>;
  }

  const ctrl    = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 8000);

  const promise = fetch(url, {
    credentials: "include",
    ...options,
    signal: options.signal ?? ctrl.signal,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
    .then(async res => {
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}: ${text}`);
      }
      return res.json() as Promise<T>;
    })
    .finally(() => {
      clearTimeout(timeout);
      IN_FLIGHT.delete(key);
    });

  if (!options.method || options.method === "GET") {
    IN_FLIGHT.set(key, promise);
  }

  return promise;
}

/** POST helper */
export function apiPost<T = any>(url: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, { method: "POST", body: JSON.stringify(body) });
}

/** PATCH helper */
export function apiPatch<T = any>(url: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, { method: "PATCH", body: JSON.stringify(body) });
}

/** DELETE helper */
export function apiDelete<T = any>(url: string, body?: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: "DELETE",
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}