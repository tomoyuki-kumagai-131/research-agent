import "./env.js";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { agentRoute } from "./routes/agent.js";
import { difyRoute } from "./routes/dify.js";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/agent", agentRoute);
app.route("/dify", difyRoute);

const port = Number(process.env.PORT ?? 8080);
serve({ fetch: app.fetch, port });
console.log(`API listening on http://localhost:${port}`);
