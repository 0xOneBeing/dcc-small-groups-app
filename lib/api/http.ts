/**
 * Low-level HTTP transport. Isomorphic: no cookies, no React, no token logic —
 * callers pass a fully-qualified URL and any auth header themselves.
 *
 *   - the BFF proxy (`app/api/proxy`) uses this server-side, adding `Authorization`
 *   - the browser client (`lib/api/client.ts`) uses this against the same-origin proxy
 *
 * Always resolves to parsed data or throws {@link ApiError}.
 */

import { DEFAULT_TIMEOUT_MS } from "./config";
import { ApiError, apiErrorFromBody, apiErrorFromException } from "./errors";

export type QueryValue = string | number | boolean | null | undefined | Array<string | number>;
export type QueryParams = Record<string, QueryValue>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Serialized to JSON unless it is already a string / FormData / URLSearchParams. */
  body?: unknown;
  query?: QueryParams;
  headers?: Record<string, string>;
  /** Abort the request after this many ms. Defaults to {@link DEFAULT_TIMEOUT_MS}. 0 disables. */
  timeoutMs?: number;
  /** Caller-supplied signal; combined with the timeout signal. */
  signal?: AbortSignal;
  /** Passed straight through to `fetch` (e.g. Next's `cache`, `next.revalidate`). */
  fetchOptions?: RequestInit;
  /** When true, resolve with the raw `Response` instead of a parsed body (used for file downloads). */
  raw?: boolean;
}

export interface RawResult {
  response: Response;
}

/** Append query params to a URL, dropping null/undefined and expanding arrays. */
export function withQuery(url: string, query?: QueryParams): string {
  if (!query) return url;
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const v of value) usp.append(key, String(v));
    } else {
      usp.append(key, String(value));
    }
  }
  const qs = usp.toString();
  if (!qs) return url;
  return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
}

function isBodyInit(body: unknown): body is BodyInit {
  return (
    typeof body === "string" ||
    (typeof FormData !== "undefined" && body instanceof FormData) ||
    (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) ||
    (typeof Blob !== "undefined" && body instanceof Blob) ||
    (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer)
  );
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null;
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  const text = await response.text();
  return text.length ? text : null;
}

function buildSignal(
  timeoutMs: number,
  external?: AbortSignal,
): { signal: AbortSignal; cleanup: () => void } {
  if (!timeoutMs && !external) {
    const c = new AbortController();
    return { signal: c.signal, cleanup: () => {} };
  }
  const controller = new AbortController();
  const timer =
    timeoutMs > 0
      ? setTimeout(() => controller.abort(new DOMException("Timeout", "AbortError")), timeoutMs)
      : undefined;
  const onExternalAbort = () => controller.abort(external?.reason);
  if (external) {
    if (external.aborted) controller.abort(external.reason);
    else external.addEventListener("abort", onExternalAbort, { once: true });
  }
  return {
    signal: controller.signal,
    cleanup: () => {
      if (timer) clearTimeout(timer);
      external?.removeEventListener("abort", onExternalAbort);
    },
  };
}

/** Perform a request against an absolute (or same-origin absolute) `url`. */
export async function httpRequest<T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    query,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal: externalSignal,
    fetchOptions = {},
    raw = false,
  } = options;

  const finalUrl = withQuery(url, query);
  const finalHeaders: Record<string, string> = { Accept: "application/json", ...headers };

  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null && method !== "GET") {
    if (isBodyInit(body)) {
      payload = body;
    } else {
      payload = JSON.stringify(body);
      if (!finalHeaders["Content-Type"] && !finalHeaders["content-type"]) {
        finalHeaders["Content-Type"] = "application/json";
      }
    }
  }

  const { signal, cleanup } = buildSignal(timeoutMs, externalSignal);

  let response: Response;
  try {
    response = await fetch(finalUrl, {
      ...fetchOptions,
      method,
      headers: finalHeaders,
      body: payload,
      signal,
    });
  } catch (err) {
    cleanup();
    throw apiErrorFromException(err);
  }
  cleanup();

  if (raw) {
    if (!response.ok) {
      throw apiErrorFromBody(response.status, await parseBody(response));
    }
    return { response } as T;
  }

  const parsed = await parseBody(response);
  if (!response.ok) {
    throw apiErrorFromBody(response.status, parsed);
  }
  return parsed as T;
}

export { ApiError };
