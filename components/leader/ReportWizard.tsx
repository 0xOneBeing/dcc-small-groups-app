"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { colors, mono } from "@/lib/tokens";
import { Card, Button, TextArea } from "@/components/ui";
import {
  REPORT_STEPS,
  ALL_FIGURE_KEYS,
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  type FigureKey,
} from "@/lib/reports/fields";
import { formatServiceDate } from "@/lib/dates";
import { useCreateReport, useUpdateReport } from "@/hooks/api/reports";
import { ApiError } from "@/lib/api/errors";
import type { SundayReport } from "@/lib/api/types";

type Figures = Partial<Record<FigureKey, number | null>>;

function figuresFrom(report: SundayReport | null): Figures {
  const out: Figures = {};
  if (!report) return out;
  for (const key of ALL_FIGURE_KEYS) {
    const v = report[key];
    out[key] = typeof v === "number" ? v : null;
  }
  return out;
}

export function ReportWizard({
  serviceDate,
  existing,
}: {
  serviceDate: string; // YYYY-MM-DD (a Sunday)
  existing: SundayReport | null;
}) {
  const router = useRouter();
  const status = existing?.approval_status ?? null;
  const locked = status === "PENDING" || status === "APPROVED";
  const isResubmit = status === "REJECTED";

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Figures>(() => figuresFrom(existing));
  const [meetingHeld, setMeetingHeld] = useState<boolean>(existing?.meeting_held ?? true);
  const [currency, setCurrency] = useState<string>(existing?.currency || DEFAULT_CURRENCY);
  const [comment, setComment] = useState<string>(existing?.comment ?? "");
  const [error, setError] = useState<string | null>(null);

  const createReport = useCreateReport();
  const updateReport = useUpdateReport(existing?.id ?? "");
  const pending = createReport.isPending || updateReport.isPending;

  const runningTotal = useMemo(
    () => ALL_FIGURE_KEYS.reduce((sum, k) => sum + (values[k] ?? 0), 0),
    [values],
  );
  const answeredCount = useMemo(
    () => ALL_FIGURE_KEYS.filter((k) => values[k] != null).length,
    [values],
  );

  function setFigure(key: FigureKey, raw: string) {
    const digits = raw.replace(/[^0-9]/g, "");
    setValues((v) => ({ ...v, [key]: digits === "" ? null : Number(digits) }));
  }

  function buildPayload() {
    const payload: Record<string, unknown> = { service_date: serviceDate, meeting_held: meetingHeld };
    for (const key of ALL_FIGURE_KEYS) {
      if (values[key] != null) payload[key] = values[key];
    }
    if (values.total_offering != null) payload.currency = currency;
    if (comment.trim()) payload.comment = comment.trim();
    return payload;
  }

  async function submit() {
    setError(null);
    const payload = buildPayload();
    try {
      if (isResubmit && existing) {
        await updateReport.mutateAsync(payload as never);
      } else {
        await createReport.mutateAsync(payload as never);
      }
      router.push("/cell");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit the report. Please try again.");
    }
  }

  const current = REPORT_STEPS[step];
  const isCommentsStep = current.category === "Comments";

  return (
    <div
      style={{ padding: 28, display: "grid", gridTemplateColumns: "200px 1fr 260px", gap: 24, alignItems: "flex-start" }}
      className="dcc-wizard"
    >
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
              {status === "APPROVED"
                ? "This report is approved and locked."
                : "This report is submitted and awaiting review."}
            </div>
          </Card>
        )}
        {isResubmit && (
          <Card style={{ padding: 16, marginBottom: 16, background: colors.redSoft, borderColor: colors.redSoftBorder }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.red, marginBottom: 4 }}>SENT BACK</div>
            <div style={{ fontSize: 13, color: colors.ink }}>
              {existing?.comment
                ? existing.comment
                : "Your approver sent this back for correction. Update the figures and resubmit."}
            </div>
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
            {isCommentsStep && (
              <>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 44 }}>
                  <span style={{ fontSize: 13.5 }}>Did the cell meeting hold this Sunday?</span>
                  <span style={{ display: "flex", gap: 6 }}>
                    {[
                      ["Yes", true],
                      ["No", false],
                    ].map(([label, val]) => (
                      <button
                        key={String(label)}
                        type="button"
                        disabled={locked}
                        onClick={() => setMeetingHeld(val as boolean)}
                        style={{
                          padding: "8px 14px",
                          minHeight: 40,
                          borderRadius: 9,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: locked ? "default" : "pointer",
                          border: `1.5px solid ${meetingHeld === val ? colors.red : colors.borderStrong}`,
                          background: meetingHeld === val ? colors.redSoft : colors.fieldBg,
                          color: meetingHeld === val ? colors.red : colors.muted,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </span>
                </label>

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 44 }}>
                  <span style={{ fontSize: 13.5 }}>Offering currency</span>
                  <select
                    disabled={locked}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    style={{
                      minHeight: 40,
                      border: `1.5px solid ${colors.borderStrong}`,
                      borderRadius: 10,
                      padding: "8px 10px",
                      fontSize: 14,
                      fontFamily: mono,
                      background: colors.fieldBg,
                    }}
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "block" }}>
                  <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.muted, marginBottom: 6 }}>Comments</span>
                  <TextArea value={comment} onChange={setComment} placeholder="Testimonies, and anything else worth recording…" />
                </label>
              </>
            )}

            {current.fields.map((f, i) => {
              const showGroup = f.group && current.fields[i - 1]?.group !== f.group;
              return (
                <div key={f.key}>
                  {showGroup && (
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: colors.faint,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        margin: "6px 0",
                      }}
                    >
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
                {pending ? "Submitting…" : isResubmit ? "Resubmit report" : "Submit report"}
              </Button>
            )
          )}
        </div>
      </div>

      <Card style={{ padding: 18, position: "sticky", top: 20 }}>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: colors.muted,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: 10,
          }}
        >
          Running total
        </div>
        <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", fontFamily: mono, marginBottom: 4 }}>
          {runningTotal}
        </div>
        <div style={{ fontSize: 12, color: colors.faint, marginBottom: 16 }}>
          {answeredCount} of {ALL_FIGURE_KEYS.length} figures answered
        </div>
        <div style={{ fontSize: 11.5, color: colors.faint2 }}>
          For {formatServiceDate(new Date(serviceDate))} · nothing is saved until you submit
        </div>
      </Card>
    </div>
  );
}
