import { Secret, TOTP } from "otpauth";

/** Super Admin's mandatory second factor, checked on every sign-in. */

export function generateTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

function totpFor(secretBase32: string, label: string): TOTP {
  return new TOTP({
    issuer: "DCC Small Groups",
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
}

export function totpProvisioningUri(secretBase32: string, email: string): string {
  return totpFor(secretBase32, email).toString();
}

export function verifyTotpToken(secretBase32: string, token: string): boolean {
  const cleaned = token.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  const delta = totpFor(secretBase32, "").validate({ token: cleaned, window: 1 });
  return delta !== null;
}
