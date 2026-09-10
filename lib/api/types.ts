/**
 * Hand-written types mirroring the DCC API's OpenAPI schema
 * (`MISC/dcc-api-schema.json`, "Daystar Christian Centre App API" v1.0.0).
 *
 * A few response bodies are still published as bare `object`
 * (`dashboard/approvals/`, `dashboard/non-submitters/`) — those are typed
 * permissively and flagged. Everything else is pinned to the schema.
 */

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface Credentials {
  email: string;
  password: string;
}

/** `POST /api/token/` — SimpleJWT pair. */
export interface TokenPair {
  access: string;
  refresh: string;
}

/** `POST /api/token/refresh/` and `POST /api/v1/user/refresh/`. */
export interface TokenRefreshResponse {
  access: string;
  /** Present when refresh-token rotation is enabled upstream. */
  refresh?: string;
}

/**
 * The user profile the API returns on login (as `data`, minus `tokens`).
 * `role` is a UUID into `/api/v1/roles/`; `role_name` is enriched in by our
 * login route. Extra keys pass through.
 */
export interface ApiUser {
  id?: string | number;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  /** Role primary key (UUID). Resolve against `/api/v1/roles/` for a label. */
  role?: string;
  /** Enriched by `app/api/auth/login` from the roles list — not sent by the API. */
  role_name?: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  status?: RecordStatus;
  [key: string]: unknown;
}

/**
 * Raw `POST /api/v1/user/login/` body. The published schema is wrong: the real
 * shape wraps the profile in `data`, with the JWT pair under `data.tokens`.
 */
export interface LoginResponse {
  message: string;
  data: ApiUser & { tokens: TokenPair };
}

/** Normalised login result our BFF works with. */
export interface NormalisedLogin {
  access: string;
  refresh: string;
  user: ApiUser;
}

/** Decoded SimpleJWT access-token claims we rely on. Extra claims pass through. */
export interface AccessTokenClaims {
  token_type: "access";
  exp: number;
  iat: number;
  jti: string;
  user_id: string | number;
  [claim: string]: unknown;
}

/** `{ "detail": "..." }` — the API's standard single-message body (200 and errors alike). */
export interface MessageResponse {
  detail: string;
}

export interface CompleteProfileInput {
  token: string;
  password: string;
  password_confirmation: string;
}

export interface PasswordResetRequestInput {
  email: string;
}

export interface PasswordResetConfirmInput {
  token: string;
  uidb64: string;
  password: string;
  password_confirmation: string;
}

export interface InviteUserInput {
  email: string;
  role_id: string;
  organization_unit_type: OrgUnitType;
  organization_unit_id: string;
}

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "DELETED";
export type RecordStatus = "ACTIVE" | "IN_ACTIVE" | "DELETED";
export type OrgUnitType = "region" | "district" | "zone" | "area" | "section" | "cell";

// ---------------------------------------------------------------------------
// Sunday report
// ---------------------------------------------------------------------------

/** The 24 figure fields on a Sunday report, exactly as the API names them. All are `>= 0`. */
export interface SundayReportFigures {
  meeting_held: boolean;
  members_present: number;
  guests_cards: number;
  decisions_card: number;
  guest_visitation: number;
  decisions_visitation: number;
  physical_checkup: number;
  phone_checkup: number;
  text_checkup: number;
  email_checkup: number;
  no_of_meeting_held: number;
  total_offering: number;
  currency: string;
  holy_ghost_baptism: number;
  communion_service: number;
  community_project: number;
  less_priviledged_visit: number;
  cell_leader_visit: number;
  cell_members_visit: number;
  new_cells: number;
  converts: number;
  guests: number;
  outreach: number;
  comment: string;
}

/**
 * A Sunday report row. Fields are ordered as the live API returns them; the
 * schema also lists `status` / `deleted_at` / `meta`, which the endpoints do
 * not actually send back, so they are optional here.
 */
export interface SundayReport extends Partial<SundayReportFigures> {
  id: string;
  cell: string | null;
  service_date: string | null; // YYYY-MM-DD, a Sunday
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  date_created: string;
  last_updated: string;
  status?: RecordStatus;
  deleted_at?: string | null;
  meta?: unknown;
}

/** Body for `POST /api/v1/reports/` — the cell is inferred from the authenticated Cell Leader. */
export type CreateReportInput = { service_date: string } & Partial<SundayReportFigures>;

/** Body for `PATCH /api/v1/reports/{id}/` — allowed only while `approval_status` is REJECTED. */
export type UpdateReportInput = Partial<SundayReportFigures> & { service_date?: string };

/** Body for `POST /api/v1/reports/whatsapp/` — cell identified by code, not by auth. */
export type WhatsAppReportInput = { cell_code: string; service_date?: string } & Partial<SundayReportFigures>;

/** Body for `POST /api/v1/reports/{id}/approve/` and `.../reject/` — optional note. */
export interface ReportDecisionInput {
  comment?: string;
}

// ---------------------------------------------------------------------------
// Pagination (DRF PageNumberPagination)
// ---------------------------------------------------------------------------

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---------------------------------------------------------------------------
// Roles (list-only in the current API)
// ---------------------------------------------------------------------------

export interface UserRole {
  id: string;
  name: string;
  permission_ids?: number[];
}

// ---------------------------------------------------------------------------
// Organisation dashboards
// ---------------------------------------------------------------------------

/** One entry in `ComplianceSummary.missing_cells` — bare `object` upstream. */
export interface MissingCell {
  id?: string;
  name?: string;
  code?: string;
  [key: string]: unknown;
}

/** `GET /api/v1/organization/dashboard/` (array) and `.../trends/` (array). */
export interface ComplianceSummary {
  service_date: string;
  total_cells: number;
  submitted_cells: number;
  missing_cells: MissingCell[];
  pending_approval: number;
  approved: number;
  compliance_percentage: number;
}

/** `GET /api/v1/organization/dashboard/{unit_type}/{id}/` — a summary plus which unit it describes. */
export interface ComplianceScope extends ComplianceSummary {
  scope: Record<string, unknown>;
}

/** `GET /api/v1/organization/dashboard/non-submitters/` — published as bare `object`; refine against real data. */
export interface NonSubmitterRow {
  cell?: string;
  cell_name?: string;
  section?: string;
  consecutive_misses?: number;
  chronic?: boolean;
  [key: string]: unknown;
}

/**
 * `GET /api/v1/organization/dashboard/approvals/` — array of pending reports
 * with waiting time. Per the doc's example, `cell` here is a display name, not
 * a UUID like on `SundayReport`.
 */
export interface ApprovalWaitItem {
  id: string;
  cell?: string;
  submitted_at?: string;
  waiting_seconds?: number;
  overdue?: boolean;
  [key: string]: unknown;
}

/** `GET/PATCH /api/v1/approval-settings/` — the fallback-approval delay, in seconds. */
export interface ApprovalSettings {
  approval_interval?: number;
}
