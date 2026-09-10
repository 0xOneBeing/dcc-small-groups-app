/**
 * Response-shape normalisers.
 *
 * The DCC API's published OpenAPI schema does not reliably match what the
 * endpoints return: some "paginated" endpoints send a bare array, one
 * "array" endpoint sends a single object, and the auth endpoints wrap their
 * payload in `{ message, data }`. These helpers absorb that so a schema-vs-
 * reality drift produces a sane value (or a clear throw) instead of
 * `undefined` deep in a component.
 */

import { ApiError } from "./errors";
import type { Paginated } from "./types";

function isPaginated<T>(v: unknown): v is Paginated<T> {
  return (
    !!v &&
    typeof v === "object" &&
    Array.isArray((v as Paginated<T>).results) &&
    "count" in (v as object)
  );
}

/** Accept either a bare array or a DRF `{ results: [...] }` page and return the array. */
export function asArray<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  if (isPaginated<T>(body)) return body.results;
  if (body == null) return [];
  throw new ApiError({
    status: 0,
    code: "shape_mismatch",
    message: "Expected a list from the API but got a single value.",
    raw: body,
  });
}

/** Accept either a single object or a one-element array/page wrapping it. */
export function asObject<T>(body: unknown): T {
  if (Array.isArray(body)) {
    if (body.length === 0) {
      throw new ApiError({ status: 0, code: "shape_mismatch", message: "Expected an object from the API but got an empty list.", raw: body });
    }
    return body[0] as T;
  }
  if (isPaginated<T>(body)) return body.results[0] as T;
  if (body && typeof body === "object") return body as T;
  throw new ApiError({ status: 0, code: "shape_mismatch", message: "Expected an object from the API.", raw: body });
}

/**
 * Unwrap the auth endpoints' response envelope; pass through anything else.
 * The tested login response wraps the payload in `data`; the doc's written
 * example uses `user` — accept either.
 */
export function unwrapData<T = unknown>(body: unknown): T {
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if ("data" in o && o.data && typeof o.data === "object") return o.data as T;
    if ("user" in o && o.user && typeof o.user === "object" && "message" in o) return o.user as T;
  }
  return body as T;
}
