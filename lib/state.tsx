"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { Scope } from "./tree";

export type Role = "leader" | "coord";

export type LeaderScreen = "login" | "signup" | "leaderDash" | "report" | "follow";
export type CoordScreen = "login" | "signup" | "dash" | "appr" | "cells" | "cfollow" | "exports";
export type Screen = LeaderScreen | CoordScreen;

export interface Person {
  id: number;
  name: string;
  type: "First Timer" | "New Convert";
  phone: string;
  area: string;
  by: string;
  ago: string;
  status: "Not contacted" | "Contacted" | "Unable to Reach";
  note: string;
  days: number;
  logged?: string;
}

export const DEFAULT_PEOPLE: Person[] = [
  { id: 1, name: "Chiamaka Obi", type: "First Timer", phone: "+234 806 771 2043", area: "Ijegun", by: "MSU · Ruth Adeniyi", ago: "2 days ago", status: "Not contacted", note: "", days: 2 },
  { id: 2, name: "Samuel Ogunbiyi", type: "New Convert", phone: "+234 703 448 9910", area: "Ijegun Egba", by: "MSU · Ruth Adeniyi", ago: "9 days ago", status: "Not contacted", note: "", days: 9 },
  { id: 3, name: "Grace Ilori", type: "First Timer", phone: "+234 815 220 6634", area: "Ikotun", by: "MSU · Peter Nwachukwu", ago: "5 days ago", status: "Contacted", note: "Spoke Tuesday evening. Coming to cell on Sunday.", days: 5 },
  { id: 4, name: "Ifeanyi Nwachukwu", type: "New Convert", phone: "+234 802 019 4471", area: "Ijegun", by: "MSU · Ruth Adeniyi", ago: "12 days ago", status: "Unable to Reach", note: "Number rings out. Tried three times.", days: 12 },
];

export interface AppState {
  role: Role;
  screen: Screen;

  loginEmail: string;
  loginPwd: string;

  su: number; // signup step 0-3
  suEmail: string;
  suCode: string;
  pwd: string;
  pwd2: string;

  variant: "A" | "B";
  step: number;
  vals: Record<string, number | boolean>;
  comments: string;
  reportDone: boolean;
  submitted: boolean;

  followFilter: "All" | "Awaiting contact" | "Done";
  openPerson: number | null;
  people: Person[];

  scope: Scope;
  path: number[];
  filter: "All" | "Not submitted" | "Pending approval" | "Chronic";

  apprSel: number;
  apprDone: string[];
  apprLog: Record<string, "approved" | "sent-back">;

  cellQuery: string;

  expScope: Scope;
  expPeriod: string;
  expFmt: "CSV" | "PDF";
  expSets: string[];
  expState: "idle" | "running";
}

const ROLE_HOME: Record<Role, Screen> = { leader: "leaderDash", coord: "dash" };
const ROLE_EMAIL: Record<Role, string> = {
  leader: "boluwatife.s@gmail.com",
  coord: "femi.ogunleye@daystarng.org",
};

export function initialState(): AppState {
  return {
    role: "leader",
    screen: "login",
    loginEmail: ROLE_EMAIL.leader,
    loginPwd: "••••••••",
    su: 0,
    suEmail: "",
    suCode: "",
    pwd: "",
    pwd2: "",
    variant: "A",
    step: 0,
    vals: {},
    comments: "",
    reportDone: false,
    submitted: false,
    followFilter: "All",
    openPerson: null,
    people: DEFAULT_PEOPLE,
    scope: "Region",
    path: [],
    filter: "All",
    apprSel: 0,
    apprDone: [],
    apprLog: {},
    cellQuery: "",
    expScope: "Region",
    expPeriod: "Last 4 Sundays",
    expFmt: "CSV",
    expSets: ["Compliance summary", "Report figures"],
    expState: "idle",
  };
}

type Patch = Partial<AppState> | ((s: AppState) => Partial<AppState>);

interface Ctx {
  state: AppState;
  set: (patch: Patch) => void;
  setRole: (role: Role) => void;
  doLogin: () => void;
  goSignup: () => void;
  goLogin: () => void;
  suNext: () => void;
  suBack: () => void;
  goHome: () => void;
  goReport: () => void;
  goFollow: () => void;
  bump: (id: string, d: number) => void;
  toggleField: (id: string) => void;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(initialState);

  const set = (patch: Patch) => {
    setStateRaw((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  };

  const value = useMemo<Ctx>(() => {
    const setRole = (role: Role) =>
      setStateRaw((s) => ({
        ...s,
        role,
        screen: "login",
        su: 0,
        loginEmail: ROLE_EMAIL[role],
        suEmail: "",
        suCode: "",
        pwd: "",
        pwd2: "",
        path: [],
        openPerson: null,
      }));

    const doLogin = () => setStateRaw((s) => ({ ...s, screen: ROLE_HOME[s.role] }));

    const goSignup = () => set({ screen: "signup", su: 0 });
    const goLogin = () => set({ screen: "login" });

    const suNext = () =>
      setStateRaw((s) => (s.su >= 3 ? { ...s, screen: ROLE_HOME[s.role], su: 0 } : { ...s, su: s.su + 1 }));
    const suBack = () => setStateRaw((s) => ({ ...s, su: Math.max(0, s.su - 1) }));

    const goHome = () => setStateRaw((s) => ({ ...s, screen: ROLE_HOME[s.role] }));
    const goReport = () => set({ screen: "report", step: 0, reportDone: false });
    const goFollow = () => set({ screen: "follow" });

    const bump = (id: string, d: number) =>
      setStateRaw((s) => ({
        ...s,
        vals: { ...s.vals, [id]: Math.max(0, (Number(s.vals[id]) || 0) + d) },
      }));

    const toggleField = (id: string) =>
      setStateRaw((s) => ({ ...s, vals: { ...s.vals, [id]: !s.vals[id] } }));

    return { state, set, setRole, doLogin, goSignup, goLogin, suNext, suBack, goHome, goReport, goFollow, bump, toggleField };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
