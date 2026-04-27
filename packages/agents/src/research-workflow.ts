import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { researchAgent } from "./research-agent.js";

const inputSchema = z.object({
  query: z.string(),
  maxSources: z.number().int().default(5),
});

const researchStep = createStep({
  id: "research",
  inputSchema,
  outputSchema: z.object({ summary: z.string() }),
  execute: async ({ inputData }) => {
    const result = await researchAgent.generate([
      {
        role: "user",
        content: `次のテーマについて、最大 ${inputData.maxSources} 件の出典付きで要約してください: ${inputData.query}`,
      },
    ]);
    return { summary: result.text };
  },
});

export const researchWorkflow = createWorkflow({
  id: "research-workflow",
  inputSchema,
  outputSchema: z.object({ summary: z.string() }),
})
  .then(researchStep)
  .commit();
