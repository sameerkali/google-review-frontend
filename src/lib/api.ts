// const BASE =  "http://localhost:5001";
const BASE = process.env.NEXT_PUBLIC_API_URL ||  "http://localhost:5001";
// backend base url
export class ApiError extends Error {
  status: number;
  /** The full parsed response body - lets a caller read extra fields a
      particular error carries (e.g. `totalScans` on a 403 from a
      tier-gated dashboard endpoint) beyond just the message. */
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown; token?: string; keepalive?: boolean } = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers.Authorization = "Bearer " + opts.token;
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    // Lets a call started right before navigation (e.g. the Google hand-off)
    // survive the page unload instead of being cancelled mid-flight.
    keepalive: opts.keepalive,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error || `HTTP ${res.status}`, res.status, data);
  return data as T;
}
