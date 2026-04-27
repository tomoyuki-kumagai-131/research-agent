"use client";

import { useChat } from "@ai-sdk/react";

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({ api: "/api/chat", streamProtocol: "text" });

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Research Agent</h1>
      <p style={{ color: "#9aa3ad", marginTop: 0 }}>
        Dify ナレッジ + Web 検索を横断するリサーチエージェント
      </p>

      <section
        style={{
          background: "#13161d",
          borderRadius: 12,
          padding: 16,
          minHeight: 320,
          marginTop: 16,
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#6b7380" }}>質問を入力してください…</p>
        )}
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 12 }}>
            <strong style={{ color: m.role === "user" ? "#7dd3fc" : "#a7f3d0" }}>
              {m.role === "user" ? "You" : "Agent"}
            </strong>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
          </div>
        ))}
      </section>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: 8, marginTop: 16 }}
      >
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="例: 2026年の日本の生成AI市場規模を調べて"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #2a2f3a",
            background: "#0f1218",
            color: "#e6e8eb",
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: "#3b82f6",
            color: "white",
            cursor: "pointer",
          }}
        >
          {isLoading ? "..." : "送信"}
        </button>
      </form>
    </main>
  );
}
