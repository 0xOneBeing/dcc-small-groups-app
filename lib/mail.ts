/**
 * Outbound mail. In every environment where no real provider is configured
 * this just logs — enough to develop and test the activation/magic-link
 * flows end to end. Point SMTP_URL (or a provider-specific env var) at a
 * real transport before going to production.
 */

export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
}

export async function sendMail(email: OutboundEmail): Promise<void> {
  if (process.env.SMTP_URL) {
    throw new Error("SMTP_URL is set but no real transport is wired up yet — see lib/mail.ts");
  }
  console.log(`[mail] to=${email.to}\nsubject=${email.subject}\n\n${email.text}\n`);
}
