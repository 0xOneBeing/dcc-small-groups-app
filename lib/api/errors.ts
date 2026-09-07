/**
 * One error type for every API failure, on the server and in the browser.
 *
 * DRF speaks a few dialects:
 *   - field errors:   { "email": ["This field is required."], ... }
 *   - detail errors:  { "detail": "Authentication credentials were not provided." }
 *   - non-field:      { "non_field_errors": ["Unable to log in with provided credentials."] }
 *   - SimpleJWT:      { "detail": "Given token not valid...", "code": "token_not_valid", "messages": [...] }
 *
 * `ApiError` normalizes all of them so callers only deal with one shape.
 */

export type FieldErrors = Record<string, string[]>;

export interface ApiErrorPayload {
  status: number;
  /** Human-readable, safe to surface in a toast/inline message. */
  message: string;
  /** Per-field validation errors, when the response was a field-error object. */
  fieldErrors?: FieldErrors;
  /** Machine code when the API supplied one (e.g. SimpleJWT `token_not_valid`). */
  code?: string;
  /** The raw parsed body, for logging / debugging. */
  raw?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: FieldErrors;
  readonly code?: string;
  readonly raw?: unknown;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status;
    this.fieldErrors = payload.fieldErrors;
    this.code = payload.code;
    this.raw = payload.raw;
  }

  /** 400 / 422 with a field-error map — the caller can map these onto form inputs. */
  get isValidation(): boolean {
    return (this.status === 400 || this.status === 422) && !!this.fieldErrors;
  }

  get isAuth(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** The upstream expired/blacklisted the JWT — a refresh may recover it. */
  get isTokenInvalid(): boolean {
    return this.status === 401 && this.code === "token_not_valid";
  }

  /** First error message for a given field, if any. */
  fieldError(name: string): string | undefined {
    return this.fieldErrors?.[name]?.[0];
  }

  toJSON(): ApiErrorPayload {
    return {
      status: this.status,
      message: this.message,
      fieldErrors: this.fieldErrors,
      code: this.code,
    };
  }
}

const GENERIC_BY_STATUS: Record<number, string> = {
  400: "That request could not be processed.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to do that.",
  404: "That item could not be found.",
  409: "That change conflicts with the current state.",
  429: "Too many requests — please slow down and try again.",
  500: "The server ran into a problem. Please try again.",
  502: "The API is unreachable right now. Please try again shortly.",
  503: "The API is temporarily unavailable. Please try again shortly.",
  504: "The API took too long to respond. Please try again.",
};

function looksLikeFieldErrors(body: Record<string, unknown>): boolean {
  const keys = Object.keys(body);
  if (keys.length === 0) return false;
  return keys.every(
    (k) =>
      Array.isArray(body[k]) &&
      (body[k] as unknown[]).every((v) => typeof v === "string"),
  );
}

/** Build an {@link ApiError} from an HTTP status and an already-parsed body. */
export function apiErrorFromBody(status: number, body: unknown): ApiError {
  const fallback = GENERIC_BY_STATUS[status] ?? `Request failed (${status}).`;

  if (body && typeof body === "object" && !Array.isArray(body)) {
    const obj = body as Record<string, unknown>;
    const code = typeof obj.code === "string" ? obj.code : undefined;

    if (typeof obj.detail === "string") {
      return new ApiError({ status, message: obj.detail, code, raw: body });
    }
    if (Array.isArray(obj.non_field_errors) && typeof obj.non_field_errors[0] === "string") {
      return new ApiError({
        status,
        message: obj.non_field_errors[0] as string,
        code,
        raw: body,
      });
    }
    if (looksLikeFieldErrors(obj)) {
      const fieldErrors = obj as FieldErrors;
      const first = Object.values(fieldErrors)[0]?.[0];
      return new ApiError({
        status,
        message: first ?? fallback,
        fieldErrors,
        code,
        raw: body,
      });
    }
    if (typeof obj.message === "string") {
      return new ApiError({ status, message: obj.message, code, raw: body });
    }
  }

  if (typeof body === "string" && body.trim() && body.length < 300) {
    return new ApiError({ status, message: body.trim(), raw: body });
  }

  return new ApiError({ status, message: fallback, raw: body });
}

/** For network failures / aborts where there is no HTTP response at all. */
export function apiErrorFromException(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (err instanceof DOMException && err.name === "AbortError") {
    return new ApiError({ status: 0, message: "The request was cancelled or timed out.", code: "aborted" });
  }
  const message =
    err instanceof Error ? err.message : "Could not reach the API. Check your connection.";
  return new ApiError({ status: 0, message, code: "network", raw: err });
}
