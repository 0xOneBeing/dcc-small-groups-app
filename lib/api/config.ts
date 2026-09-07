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
 */

/** Upstream API origin. Server-only — do not import this into a client component. */
export const REMOTE_API_BASE_URL = (
  process.env.DCC_API_BASE_URL ?? "https://dcc-api.onrender.com"
).replace(/\/+$/, "");

/** Same-origin prefix the browser uses. `/api/proxy/v1/reports/` → `${REMOTE}/api/v1/reports/`. */
export const PROXY_BASE_PATH = "/api/proxy";

/** Cookie names for the JWT pair issued by `POST /api/token/`. */
export const ACCESS_COOKIE = "dcc_access";
export const REFRESH_COOKIE = "dcc_refresh";

/** SimpleJWT lifetimes are controlled server-side; these are cookie `maxAge` ceilings only. */
export const ACCESS_COOKIE_MAX_AGE = 60 * 60; // 1h — refreshed well before this
export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14d

/** Default per-request timeout (ms). Render free tier cold-starts are slow, so keep this generous. */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** Upstream paths, relative to `${REMOTE_API_BASE_URL}/api/`. Keep every literal path here. */
export const API_ROUTES = {
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
  report: (id: string) => `v1/reports/${id}/`,
  reportApprove: (id: string) => `v1/reports/${id}/approve/`,
  reportReject: (id: string) => `v1/reports/${id}/reject/`,
  myReports: "v1/reports/mine/",

  approvalsQueue: "v1/approvals/queue/",
  approvalSettings: "v1/approval-settings/",

  orgDashboard: "v1/organization/dashboard/",
  orgDashboardUnit: (unitType: string, id: string) =>
    `v1/organization/dashboard/${unitType}/${id}/`,
  orgDashboardApprovals: "v1/organization/dashboard/approvals/",
  orgDashboardExport: "v1/organization/dashboard/export/",
  orgDashboardNonSubmitters: "v1/organization/dashboard/non-submitters/",
  orgDashboardTrends: "v1/organization/dashboard/trends/",

  roles: "v1/roles/",
  role: (id: string) => `v1/roles/${id}/`,
} as const;
