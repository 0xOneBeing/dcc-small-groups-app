import { z } from "zod";
import { ALL_FIGURE_KEYS } from "@/lib/reports/fields";

/**
 * Blank must be distinguishable from 0: `null` is unanswered, `0` is an
 * answer. Never coalesce one into the other.
 */
export const figureValueSchema = z.union([z.null(), z.number().int().min(0, "Cannot be negative")]);

const figureShape = Object.fromEntries(ALL_FIGURE_KEYS.map((k) => [k, figureValueSchema])) as Record<
  (typeof ALL_FIGURE_KEYS)[number],
  typeof figureValueSchema
>;

export const reportFiguresSchema = z.object(figureShape).partial();
export type ReportFiguresInput = z.infer<typeof reportFiguresSchema>;

export const saveDraftSchema = z.object({
  cellId: z.string().min(1),
  serviceDate: z.string().date(),
  figures: reportFiguresSchema,
  comments: z.string().max(4000).optional(),
});

export const submitReportSchema = saveDraftSchema;

export const sendBackSchema = z.object({
  reportId: z.string().min(1),
  reviewNote: z.string().trim().min(1, "A review note is required to send a report back"),
});

export const approveReportSchema = z.object({
  reportId: z.string().min(1),
});
