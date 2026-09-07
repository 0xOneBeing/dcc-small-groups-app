"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { colors, mono } from "@/lib/tokens";
import { Card, Button, TextArea } from "@/components/ui";
import { REPORT_STEPS, ALL_FIGURE_KEYS, type FigureKey } from "@/lib/reports/fields";
import { saveDraftAction, submitReportAction } from "@/lib/reports/actions";
import { formatServiceDate } from "@/lib/dates";

type Figures = Partial<Record<FigureKey, number | null>>;

export function ReportWizard({
  cellId,
  serviceDate,
  initialFigures,
  initialComments,
  status,
  reviewNote,
  windowClosed,
  canSubmitDirectly,
}: {
  cellId: string;
  serviceDate: string; // ISO date, e.g. "2026-08-23"
  initialFigures: Figures;
  initialComments: string;
  status: "draft" | "pending" | "approved" | "sent_back" | null;
  reviewNote: string | null;
  windowClosed: boolean;
  canSubmitDirectly: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Figures>(initialFigures);
  const [comments, setComments] = useState(initialComments);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locked = status === "approved" || status === "pending";
  const blockedByWindow = windowClosed && !canSubmitDirectly && status !== "approved" && status !== "pending";

  const runningTotal = useMemo(
    () => ALL_FIGURE_KEYS.reduce((sum, k) => sum + (values[k] ?? 0), 0),
    [values],
  );
  const answeredCount = useMemo(() => ALL_FIGURE_KEYS.filter((k) => values[k] != null).length, [values]);

  function scheduleAutosave(nextValues: Figures, nextComments: string) {
    if (locked || blockedByWindow) return;
    setSaveState("saving");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      startTransition(async () => {
        const result = await saveDraftAction({ cellId, serviceDate, figures: nextValues, comments: nextComments });
        setSaveState(result.ok ? "saved" : "idle");
      });
    }, 800);
  }

  useEffect(() => () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
  }, []);

  function setFigure(key: FigureKey, raw: string) {
    const digits = raw.replace(/[^0-9]/g, "");
    const next: Figures = { ...values, [key]: digits === "" ? null : Number(digits) };
    setValues(next);
    scheduleAutosave(next, comments);
  }

  function setCommentsValue(v: string) {
    setComments(v);
    scheduleAutosave(values, v);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await submitReportAction({ cellId, serviceDate, figures: values, comments });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/cell");
    });
  }

  if (blockedByWindow) {
    return (
      <div style={{ padding: 28, maxWidth: 640 }}>
        <Card style={{ padding: 24, background: colors.redSoft, borderColor: colors.redSoftBorder }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>The reporting window has closed</div>
          <div style={{ fontSize: 13.5, color: colors.muted, lineHeight: 1.6 }}>
            {formatServiceDate(new Date(serviceDate))}&apos;s window closed Monday at 7:00am. Ask your Section Leader to
            file this report on your behalf.
          </div>
        </Card>
      </div>
    );
  }

  const current = REPORT_STEPS[step];

  return (
    <div style={{ padding: 28, display: "grid", gridTemplateColumns: "200px 1fr 260px", gap: 24, alignItems: "flex-start" }} className="dcc-wizard">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {REPORT_STEPS.map((s, i) => (
          <button
            key={s.category}
            onClick={() => setStep(i)}
            style={{
              textAlign: "left",
              border: "none",
              background: i === step ? colors.redSoft : "transparent",
              color: i === step ? colors.red : colors.muted,
              padding: "10px 12px",
              minHeight: 44,
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {i + 1}. {s.category}
          </button>
        ))}
      </div>

      <div style={{ minWidth: 0 }}>
        {locked && (
          <Card style={{ padding: 16, marginBottom: 16, background: colors.panel }}>
            <div style={{ fontSize: 12.5, color: colors.muted }}>
              {status === "approved" ? "This report is approved and locked." : "This report is submitted and awaiting review."}
            </div>
          </Card>
        )}
        {status === "sent_back" && reviewNote && (
          <Card style={{ padding: 16, marginBottom: 16, background: colors.redSoft, borderColor: colors.redSoftBorder }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.red, marginBottom: 4 }}>SENT BACK</div>
            <div style={{ fontSize: 13, color: colors.ink }}>{reviewNote}</div>
          </Card>
        )}

        <div style={{ height: 4, background: colors.hairline, borderRadius: 4, marginBottom: 20 }}>
          <div
            style={{
              height: "100%",
              width: `${((step + 1) / REPORT_STEPS.length) * 100}%`,
              background: colors.red,
              borderRadius: 4,
              transition: "width 200ms",
            }}
          />
        </div>

        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 4 }}>{current.category}</div>
        <div style={{ fontSize: 13, color: colors.muted, marginBottom: 20 }}>{current.hint}</div>

        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {current.category === "Comments" && (
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.muted, marginBottom: 6 }}>Comments</span>
                <TextArea value={comments} onChange={setCommentsValue} placeholder="Anything worth recording…" />
              </label>
            )}
            {current.fields.map((f, i) => {
              const showGroup = f.group && current.fields[i - 1]?.group !== f.group;
              return (
                <div key={f.key}>
                  {showGroup && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: colors.faint, textTransform: "uppercase", letterSpacing: "0.04em", margin: "6px 0" }}>
                      {f.group}
                    </div>
                  )}
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 44 }}>
                    <span style={{ fontSize: 13.5 }}>{f.label}</span>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      disabled={locked}
                      value={values[f.key] == null ? "" : String(values[f.key])}
                      onChange={(e) => setFigure(f.key, e.target.value)}
                      placeholder="—"
                      aria-label={f.label}
                      style={{
                        width: 88,
                        minHeight: 44,
                        textAlign: "right",
                        border: `1.5px solid ${colors.borderStrong}`,
                        borderRadius: 10,
                        padding: "8px 10px",
                        fontSize: 15,
                        fontFamily: mono,
                        outline: "none",
                        background: locked ? colors.panel : colors.fieldBg,
                      }}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </Card>

        {error && (
          <div role="alert" style={{ marginTop: 14, fontSize: 12.5, color: colors.red }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Back
          </Button>
          {step < REPORT_STEPS.length - 1 ? (
            <Button variant="dark" onClick={() => setStep((s) => Math.min(REPORT_STEPS.length - 1, s + 1))}>
              Next
            </Button>
          ) : (
            !locked && (
              <Button variant="primary" onClick={submit} disabled={pending}>
                {pending ? "Submitting…" : "Submit report"}
              </Button>
            )
          )}
        </div>
      </div>

      <Card style={{ padding: 18, position: "sticky", top: 20 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
          Running total
        </div>
        <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", fontFamily: mono, marginBottom: 4 }}>{runningTotal}</div>
        <div style={{ fontSize: 12, color: colors.faint, marginBottom: 16 }}>
          {answeredCount} of {ALL_FIGURE_KEYS.length} figures answered
        </div>
        <div style={{ fontSize: 11.5, color: colors.faint2 }}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Draft saved" : "Autosaves as you type"}
        </div>
      </Card>
    </div>
  );
}
