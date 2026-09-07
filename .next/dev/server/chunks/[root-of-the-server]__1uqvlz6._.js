module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[project]/app/api/auth/login/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic
]);
/**
 * POST /api/auth/login  { email, password }
 *
 * Exchanges credentials for a JWT pair upstream and stores them in httpOnly
 * cookies. Responds with the decoded access-token claims so the client knows
 * who is signed in — never with the tokens themselves.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api/errors.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$tokens$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api/tokens.ts [app-route] (ecmascript)");
;
;
;
const dynamic = "force-dynamic";
async function POST(request) {
    let payload;
    try {
        payload = await request.json();
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            detail: "Expected a JSON body."
        }, {
            status: 400
        });
    }
    const { email, password } = payload ?? {};
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            detail: "Email and password are required.",
            code: "invalid_input"
        }, {
            status: 400
        });
    }
    try {
        const tokens = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$tokens$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["obtainTokens"])(email, password);
        const claims = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$tokens$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["decodeJwt"])(tokens.access);
        const res = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            authenticated: true,
            user: claims ? {
                id: claims.user_id ?? null,
                ...stripStandardClaims(claims)
            } : null
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$tokens$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["writeTokensOnResponse"])(res, tokens);
        return res;
    } catch (err) {
        if (err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ApiError"]) {
            // Forward the upstream DRF body verbatim so the client can map field errors.
            const body = err.raw ?? {
                detail: err.message,
                code: err.code
            };
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(body, {
                status: err.status || 400
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            detail: "Could not sign in right now. Please try again."
        }, {
            status: 502
        });
    }
}
function stripStandardClaims(claims) {
    const { token_type, exp, iat, jti, user_id, ...rest } = claims;
    void token_type;
    void exp;
    void iat;
    void jti;
    void user_id;
    return rest;
}
}),
"[project]/lib/api/config.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Central configuration for talking to the remote DCC API
 * (Django REST Framework, hosted on Render).
 *
 * Two base URLs are in play:
 *
 *  - `REMOTE_API_BASE_URL` — the real upstream. Only ever read on the server
 *    (route handlers / server components). Never shipped to the browser, so
 *    the JWT and the upstream origin stay server-side and CORS never applies.
 *
 *  - `PROXY_BASE_PATH` — the same-origin path the browser talks to. Every
 *    client request goes here; the BFF proxy in `app/api/proxy` attaches the
 *    bearer token from an httpOnly cookie and forwards upstream.
 */ /** Upstream API origin. Server-only — do not import this into a client component. */ __turbopack_context__.s([
    "ACCESS_COOKIE",
    ()=>ACCESS_COOKIE,
    "ACCESS_COOKIE_MAX_AGE",
    ()=>ACCESS_COOKIE_MAX_AGE,
    "API_ROUTES",
    ()=>API_ROUTES,
    "DEFAULT_TIMEOUT_MS",
    ()=>DEFAULT_TIMEOUT_MS,
    "PROXY_BASE_PATH",
    ()=>PROXY_BASE_PATH,
    "REFRESH_COOKIE",
    ()=>REFRESH_COOKIE,
    "REFRESH_COOKIE_MAX_AGE",
    ()=>REFRESH_COOKIE_MAX_AGE,
    "REMOTE_API_BASE_URL",
    ()=>REMOTE_API_BASE_URL
]);
const REMOTE_API_BASE_URL = (process.env.DCC_API_BASE_URL ?? "https://dcc-api.onrender.com").replace(/\/+$/, "");
const PROXY_BASE_PATH = "/api/proxy";
const ACCESS_COOKIE = "dcc_access";
const REFRESH_COOKIE = "dcc_refresh";
const ACCESS_COOKIE_MAX_AGE = 60 * 60; // 1h — refreshed well before this
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14d
const DEFAULT_TIMEOUT_MS = 30_000;
const API_ROUTES = {
    tokenObtain: "token/",
    tokenRefresh: "token/refresh/",
    login: "v1/user/login/",
    logout: "v1/user/logout/",
    invite: "v1/user/invite/",
    completeProfile: "v1/user/complete-profile/",
    verifyMagicLink: "v1/user/verify-magic-link/",
    passwordReset: "v1/user/password-reset/",
    passwordResetConfirm: "v1/user/password-reset/confirm/",
    reports: "v1/reports/",
    report: (id)=>`v1/reports/${id}/`,
    reportApprove: (id)=>`v1/reports/${id}/approve/`,
    reportReject: (id)=>`v1/reports/${id}/reject/`,
    myReports: "v1/reports/mine/",
    approvalsQueue: "v1/approvals/queue/",
    approvalSettings: "v1/approval-settings/",
    orgDashboard: "v1/organization/dashboard/",
    orgDashboardUnit: (unitType, id)=>`v1/organization/dashboard/${unitType}/${id}/`,
    orgDashboardApprovals: "v1/organization/dashboard/approvals/",
    orgDashboardExport: "v1/organization/dashboard/export/",
    orgDashboardNonSubmitters: "v1/organization/dashboard/non-submitters/",
    orgDashboardTrends: "v1/organization/dashboard/trends/",
    roles: "v1/roles/",
    role: (id)=>`v1/roles/${id}/`
};
}),
"[project]/lib/api/errors.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

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
 */ __turbopack_context__.s([
    "ApiError",
    ()=>ApiError,
    "apiErrorFromBody",
    ()=>apiErrorFromBody,
    "apiErrorFromException",
    ()=>apiErrorFromException
]);
class ApiError extends Error {
    status;
    fieldErrors;
    code;
    raw;
    constructor(payload){
        super(payload.message);
        this.name = "ApiError";
        this.status = payload.status;
        this.fieldErrors = payload.fieldErrors;
        this.code = payload.code;
        this.raw = payload.raw;
    }
    /** 400 / 422 with a field-error map — the caller can map these onto form inputs. */ get isValidation() {
        return (this.status === 400 || this.status === 422) && !!this.fieldErrors;
    }
    get isAuth() {
        return this.status === 401;
    }
    get isForbidden() {
        return this.status === 403;
    }
    get isNotFound() {
        return this.status === 404;
    }
    /** The upstream expired/blacklisted the JWT — a refresh may recover it. */ get isTokenInvalid() {
        return this.status === 401 && this.code === "token_not_valid";
    }
    /** First error message for a given field, if any. */ fieldError(name) {
        return this.fieldErrors?.[name]?.[0];
    }
    toJSON() {
        return {
            status: this.status,
            message: this.message,
            fieldErrors: this.fieldErrors,
            code: this.code
        };
    }
}
const GENERIC_BY_STATUS = {
    400: "That request could not be processed.",
    401: "Your session has expired. Please sign in again.",
    403: "You don't have permission to do that.",
    404: "That item could not be found.",
    409: "That change conflicts with the current state.",
    429: "Too many requests — please slow down and try again.",
    500: "The server ran into a problem. Please try again.",
    502: "The API is unreachable right now. Please try again shortly.",
    503: "The API is temporarily unavailable. Please try again shortly.",
    504: "The API took too long to respond. Please try again."
};
function looksLikeFieldErrors(body) {
    const keys = Object.keys(body);
    if (keys.length === 0) return false;
    return keys.every((k)=>Array.isArray(body[k]) && body[k].every((v)=>typeof v === "string"));
}
function apiErrorFromBody(status, body) {
    const fallback = GENERIC_BY_STATUS[status] ?? `Request failed (${status}).`;
    if (body && typeof body === "object" && !Array.isArray(body)) {
        const obj = body;
        const code = typeof obj.code === "string" ? obj.code : undefined;
        if (typeof obj.detail === "string") {
            return new ApiError({
                status,
                message: obj.detail,
                code,
                raw: body
            });
        }
        if (Array.isArray(obj.non_field_errors) && typeof obj.non_field_errors[0] === "string") {
            return new ApiError({
                status,
                message: obj.non_field_errors[0],
                code,
                raw: body
            });
        }
        if (looksLikeFieldErrors(obj)) {
            const fieldErrors = obj;
            const first = Object.values(fieldErrors)[0]?.[0];
            return new ApiError({
                status,
                message: first ?? fallback,
                fieldErrors,
                code,
                raw: body
            });
        }
        if (typeof obj.message === "string") {
            return new ApiError({
                status,
                message: obj.message,
                code,
                raw: body
            });
        }
    }
    if (typeof body === "string" && body.trim() && body.length < 300) {
        return new ApiError({
            status,
            message: body.trim(),
            raw: body
        });
    }
    return new ApiError({
        status,
        message: fallback,
        raw: body
    });
}
function apiErrorFromException(err) {
    if (err instanceof ApiError) return err;
    if (err instanceof DOMException && err.name === "AbortError") {
        return new ApiError({
            status: 0,
            message: "The request was cancelled or timed out.",
            code: "aborted"
        });
    }
    const message = err instanceof Error ? err.message : "Could not reach the API. Check your connection.";
    return new ApiError({
        status: 0,
        message,
        code: "network",
        raw: err
    });
}
}),
"[project]/lib/api/http.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "httpRequest",
    ()=>httpRequest,
    "withQuery",
    ()=>withQuery
]);
/**
 * Low-level HTTP transport. Isomorphic: no cookies, no React, no token logic —
 * callers pass a fully-qualified URL and any auth header themselves.
 *
 *   - the BFF proxy (`app/api/proxy`) uses this server-side, adding `Authorization`
 *   - the browser client (`lib/api/client.ts`) uses this against the same-origin proxy
 *
 * Always resolves to parsed data or throws {@link ApiError}.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api/config.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api/errors.ts [app-route] (ecmascript)");
;
;
function withQuery(url, query) {
    if (!query) return url;
    const usp = new URLSearchParams();
    for (const [key, value] of Object.entries(query)){
        if (value === null || value === undefined || value === "") continue;
        if (Array.isArray(value)) {
            for (const v of value)usp.append(key, String(v));
        } else {
            usp.append(key, String(value));
        }
    }
    const qs = usp.toString();
    if (!qs) return url;
    return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
}
function isBodyInit(body) {
    return typeof body === "string" || typeof FormData !== "undefined" && body instanceof FormData || typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams || typeof Blob !== "undefined" && body instanceof Blob || typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer;
}
async function parseBody(response) {
    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return null;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
        try {
            return await response.json();
        } catch  {
            return null;
        }
    }
    const text = await response.text();
    return text.length ? text : null;
}
function buildSignal(timeoutMs, external) {
    if (!timeoutMs && !external) {
        const c = new AbortController();
        return {
            signal: c.signal,
            cleanup: ()=>{}
        };
    }
    const controller = new AbortController();
    const timer = timeoutMs > 0 ? setTimeout(()=>controller.abort(new DOMException("Timeout", "AbortError")), timeoutMs) : undefined;
    const onExternalAbort = ()=>controller.abort(external?.reason);
    if (external) {
        if (external.aborted) controller.abort(external.reason);
        else external.addEventListener("abort", onExternalAbort, {
            once: true
        });
    }
    return {
        signal: controller.signal,
        cleanup: ()=>{
            if (timer) clearTimeout(timer);
            external?.removeEventListener("abort", onExternalAbort);
        }
    };
}
async function httpRequest(url, options = {}) {
    const { method = "GET", body, query, headers = {}, timeoutMs = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEFAULT_TIMEOUT_MS"], signal: externalSignal, fetchOptions = {}, raw = false } = options;
    const finalUrl = withQuery(url, query);
    const finalHeaders = {
        Accept: "application/json",
        ...headers
    };
    let payload;
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
    let response;
    try {
        response = await fetch(finalUrl, {
            ...fetchOptions,
            method,
            headers: finalHeaders,
            body: payload,
            signal
        });
    } catch (err) {
        cleanup();
        throw (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["apiErrorFromException"])(err);
    }
    cleanup();
    if (raw) {
        if (!response.ok) {
            throw (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["apiErrorFromBody"])(response.status, await parseBody(response));
        }
        return {
            response
        };
    }
    const parsed = await parseBody(response);
    if (!response.ok) {
        throw (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["apiErrorFromBody"])(response.status, parsed);
    }
    return parsed;
}
;
}),
"[project]/lib/api/tokens.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearTokens",
    ()=>clearTokens,
    "clearTokensOnResponse",
    ()=>clearTokensOnResponse,
    "decodeJwt",
    ()=>decodeJwt,
    "isJwtExpired",
    ()=>isJwtExpired,
    "obtainTokens",
    ()=>obtainTokens,
    "persistTokens",
    ()=>persistTokens,
    "readTokens",
    ()=>readTokens,
    "refreshTokens",
    ()=>refreshTokens,
    "upstreamUrl",
    ()=>upstreamUrl,
    "writeTokensOnResponse",
    ()=>writeTokensOnResponse
]);
/**
 * Server-side JWT handling: the access/refresh pair lives in httpOnly cookies
 * that browser JavaScript can never read. Everything here runs only in route
 * handlers and server components.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api/config.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$http$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/api/http.ts [app-route] (ecmascript) <locals>");
;
;
;
;
function upstreamUrl(path) {
    return `${__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REMOTE_API_BASE_URL"]}/api/${path.replace(/^\/+/, "")}`;
}
const cookieBase = {
    httpOnly: true,
    secure: ("TURBOPACK compile-time value", "development") === "production",
    sameSite: "lax",
    path: "/"
};
function decodeJwt(token) {
    const part = token.split(".")[1];
    if (!part) return null;
    try {
        const json = Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
        return JSON.parse(json);
    } catch  {
        return null;
    }
}
function isJwtExpired(token, skewSeconds = 30) {
    const claims = decodeJwt(token);
    if (!claims?.exp) return true;
    return claims.exp * 1000 <= Date.now() + skewSeconds * 1000;
}
async function readTokens() {
    const store = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    return {
        access: store.get(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ACCESS_COOKIE"])?.value ?? null,
        refresh: store.get(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REFRESH_COOKIE"])?.value ?? null
    };
}
function writeTokensOnResponse(res, tokens) {
    res.cookies.set(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ACCESS_COOKIE"], tokens.access, {
        ...cookieBase,
        maxAge: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ACCESS_COOKIE_MAX_AGE"]
    });
    if (tokens.refresh) {
        res.cookies.set(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REFRESH_COOKIE"], tokens.refresh, {
            ...cookieBase,
            maxAge: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REFRESH_COOKIE_MAX_AGE"]
        });
    }
}
function clearTokensOnResponse(res) {
    res.cookies.set(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ACCESS_COOKIE"], "", {
        ...cookieBase,
        maxAge: 0
    });
    res.cookies.set(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REFRESH_COOKIE"], "", {
        ...cookieBase,
        maxAge: 0
    });
}
async function persistTokens(tokens) {
    const store = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    store.set(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ACCESS_COOKIE"], tokens.access, {
        ...cookieBase,
        maxAge: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ACCESS_COOKIE_MAX_AGE"]
    });
    if (tokens.refresh) {
        store.set(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REFRESH_COOKIE"], tokens.refresh, {
            ...cookieBase,
            maxAge: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REFRESH_COOKIE_MAX_AGE"]
        });
    }
}
async function clearTokens() {
    const store = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    store.set(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ACCESS_COOKIE"], "", {
        ...cookieBase,
        maxAge: 0
    });
    store.set(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REFRESH_COOKIE"], "", {
        ...cookieBase,
        maxAge: 0
    });
}
function obtainTokens(email, password) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$http$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["httpRequest"])(upstreamUrl(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["API_ROUTES"].tokenObtain), {
        method: "POST",
        body: {
            email,
            password
        }
    });
}
function refreshTokens(refresh) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$http$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["httpRequest"])(upstreamUrl(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["API_ROUTES"].tokenRefresh), {
        method: "POST",
        body: {
            refresh
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1uqvlz6._.js.map