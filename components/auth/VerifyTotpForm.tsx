"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/tokens";
import { TextInput, Button } from "@/components/ui";
import { verifyTotpAction } from "@/lib/auth/actions";

export function VerifyTotpForm() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await verifyTotpAction({ token });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.data.redirectTo);
    });
  }

  return (
    <div style={{ width: "100%", maxWidth: 372, margin: "0 auto" }}>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.035em", marginBottom: 7 }}>Use your authenticator app</div>
      <div style={{ fontSize: 13.5, color: colors.muted, lineHeight: 1.55, marginBottom: 28 }}>
        Super Admin accounts require a second factor on every sign-in.
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: colors.muted, marginBottom: 7 }}>6-digit code</span>
          <TextInput value={token} onChange={setToken} placeholder="000000" mono />
        </label>

        {error && (
          <div role="alert" style={{ marginTop: 14, fontSize: 12.5, color: colors.red }}>
            {error}
          </div>
        )}

        <Button variant="primary" fullWidth style={{ marginTop: 24, padding: 15, fontSize: 14.5 }} disabled={pending}>
          {pending ? "Verifying…" : "Verify and continue"}
        </Button>
      </form>
    </div>
  );
}
