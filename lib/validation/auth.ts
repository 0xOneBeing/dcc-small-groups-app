import { z } from "zod";

// Shared between client (form validation) and server (the source of truth).

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");

export const invitationCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(6, "The invitation code is 6 characters");

export const passwordSchema = z
  .string()
  .min(10, "At least 10 characters")
  .regex(/[a-zA-Z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const magicLinkRequestSchema = z.object({ email: emailSchema });
export type MagicLinkRequestInput = z.infer<typeof magicLinkRequestSchema>;

export const verifyInvitationSchema = z.object({
  email: emailSchema,
  invitationCode: invitationCodeSchema,
});
export type VerifyInvitationInput = z.infer<typeof verifyInvitationSchema>;

export const setPasswordSchema = z
  .object({
    email: emailSchema,
    invitationCode: invitationCodeSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

export const totpVerifySchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app"),
});
export type TotpVerifyInput = z.infer<typeof totpVerifySchema>;
