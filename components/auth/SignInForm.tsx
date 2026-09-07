"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/tokens";
import { TextInput, Button } from "@/components/ui";
import { signInAction, requestMagicLinkAction } from "@/lib/auth/actions";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await signInAction({ email, password });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.data.redirectTo);
    });
  }

  function sendMagicLink() {
    setError(null);
    if (!email) {
      setError("Enter your email address first");
      return;
    }
    startTransition(async () => {
      const result = await requestMagicLinkAction({ email });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMagicSent(true);
    });
  }

  return (
    <div style={{ width: "100%", maxWidth: 372, margin: "0 auto" }}>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.035em", marginBottom: 7 }}>Sign in</div>
      <div style={{ fontSize: 13.5, color: colors.muted, lineHeight: 1.55, marginBottom: 28 }}>
        Use the email address your coordinator onboarded you with.
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: colors.muted, marginBottom: 7 }}>Email address</span>
            <TextInput value={email} onChange={setEmail} placeholder="name@email.com" type="email" />
          </label>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: colors.muted, marginBottom: 7 }}>Password</span>
            <TextInput value={password} onChange={setPassword} type="password" placeholder="••••••••" />
          </label>
        </div>

        {error && (
          <div role="alert" style={{ marginTop: 14, fontSize: 12.5, color: colors.red }}>
            {error}
          </div>
        )}

        <Button variant="primary" fullWidth style={{ marginTop: 24, padding: 15, fontSize: 14.5 }} disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
        <div style={{ flex: 1, height: 1, background: "#EDEFF3" }} />
        <span style={{ fontSize: 11, color: colors.faint2, letterSpacing: "0.04em", textTransform: "uppercase" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#EDEFF3" }} />
      </div>

      <Button variant="secondary" fullWidth style={{ padding: 14, fontSize: 14 }} onClick={sendMagicLink} disabled={pending}>
        {magicSent ? "Check your email for a link" : "Email me a magic link"}
      </Button>

      <div
        style={{
          marginTop: 26,
          padding: "14px 16px",
          background: colors.panel,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          fontSize: 12,
          color: colors.muted,
          lineHeight: 1.55,
        }}
      >
        No password yet? Your account is created by your coordinator&apos;s hierarchy upload. Check your inbox for the
        activation link, or activate below.
      </div>
      <div style={{ marginTop: 22, fontSize: 12, color: colors.faint2, lineHeight: 1.55, textAlign: "center" }}>
        First time here?{" "}
        <a href="/activate" style={{ fontWeight: 600 }}>
          Activate your account
        </a>
      </div>
    </div>
  );
}
