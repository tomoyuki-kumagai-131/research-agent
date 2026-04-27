import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { DifyClient } from "@research-agent/dify";

const difyClient = () =>
  new DifyClient({
    apiBase: process.env.DIFY_API_BASE,
    apiKey: process.env.DIFY_API_KEY ?? "",
  });

interface TavilySearchResponse {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
  }>;
}

export const webSearchTool = createTool({
  id: "web-search",
  description: "Search the web for recent information about a topic",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
    limit: z.number().int().min(1).max(10).default(5),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        snippet: z.string(),
      }),
    ),
  }),
  execute: async ({ context }) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return {
        results: [
          {
            title: `(stub) ${context.query}`,
            url: "https://example.com",
            snippet:
              "TAVILY_API_KEY not set; returning stub. Set the key in .env to enable real search.",
          },
        ],
      };
    }

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: context.query,
        max_results: context.limit,
        search_depth: "basic",
      }),
    });

    if (!res.ok) {
      throw new Error(`Tavily search failed: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as TavilySearchResponse;
    const results = (data.results ?? []).map((r) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      snippet: r.content ?? "",
    }));
    return { results };
  },
});

export const difyRagTool = createTool({
  id: "dify-rag",
  description:
    "Query the Dify-managed knowledge base for internal documents related to the user's question",
  inputSchema: z.object({
    question: z.string(),
  }),
  outputSchema: z.object({
    answer: z.string(),
    raw: z.unknown(),
  }),
  execute: async ({ context }) => {
    if (!process.env.DIFY_API_KEY) {
      return {
        answer:
          "(stub) DIFY_API_KEY not set; skipping internal knowledge lookup.",
        raw: null,
      };
    }
    const client = difyClient();
    const res = await client.runWorkflow({
      inputs: { question: context.question },
      user: "research-agent",
    });
    const answer =
      (res.data.outputs?.answer as string | undefined) ??
      JSON.stringify(res.data.outputs);
    return { answer, raw: res };
  },
});
