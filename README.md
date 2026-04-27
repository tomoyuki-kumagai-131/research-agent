# research-agent

> 業務リサーチを自動化する TypeScript フルスタック AI エージェントのポートフォリオ。
> 社内ナレッジ (RAG) → Web 検索 → ブラウザ自動化を 1 つの会話で横断します。

🌐 **Live demo**: https://research-agent-web.vercel.app

https://github.com/user-attachments/assets/61f70185-b922-4fba-8a0a-c485c6fea2bf

---

## ハイライト

| 観点 | 採用技術 / 実装 |
| --- | --- |
| **AI エージェント** | Mastra でツール 3 種を持つ Agent を定義 (`research-agent.ts`) と Workflow (`research-workflow.ts`) を実装 |
| **LLM インターフェース** | Vercel AI SDK の `useChat` でストリーミング表示。送信中はスケルトン → ストリーミングカーソル → 停止ボタンへ遷移 |
| **RAG / 関数連携** | Dify Cloud Workflow を function-call ツール化。鍵未設定時はスタブにフォールバック |
| **RPA** | Playwright (headless Chromium) を Mastra tool 化し、URL を渡すと本文・見出しを抽出 |
| **GCP 本番運用** | Hono API を Cloud Run、Secret Manager に API キーを格納、Cloud Build で CI/CD |
| **モノレポ** | pnpm workspace で `apps/*` と `packages/*` を共有型・共有クライアントで結線 |

---

## アーキテクチャ

```
Browser
  └─ useChat (streamProtocol: "text")
       └─ Vercel  ─── Next.js /api/chat (proxy)
                       └─ Cloud Run  ─── Hono /agent/chat
                                            └─ Mastra researchAgent.stream()
                                                 ├─ tool: dify-rag         → Dify Cloud Workflow API
                                                 ├─ tool: web-search       → Tavily API
                                                 └─ tool: playwright-scrape → headless Chromium
```

- **Web** (Next.js 15 / App Router) は Vercel にデプロイ。`/api/chat` は server-side で Hono にプロキシし、Cloud Run の URL を秘匿せずシンプルに保つ。
- **API** (Hono) は Cloud Run。1 GiB / 1 CPU / 同時 10 / 最大 3 インスタンスで Chromium 起動時のメモリも担保。
- **Mastra agent** は `@ai-sdk/openai` の `gpt-4o-mini` をモデルに、`fullStream` を消費してエラーを `[error 4xx]` 形式でクライアントに表出。

---

## ディレクトリ

```
.
├── apps/
│   ├── web/          # Next.js — useChat / streaming UX / 例文チップ / 停止ボタン
│   └── api/          # Hono — /agent/chat (stream)・/agent/research・/dify/workflow
├── packages/
│   ├── shared/       # Zod スキーマ (ResearchRequest 等) を web/api で共有
│   ├── dify/         # Dify Workflow API クライアント (blocking + streaming)
│   └── agents/       # Mastra Agent / Workflow / Tools (web-search / dify-rag / playwright-scrape)
└── infra/
    └── cloudbuild.yaml  # build → push → Cloud Run deploy のワンショット
```

---

## ローカル開発

```bash
pnpm install
pnpm --filter @research-agent/agents exec playwright install chromium
cp .env.example .env
# .env を編集（最低 OPENAI_API_KEY だけ実値にすれば動く）
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:8080  (`/health` で生存確認)

`DIFY_API_KEY` と `TAVILY_API_KEY` は **未設定でも動きます**。各ツールが「鍵が無いのでスタブ応答」を返すよう実装してあるため、まずは OpenAI キーだけで体験できます。

### 環境変数

| キー | 必須 | 用途 |
| --- | --- | --- |
| `OPENAI_API_KEY` | ✅ | Mastra agent の LLM |
| `DIFY_API_KEY` | 任意 | 社内ナレッジ RAG。未設定時はスタブ |
| `DIFY_API_BASE` | 任意 | 既定 `https://api.dify.ai/v1` |
| `TAVILY_API_KEY` | 任意 | Web 検索。未設定時はスタブ |
| `NEXT_PUBLIC_API_BASE` | 任意 | Next.js → Hono の URL。本番では Cloud Run の URL |

### スクリプト

```bash
pnpm dev        # web (3000) と api (8080) を並行起動
pnpm typecheck  # 全 workspace を tsc --noEmit
pnpm build      # 各 workspace の build スクリプト実行
```

---

## 本番デプロイ

### API → Cloud Run

```bash
# 一度だけ: 必要 API 有効化、Artifact Registry、Secret Manager
gcloud services enable cloudbuild.googleapis.com run.googleapis.com \
                       artifactregistry.googleapis.com secretmanager.googleapis.com
gcloud artifacts repositories create research-agent --repository-format=docker --location=asia-northeast1
printf '%s' "$OPENAI_API_KEY" | gcloud secrets create OPENAI_API_KEY --data-file=-
printf '%s' "$DIFY_API_KEY"   | gcloud secrets create DIFY_API_KEY   --data-file=-

# デプロイ（以降はこれだけ）
gcloud builds submit --config=infra/cloudbuild.yaml \
  --substitutions=SHORT_SHA=$(git rev-parse --short HEAD) .
```

Cloud Build は `apps/api/Dockerfile`（Playwright 公式イメージベース）でビルドし、Cloud Run へ
`--memory=1Gi --cpu=1 --concurrency=10 --max-instances=3` でデプロイします。

### Web → Vercel

1. https://vercel.com/new で本リポジトリを Import
2. **Root Directory** を `apps/web` に設定
3. Environment Variables に `NEXT_PUBLIC_API_BASE = <Cloud Run URL>` を登録
4. Deploy（以降は `git push origin main` で自動デプロイ）

---

## ハマったところメモ

- **Playwright on Cloud Run**: `node:20-slim` ベースだと Chromium が起動できない。`mcr.microsoft.com/playwright:v1.48.2-jammy` をベースイメージにするのが最短。
- **Mastra `agent.stream`**: `result.textStream` はエラー時に**無音で終了**する。`result.fullStream` を消費して `type: "error"` を text としてクライアントに書き戻すようにすると 429 や 401 が見えるようになる。
- **Cloud Build substitutions**: `${PROJECT_ID}` を user substitution の default 値に書いても展開されない。`$PROJECT_ID` を args に直接書く。

---

## 動作確認

```bash
# API health
curl https://research-agent-api-qfv2ydwkhq-an.a.run.app/health

# 直接エージェントを叩く（ストリーム）
curl -N -X POST https://research-agent-api-qfv2ydwkhq-an.a.run.app/agent/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"こんにちは"}]}'
```
