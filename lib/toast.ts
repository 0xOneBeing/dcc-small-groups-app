"use client";

/**
 * The app's toast strategy — one entry point for every "it worked" / "it
 * failed" signal (auth, mutations, copy-to-clipboard, etc.). Wraps sonner so
 * call sites never import it directly and error toasts get consistent,
 * `ApiError`-aware copy.
 *
 *   import { notify } from "@/lib/toast";
 *
 *   notify.success("Report submitted");
 *   notify.error(err);                       // ApiError | Error | string
 *   notify.error(err, "Could not sign in");  // fallback message
 *   notify.promise(save(), { loading: "Saving…", success: "Saved", error: "Save failed" });
 *
 * The <Toaster /> that renders these lives in `app/layout.tsx`.
 */

import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";

export type ToastInput = unknown;

/** Best-effort human message from anything a catch block might hand us. */
export function messageFromError(err: ToastInput, fallback = "Something went wrong"): string {
  if (typeof err === "string" && err.trim()) return err;
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export const notify = {
  success(message: string, description?: string) {
    return toast.success(message, description ? { description } : undefined);
  },

  error(err: ToastInput, fallback?: string) {
    return toast.error(messageFromError(err, fallback));
  },

  info(message: string, description?: string) {
    return toast(message, description ? { description } : undefined);
  },

  warning(message: string, description?: string) {
    return toast.warning(message, description ? { description } : undefined);
  },

  /** Bind a toast lifecycle to a promise: loading → success / error. */
  promise<T>(
    promise: Promise<T>,
    msgs: { loading: string; success: string | ((value: T) => string); error?: string },
  ) {
    return toast.promise(promise, {
      loading: msgs.loading,
      success: msgs.success,
      error: (err) => messageFromError(err, msgs.error),
    });
  },

  dismiss(id?: string | number) {
    return toast.dismiss(id);
  },
};

export { toast };
