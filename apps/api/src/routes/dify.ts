import { Hono } from "hono";
import { DifyClient } from "@research-agent/dify";

export const difyRoute = new Hono();

difyRoute.post("/workflow", async (c) => {
  const { inputs, user } = await c.req.json<{
    inputs: Record<string, unknown>;
    user?: string;
  }>();

  const client = new DifyClient({
    apiBase: process.env.DIFY_API_BASE,
    apiKey: process.env.DIFY_API_KEY ?? "",
  });

  const result = await client.runWorkflow({
    inputs,
    user: user ?? "anonymous",
  });
  return c.json(result);
});
