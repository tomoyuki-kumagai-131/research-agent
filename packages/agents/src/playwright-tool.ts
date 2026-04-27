import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { chromium, type Browser } from "playwright";

let browserPromise: Promise<Browser> | null = null;
const getBrowser = () => {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
  }
  return browserPromise;
};

const MAX_TEXT_CHARS = 4000;

export const playwrightScrapeTool = createTool({
  id: "playwright-scrape",
  description:
    "Open a URL in headless Chromium and extract its title, headings (h1-h3), and main body text. Use when the page requires JS rendering or when search snippets are not enough.",
  inputSchema: z.object({
    url: z.string().url(),
    waitForSelector: z
      .string()
      .optional()
      .describe("Optional CSS selector to wait for before scraping"),
  }),
  outputSchema: z.object({
    url: z.string(),
    title: z.string(),
    headings: z.array(z.string()),
    text: z.string(),
    truncated: z.boolean(),
  }),
  execute: async ({ context }) => {
    const browser = await getBrowser();
    const ctx = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (compatible; ResearchAgent/0.1; +https://example.com/bot)",
    });
    const page = await ctx.newPage();
    try {
      await page.goto(context.url, { waitUntil: "domcontentloaded", timeout: 20_000 });
      if (context.waitForSelector) {
        await page.waitForSelector(context.waitForSelector, { timeout: 10_000 });
      }

      const title = await page.title();
      const headings = await page.$$eval(
        "h1, h2, h3",
        (els) =>
          els
            .map((el) => (el.textContent ?? "").trim())
            .filter((t) => t.length > 0)
            .slice(0, 30),
      );
      const rawText = await page.evaluate(() => document.body?.innerText ?? "");
      const cleaned = rawText.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      const truncated = cleaned.length > MAX_TEXT_CHARS;
      const text = truncated ? cleaned.slice(0, MAX_TEXT_CHARS) : cleaned;

      return {
        url: context.url,
        title,
        headings,
        text,
        truncated,
      };
    } finally {
      await ctx.close();
    }
  },
});
