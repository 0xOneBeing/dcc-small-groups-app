import type { Role } from "./state";

export interface AuthCopy {
  role: string;
  home: string;
  homeScreen: string;
  headline: string;
  blurb: string;
  stats: { value: string; label: string }[];
  formSub: string;
  note: string;
  altLabel: string;
  suHeadline: string;
  suBlurb: string;
  suVerifySub: string;
  suCodeNote: string;
  suFields: { label: string; value: string }[];
  suPerms: { text: string }[];
  suDoneText: string;
}

export const AUTH_COPY: Record<Role, AuthCopy> = {
  leader: {
    role: "Cell Leader",
    home: "my cell",
    homeScreen: "leaderDash",
    headline: "One place for every cell report in Alimosho.",
    blurb: "Submit your Sunday report, track your follow-ups and see how your cell is doing week to week. Reports close Wednesday 11:59pm.",
    stats: [{ value: "243", label: "Cells" }, { value: "91%", label: "Reported last Sunday" }],
    formSub: "Use the email address your coordinator onboarded you with.",
    note: "No password yet? Your account is created by your coordinator's hierarchy upload. Check your inbox for the activation link.",
    altLabel: "Email me a magic link",
    suHeadline: "Activate your Cell Leader account.",
    suBlurb: "Your Section Leader added you in the hierarchy upload. Confirm the invitation and choose a password.",
    suVerifySub: "Enter the email your Section Leader used and the six-character code from your invitation.",
    suCodeNote: "The code is in your invitation email and WhatsApp message. It expires 14 days after it was sent.",
    suFields: [
      { label: "Name", value: "Boluwatife Sodipo" },
      { label: "Cell", value: "Grace Cell · CL-0142" },
      { label: "Section", value: "Ijegun Section 1" },
      { label: "Cell type", value: "Adult" },
      { label: "Reports to", value: "Tunde Bakare" },
    ],
    suPerms: [
      { text: "Submit and edit the Sunday report for Grace Cell." },
      { text: "See and close follow-ups assigned to your cell." },
      { text: "View your own attendance and submission history." },
    ],
    suDoneText: "Welcome, Boluwatife. Your 23 August report is open and due Wednesday 11:59pm.",
  },
  coord: {
    role: "Section / Area Coordinator",
    home: "compliance",
    homeScreen: "dash",
    headline: "See who reported, who did not, and where it is stuck.",
    blurb: "Compliance rolls up the whole 3-by-3 hierarchy. Approve reports, chase chronic non-reporters and export for the pastorate.",
    stats: [{ value: "243", label: "Cells in region" }, { value: "6", label: "Awaiting your approval" }],
    formSub: "Coordinator accounts are created by the Super Admin from the hierarchy upload.",
    note: "Signing in gives you the scope recorded against your name. If your scope looks wrong, ask your Super Admin to correct the hierarchy.",
    altLabel: "Email me a magic link",
    suHeadline: "Activate your Coordinator account.",
    suBlurb: "The Super Admin recorded your level and scope. Confirm it, set a password, and the compliance view opens at your scope.",
    suVerifySub: "Enter your work email and the six-character code from the Super Admin's invitation.",
    suCodeNote: "Codes are issued by the Super Admin when the hierarchy CSV is approved. Ask them to reissue if yours has expired.",
    suFields: [
      { label: "Name", value: "Femi Ogunleye" },
      { label: "Level", value: "Area Coordinator" },
      { label: "Scope", value: "Ikotun Area 2" },
      { label: "Cells in scope", value: "38" },
      { label: "Reports to", value: "Grace Adeyemi · Ikotun Zone" },
    ],
    suPerms: [
      { text: "Approve or send back reports from cells in your scope." },
      { text: "Drill from your scope down to any single cell." },
      { text: "Export compliance and report figures for your scope." },
    ],
    suDoneText: "Welcome, Femi. Compliance opens at Ikotun Area 2 with 6 reports waiting on you.",
  },
};
