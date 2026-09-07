/**
 * The 24 integer figures on a Sunday report, grouped into the five
 * categories the wizard, the approvals screen and exports all share. This is
 * the one place the field list is defined — the wizard renders it, exports
 * read it, and the Zod schema below is generated from it.
 */

export type FigureKey =
  | "membersPresent"
  | "guestCardsReceived"
  | "decisionCardsReceived"
  | "guestsTotalVisitation"
  | "decisionsTotalVisitation"
  | "visitationPhysical"
  | "visitationPhone"
  | "visitationText"
  | "visitationEmail"
  | "membersPaidInFull"
  | "baptismHolyGhost"
  | "waterBaptism"
  | "membershipClassGraduates"
  | "communionServiceHeld"
  | "communityProjectsHeld"
  | "lessPrivilegedVisitation"
  | "cellLeaderVisitation"
  | "cellMemberVisitation"
  | "prayerMeetingsHeld"
  | "newCellsBirthed"
  | "converts"
  | "guests"
  | "outreachProgrammes"
  | "testimoniesShared";

export type ReportCategory = "Membership" | "Maturity" | "Ministry" | "Mission" | "Comments";

export interface FigureField {
  key: FigureKey;
  label: string;
  group?: string;
}

export interface ReportStep {
  category: ReportCategory;
  hint: string;
  fields: FigureField[];
}

export const REPORT_STEPS: ReportStep[] = [
  {
    category: "Membership",
    hint: "Attendance, guests and visitation for this Sunday.",
    fields: [
      { key: "membersPresent", label: "Members Present" },
      { key: "guestCardsReceived", label: "Guest Cards Received", group: "Guest / Decision Cards" },
      { key: "decisionCardsReceived", label: "Decision Cards Received", group: "Guest / Decision Cards" },
      { key: "guestsTotalVisitation", label: "Guests — Total Visitation", group: "Guest / Decision Cards" },
      { key: "decisionsTotalVisitation", label: "Decisions — Total Visitation", group: "Guest / Decision Cards" },
      { key: "visitationPhysical", label: "Physical Contact", group: "Visitation Among Members" },
      { key: "visitationPhone", label: "Phone", group: "Visitation Among Members" },
      { key: "visitationText", label: "Text Message", group: "Visitation Among Members" },
      { key: "visitationEmail", label: "Email", group: "Visitation Among Members" },
    ],
  },
  {
    category: "Maturity",
    hint: "Giving, baptism and membership class progress.",
    fields: [
      { key: "membersPaidInFull", label: "Members 100% Paid In", group: "Finance" },
      { key: "baptismHolyGhost", label: "Baptism in the Holy Ghost", group: "Growth" },
      { key: "waterBaptism", label: "Water Baptism", group: "Growth" },
      { key: "membershipClassGraduates", label: "Membership Class Graduates", group: "Growth" },
    ],
  },
  {
    category: "Ministry",
    hint: "Service and visitation activity this week.",
    fields: [
      { key: "communionServiceHeld", label: "Communion Service Held" },
      { key: "communityProjectsHeld", label: "Community Projects Held" },
      { key: "lessPrivilegedVisitation", label: "Less Privileged Visitation" },
      { key: "cellLeaderVisitation", label: "Cell Leader Visitation" },
      { key: "cellMemberVisitation", label: "Cell Member Visitation" },
      { key: "prayerMeetingsHeld", label: "Prayer Meetings Held" },
    ],
  },
  {
    category: "Mission",
    hint: "Growth and outreach.",
    fields: [
      { key: "newCellsBirthed", label: "New Cells Birthed" },
      { key: "converts", label: "Converts" },
      { key: "guests", label: "Guests" },
      { key: "outreachProgrammes", label: "Outreach Programmes" },
    ],
  },
  {
    category: "Comments",
    hint: "Testimonies, and anything else worth recording.",
    fields: [{ key: "testimoniesShared", label: "Testimonies Shared" }],
  },
];

export const ALL_FIGURE_KEYS: FigureKey[] = REPORT_STEPS.flatMap((s) => s.fields.map((f) => f.key));

export const FIGURE_LABEL: Record<FigureKey, string> = Object.fromEntries(
  REPORT_STEPS.flatMap((s) => s.fields.map((f) => [f.key, f.label])),
) as Record<FigureKey, string>;
