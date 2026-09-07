export type FieldKind = "num" | "toggle" | "text";

export interface StepField {
  id?: string;
  label?: string;
  kind?: FieldKind;
  g?: string; // group heading, mutually exclusive with id
}

export interface ReportStep {
  id: string;
  label: string;
  hint: string;
  fields: StepField[];
}

export const REPORT_STEPS: ReportStep[] = [
  {
    id: "membership",
    label: "Membership",
    hint: "Attendance, guests and visitation for 23 August.",
    fields: [
      { id: "present", label: "Members Present" },
      { g: "Guest / Decision Cards" },
      { id: "guestCards", label: "Guests Card Received" },
      { id: "decisionCards", label: "Decisions Card Received" },
      { id: "guestVisit", label: "Guests – Total Visitation" },
      { id: "decisionVisit", label: "Decisions – Total Visitation" },
      { g: "Visitation Among Members" },
      { id: "vPhysical", label: "Physical Contact" },
      { id: "vPhone", label: "Phone" },
      { id: "vText", label: "Text Message" },
      { id: "vEmail", label: "Email" },
      { id: "noMeeting", label: "No Meeting Held", kind: "toggle" },
    ],
  },
  {
    id: "maturity",
    label: "Maturity",
    hint: "Giving and Holy Ghost baptism.",
    fields: [
      { g: "Finance" },
      { id: "paidIn", label: "100% Paid In" },
      { g: "Holy Ghost" },
      { id: "baptism", label: "Baptism in the Holy Ghost" },
    ],
  },
  {
    id: "ministry",
    label: "Ministry",
    hint: "Service and visitation activity this week.",
    fields: [
      { id: "communion", label: "Communion Service" },
      { id: "community", label: "Community Project" },
      { id: "lessPriv", label: "Less Privileged Visitation" },
      { id: "clVisit", label: "Cell Leader Visitation" },
      { id: "cmVisit", label: "Cell Members Visitation" },
    ],
  },
  {
    id: "mission",
    label: "Mission",
    hint: "Growth and outreach.",
    fields: [
      { id: "newCells", label: "New Cells" },
      { id: "converts", label: "Converts" },
      { id: "guests", label: "Guests" },
      { id: "outreach", label: "Programme Outreach" },
    ],
  },
  {
    id: "general",
    label: "General",
    hint: "Anything else worth recording.",
    fields: [{ id: "comments", label: "Comments", kind: "text" }],
  },
];
