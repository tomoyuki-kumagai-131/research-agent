import { Hono } from "hono";
import { stream } from "hono/streaming";
import { researchAgent } from "@research-agent/agents";
import { ResearchRequestSchema } from "@research-agent/shared";

export const agentRoute = new Hono();

agentRoute.post("/research", async (c) => {
  const body = await c.req.json();
  const parsed = ResearchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  return stream(c, async (s) => {
    const result = await researchAgent.stream([
      {
        role: "user",
        content: `次のテーマを最大 ${parsed.data.maxSources} 件の出典付きで ${parsed.data.language} で要約: ${parsed.data.query}`,
      },
    ]);
    for await (const chunk of result.textStream) {
      await s.write(chunk);
    }
  });
});

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

agentRoute.post("/chat", async (c) => {
  const { messages } = await c.req.json<{ messages: ChatMessage[] }>();
  if (!Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: "messages required" }, 400);
  }
  if (!process.env.OPENAI_API_KEY) {
    return c.json(
      { error: "OPENAI_API_KEY is not set on the server" },
      500,
    );
  }

  c.header("Content-Type", "text/plain; charset=utf-8");
  c.header("Cache-Control", "no-cache");
  return stream(c, async (s) => {
    try {
      const result = (await researchAgent.stream(
        messages.map((m) => ({ role: m.role, content: m.content })),
      )) as { fullStream: AsyncIterable<unknown> };

      for await (const ev of result.fullStream) {
        const e = ev as { type: string; textDelta?: string; error?: unknown };
        if (e.type === "text-delta" && e.textDelta) {
          await s.write(e.textDelta);
        } else if (e.type === "error") {
          const err = e.error as {
            statusCode?: number;
            message?: string;
            errors?: Array<{ statusCode?: number; message?: string }>;
          };
          const inner = err?.errors?.[0];
          const status = err?.statusCode ?? inner?.statusCode;
          const msg = err?.message ?? inner?.message ?? JSON.stringify(err);
          console.error("[/agent/chat] LLM error:", err);
          await s.write(`\n[error${status ? ` ${status}` : ""}] ${msg}`);
          return;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[/agent/chat] error:", err);
      await s.write(`\n[error] ${message}`);
    }
  });
});
