/**
 * Hand-written types mirroring the DCC API's OpenAPI schema
 * (`MISC/dcc-api-schema.json`, "Daystar Christian Centre App API" v1.0.0).
 *
 * The published schema is under-annotated — several endpoints declare no
 * response body — so the dashboard shapes below are best-effort and marked
 * as such. Tighten them against real payloads as screens get wired.
 */

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface Credentials {
  email: string;
  password: string;
}

/** `POST /api/token/` response. */
export interface TokenPair {
  access: string;
  refresh: string;
}

/** `POST /api/token/refresh/` — SimpleJWT returns a fresh access token, and a rotated refresh when rotation is enabled. */
export interface TokenRefreshResponse {
  access: string;
  refresh?: string;
}

/** Decoded SimpleJWT access-token claims we rely on. Extra claims are passed through. */
export interface AccessTokenClaims {
  token_type: "access";
  exp: number;
  iat: number;
  jti: string;
  user_id: string | number;
  [claim: string]: unknown;
}

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "DELETED";
export type RecordStatus = "ACTIVE" | "IN_ACTIVE" | "DELETED";

// ---------------------------------------------------------------------------
// Sunday report
// ---------------------------------------------------------------------------

/** The 24 figure fields on a Sunday report, exactly as the API names them. */
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

export interface SundayReport extends Partial<SundayReportFigures> {
  id: string;
  cell: string;
  service_date: string; // YYYY-MM-DD, must be a Sunday
  approval_status: ApprovalStatus;
  approved_at: string | null;
  approved_by: string | null;
  status: RecordStatus;
  deleted_at: string | null;
  date_created: string;
  last_updated: string;
  meta?: unknown;
}

/** Body for `POST /api/v1/reports/`. `service_date` + the figures the leader filled in. */
export type CreateReportInput = { service_date: string } & Partial<SundayReportFigures> & {
    cell?: string;
  };

/** Body for `PATCH /api/v1/reports/{id}/` — only allowed while status is REJECTED. */
export type UpdateReportInput = Partial<SundayReportFigures> & { service_date?: string };

/** Body for `POST /api/v1/reports/{id}/reject/` — optional correction note. */
export interface RejectReportInput {
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
// Roles
// ---------------------------------------------------------------------------

export interface UserRole {
  id: string;
  name: string;
  permission_ids?: string[];
}

export type UpsertRoleInput = {
  name: string;
  permission_ids?: string[];
};

// ---------------------------------------------------------------------------
// Organization dashboards
// ---------------------------------------------------------------------------

export type OrgUnitType =
  | "region"
  | "district"
  | "zone"
  | "area"
  | "section"
  | "cell";

/**
 * Best-effort shape for `GET /api/v1/organization/dashboard/…`. The schema
 * publishes no response body; these mirror the endpoint descriptions
 * ("submission and approval totals for cells under the leader's scope").
 */
export interface DashboardSummary {
  service_date?: string;
  total_cells?: number;
  submitted?: number;
  pending?: number;
  approved?: number;
  rejected?: number;
  not_submitted?: number;
  compliance_rate?: number;
  [key: string]: unknown;
}

export interface NonSubmitterRow {
  cell?: string;
  cell_name?: string;
  section?: string;
  consecutive_misses?: number;
  chronic?: boolean;
  [key: string]: unknown;
}

export interface TrendPoint {
  service_date?: string;
  compliance_rate?: number;
  submitted?: number;
  total_cells?: number;
  [key: string]: unknown;
}

export interface ApprovalQueueItem {
  id: string;
  cell?: string;
  service_date?: string;
  submitted_at?: string;
  waiting_seconds?: number;
  overdue?: boolean;
  approval_status?: ApprovalStatus;
  [key: string]: unknown;
}

/** `GET /api/v1/approval-settings/` — "global approval interval in seconds". */
export interface ApprovalSettings {
  approval_interval_seconds?: number;
  [key: string]: unknown;
}
