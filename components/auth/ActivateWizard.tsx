"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { colors, mono } from "@/lib/tokens";
import { TextInput, Button } from "@/components/ui";
import { verifyInvitationAction, activateAccountAction, type InvitationPreview } from "@/lib/auth/actions";

type Step = 0 | 1 | 2;

export function ActivateWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState("/sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmInvitation() {
    setError(null);
    startTransition(async () => {
      const result = await verifyInvitationAction({ email, invitationCode: code });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPreview(result.data);
      setStep(1);
    });
  }

  function setPasswordStep() {
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    startTransition(async () => {
      const result = await activateAccountAction({ email, invitationCode: code, password, confirmPassword });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.data.totpProvisioningUri) setTotpUri(result.data.totpProvisioningUri);
      setRedirectTo(result.data.redirectTo);
      setStep(2);
    });
  }

  function finish() {
    router.push(redirectTo);
  }

  return (
    <div style={{ width: "100%", maxWidth: 400, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
        {["Confirm", "Password", "Review"].map((label, i) => (
          <div
            key={label}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 3,
              background: i <= step ? colors.red : colors.hairline,
            }}
          />
        ))}
      </div>

      {step === 0 && (
        <>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.035em", marginBottom: 7 }}>Activate your account</div>
          <div style={{ fontSize: 13.5, color: colors.muted, lineHeight: 1.55, marginBottom: 28 }}>
            Enter the email your coordinator used and the six-character code from your invitation.
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              confirmInvitation();
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: colors.muted, marginBottom: 7 }}>Email address</span>
                <TextInput value={email} onChange={setEmail} placeholder="name@email.com" type="email" />
              </label>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: colors.muted, marginBottom: 7 }}>Invitation code</span>
                <TextInput value={code} onChange={(v) => setCode(v.toUpperCase())} placeholder="XXXXXX" mono />
              </label>
            </div>
            {error && (
              <div role="alert" style={{ marginTop: 14, fontSize: 12.5, color: colors.red }}>
                {error}
              </div>
            )}
            <Button variant="primary" fullWidth style={{ marginTop: 24, padding: 15, fontSize: 14.5 }} disabled={pending}>
              {pending ? "Checking…" : "Continue"}
            </Button>
          </form>
        </>
      )}

      {step === 1 && (
        <>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.035em", marginBottom: 7 }}>Choose a password</div>
          <div style={{ fontSize: 13.5, color: colors.muted, lineHeight: 1.55, marginBottom: 28 }}>
            At least 10 characters, with a letter and a number.
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPasswordStep();
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: colors.muted, marginBottom: 7 }}>New password</span>
                <TextInput value={password} onChange={setPassword} type="password" placeholder="••••••••" />
              </label>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: colors.muted, marginBottom: 7 }}>Confirm password</span>
                <TextInput value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="••••••••" />
              </label>
            </div>
            {error && (
              <div role="alert" style={{ marginTop: 14, fontSize: 12.5, color: colors.red }}>
                {error}
              </div>
            )}
            <Button variant="primary" fullWidth style={{ marginTop: 24, padding: 15, fontSize: 14.5 }} disabled={pending}>
              {pending ? "Saving…" : "Continue"}
            </Button>
          </form>
        </>
      )}

      {step === 2 && preview && (
        <>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.035em", marginBottom: 7 }}>You&apos;re set, {preview.name.split(" ")[0]}</div>
          <div style={{ fontSize: 13.5, color: colors.muted, lineHeight: 1.55, marginBottom: 22 }}>
            Here&apos;s what was recorded for your account.
          </div>

          <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
            {[
              ["Name", preview.name],
              ["Role", preview.roleLabel],
              ["Scope", preview.scopeLabel],
            ].map(([label, value], i) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "11px 14px",
                  borderTop: i === 0 ? "none" : `1px solid ${colors.hairline}`,
                  fontSize: 13,
                }}
              >
                <span style={{ color: colors.muted }}>{label}</span>
                <span style={{ fontWeight: 600, fontFamily: label === "Scope" ? mono : undefined }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11.5, fontWeight: 600, color: colors.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            You can
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {preview.permissions.map((p) => (
              <li key={p} style={{ display: "flex", gap: 8, fontSize: 13, color: colors.muted, lineHeight: 1.5 }}>
                <span style={{ color: colors.green, flexShrink: 0 }}>✓</span>
                {p}
              </li>
            ))}
          </ul>

          {totpUri && (
            <div
              style={{
                marginBottom: 20,
                padding: "14px 16px",
                background: colors.panel,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                fontSize: 12,
                color: colors.muted,
                lineHeight: 1.6,
                wordBreak: "break-all",
              }}
            >
              Add this account to your authenticator app before continuing — Super Admin sign-ins always require it:
              <div style={{ marginTop: 8, fontFamily: mono, fontSize: 11 }}>{totpUri}</div>
            </div>
          )}

          <Button variant="primary" fullWidth style={{ padding: 15, fontSize: 14.5 }} onClick={finish}>
            {totpUri ? "Continue to verification" : "Go to my dashboard"}
          </Button>
        </>
      )}
    </div>
  );
}
