import { randomBytes, randomInt, createHash } from "node:crypto";

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Excludes ambiguous characters (0/O, 1/I/L) so a leader reading a printed
// invitation can type the code back without guessing.
const INVITATION_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateInvitationCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += INVITATION_CODE_ALPHABET[randomInt(INVITATION_CODE_ALPHABET.length)];
  }
  return code;
}
