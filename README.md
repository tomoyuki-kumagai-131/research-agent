# research-agent

TypeScript フルスタック AI アプリのポートフォリオ。
業務リサーチを自動化するエージェント。



https://github.com/user-attachments/assets/28234dc0-8359-4278-b99d-d81d945b2f7e



## スタック

- **FE**: Next.js (App Router) + Vercel AI SDK (`useChat`)
- **BE**: Hono on Cloud Run (GCP)
- **AI Orchestration**: Mastra (`@mastra/core`)
- **AI Workflow / RAG**: Dify Cloud (API 連携)
- **Web Search**: Tavily API（任意。未設定時はスタブ応答）
- **RPA / Scraping**: Playwright (headless Chromium) を Mastra tool として実装

## 構成

```
.
├── apps/
│   ├── web/          # Next.js (port 3000) — useChat → /api/chat → Hono
│   └── api/          # Hono (port 8080) — /agent/chat で Mastra agent をストリーム
├── packages/
│   ├── shared/       # Zod スキーマ・共通型
│   ├── dify/         # Dify Workflow API クライアント
│   └── agents/       # Mastra agent / tools / workflow
└── infra/            # Cloud Build (Cloud Run へデプロイ)
```

データの流れ:

```
ブラウザ
  └─ useChat (streamProtocol: "text")
       └─ Next.js /api/chat (proxy)
            └─ Hono /agent/chat
                 └─ Mastra researchAgent.stream()
                      ├─ tool: dify-rag         (社内ナレッジ)
                      ├─ tool: web-search       (Tavily)
                      └─ tool: playwright-scrape (headless Chromium)
```

## セットアップ

```bash
pnpm install
pnpm --filter @research-agent/agents exec playwright install chromium
cp .env.example .env
# .env に DIFY_API_KEY, OPENAI_API_KEY, TAVILY_API_KEY を設定
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:8080
- ヘルスチェック: `curl http://localhost:8080/health`

## 環境変数

| キー | 必須 | 用途 |
| --- | --- | --- |
| `OPENAI_API_KEY` | ✅ | Mastra agent の LLM |
| `DIFY_API_KEY` | 任意 | 社内ナレッジ RAG。未設定時はスタブ応答 |
| `DIFY_API_BASE` | 任意 | 既定 `https://api.dify.ai/v1` |
| `TAVILY_API_KEY` | 任意 | Web 検索。未設定時はスタブ応答 |
| `NEXT_PUBLIC_API_BASE` | 任意 | Next.js → Hono の URL（既定 `http://localhost:8080`） |

## スクリプト

```bash
pnpm dev        # web と api を並行起動
pnpm typecheck  # 全 workspace を型チェック
pnpm build      # 各 workspace の build スクリプト実行
```

## デプロイ (Cloud Run)

```bash
gcloud builds submit --config infra/cloudbuild.yaml
```

`DIFY_API_KEY` / `OPENAI_API_KEY` は Secret Manager にあらかじめ登録しておく前提。

## 動作確認

1. `pnpm dev` 起動
2. http://localhost:3000 を開く
3. 入力欄に「2026年の日本の生成AI市場規模を調べて」など投入
4. ストリームで返答が表示されること
5. `TAVILY_API_KEY` 未設定でも動く（スタブ）。設定すると実際の Web 検索が走る
