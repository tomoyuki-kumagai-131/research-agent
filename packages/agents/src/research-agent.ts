import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { difyRagTool, webSearchTool } from "./tools.js";
import { playwrightScrapeTool } from "./playwright-tool.js";

export const researchAgent = new Agent({
  name: "research-agent",
  instructions: `あなたは業務リサーチを支援するエージェントです。
ユーザーの質問に対して、まず社内ナレッジ (dify-rag) を確認し、
不足する情報を web-search で補い、必要に応じて playwright-scrape で
個別ページを開いて本文を読み取り、出典付きの要約を日本語で返してください。
出典が無い情報は推測と明記してください。`,
  model: openai("gpt-4o-mini"),
  tools: { webSearchTool, difyRagTool, playwrightScrapeTool },
});
