"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";

const SAMPLE_PROMPTS = [
  "2026年の日本の生成AI市場規模を調べて",
  "Mastra フレームワークの特徴を3つ教えて",
  "Cloud Run と Vercel の違いを比較して",
];

const styles = {
  page: { maxWidth: 760, margin: "0 auto", padding: "32px 16px" } as const,
  title: { fontSize: 24, marginBottom: 4 } as const,
  subtitle: { color: "#9aa3ad", marginTop: 0 } as const,
  panel: {
    background: "#13161d",
    borderRadius: 12,
    padding: 16,
    minHeight: 360,
    marginTop: 16,
    border: "1px solid #1f242e",
  } as const,
  emptyHint: { color: "#6b7380", marginBottom: 12 } as const,
  chipRow: { display: "flex", flexWrap: "wrap", gap: 8 } as const,
  chip: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid #2a2f3a",
    background: "#0f1218",
    color: "#cbd2db",
    fontSize: 13,
    cursor: "pointer",
  } as const,
  msgRow: { marginBottom: 14 } as const,
  msgUser: { color: "#7dd3fc", fontWeight: 600 } as const,
  msgAgent: { color: "#a7f3d0", fontWeight: 600 } as const,
  msgError: { color: "#fca5a5", fontWeight: 600 } as const,
  msgBody: { whiteSpace: "pre-wrap" as const, marginTop: 4, lineHeight: 1.6 },
  caret: {
    display: "inline-block",
    width: 8,
    background: "#a7f3d0",
    marginLeft: 2,
    animation: "ra-blink 1s steps(2) infinite",
  } as const,
  thinking: {
    display: "inline-flex",
    gap: 4,
    alignItems: "center",
    color: "#9aa3ad",
    fontSize: 13,
    marginTop: 4,
  } as const,
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#6b7380",
    animation: "ra-bounce 1.2s infinite ease-in-out",
  } as const,
  form: { display: "flex", gap: 8, marginTop: 16 } as const,
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #2a2f3a",
    background: "#0f1218",
    color: "#e6e8eb",
    outline: "none",
  } as const,
  submit: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    background: "#3b82f6",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  } as const,
  stop: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid #b91c1c",
    background: "#7f1d1d",
    color: "#fee2e2",
    cursor: "pointer",
    fontWeight: 600,
  } as const,
  errorBanner: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 8,
    background: "#3b0a0a",
    border: "1px solid #7f1d1d",
    color: "#fecaca",
    fontSize: 13,
  } as const,
};

const KEYFRAMES = `
@keyframes ra-blink { to { visibility: hidden } }
@keyframes ra-bounce {
  0%, 80%, 100% { transform: scale(0.5); opacity: 0.5 }
  40% { transform: scale(1); opacity: 1 }
}
`;

function ThinkingDots() {
  return (
    <span style={styles.thinking} aria-label="考え中">
      <span style={{ ...styles.dot, animationDelay: "0s" }} />
      <span style={{ ...styles.dot, animationDelay: "0.15s" }} />
      <span style={{ ...styles.dot, animationDelay: "0.3s" }} />
      <span style={{ marginLeft: 6 }}>考え中…</span>
    </span>
  );
}

export default function Page() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    error,
    setInput,
  } = useChat({ api: "/api/chat", streamProtocol: "text" });

  const lastMessage = messages[messages.length - 1];
  const lastIsUser = lastMessage?.role === "user";
  const lastAssistantStreaming =
    isLoading && lastMessage?.role === "assistant";
  const showThinking = isLoading && (lastIsUser || messages.length === 0);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim().length > 0) {
        handleSubmit();
      }
    }
  };

  const errorText = useMemo(() => {
    if (!error) return null;
    return error.message ?? String(error);
  }, [error]);

  return (
    <main style={styles.page}>
      <style>{KEYFRAMES}</style>
      <h1 style={styles.title}>Research Agent</h1>
      <p style={styles.subtitle}>
        Dify ナレッジ + Web 検索 + ブラウザ自動化を横断するリサーチエージェント
      </p>

      <section style={styles.panel}>
        {messages.length === 0 && (
          <>
            <p style={styles.emptyHint}>質問を入力してください</p>
            <div style={styles.chipRow}>
              {SAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  style={styles.chip}
                  onClick={() => setInput(p)}
                  disabled={isLoading}
                >
                  {p}
                </button>
              ))}
            </div>
          </>
        )}

        {messages.map((m) => {
          const isErr = m.role === "assistant" && m.content.includes("[error");
          const labelStyle = isErr
            ? styles.msgError
            : m.role === "user"
              ? styles.msgUser
              : styles.msgAgent;
          const isStreamingThis =
            lastAssistantStreaming && m.id === lastMessage?.id;
          return (
            <div key={m.id} style={styles.msgRow}>
              <div style={labelStyle}>
                {m.role === "user" ? "You" : isErr ? "Error" : "Agent"}
              </div>
              <div style={styles.msgBody}>
                {m.content}
                {isStreamingThis && <span style={styles.caret}>&nbsp;</span>}
              </div>
            </div>
          );
        })}

        {showThinking && <ThinkingDots />}
        <div ref={bottomRef} />
      </section>

      {errorText && <div style={styles.errorBanner}>⚠ {errorText}</div>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isLoading && input.trim().length > 0) handleSubmit();
        }}
        style={styles.form}
      >
        <input
          value={input}
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
          placeholder="例: 2026年の日本の生成AI市場規模を調べて"
          style={styles.input}
          disabled={isLoading}
          autoFocus
        />
        {isLoading ? (
          <button type="button" onClick={stop} style={styles.stop}>
            停止
          </button>
        ) : (
          <button
            type="submit"
            style={styles.submit}
            disabled={input.trim().length === 0}
          >
            送信
          </button>
        )}
      </form>
    </main>
  );
}
