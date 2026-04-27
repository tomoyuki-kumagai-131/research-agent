import { z } from "zod";

export const ResearchRequestSchema = z.object({
  query: z.string().min(1, "query is required"),
  maxSources: z.number().int().min(1).max(20).default(5),
  language: z.enum(["ja", "en"]).default("ja"),
});
export type ResearchRequest = z.infer<typeof ResearchRequestSchema>;

export const ResearchSourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  snippet: z.string(),
});
export type ResearchSource = z.infer<typeof ResearchSourceSchema>;

export const ResearchResultSchema = z.object({
  summary: z.string(),
  sources: z.array(ResearchSourceSchema),
});
export type ResearchResult = z.infer<typeof ResearchResultSchema>;
