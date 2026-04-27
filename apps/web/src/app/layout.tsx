import type { ReactNode } from "react";

export const metadata = {
  title: "Research Agent",
  description: "Dify + Mastra powered research agent",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body
        style={{
          fontFamily:
            "system-ui, -apple-system, 'Hiragino Sans', sans-serif",
          margin: 0,
          background: "#0b0d12",
          color: "#e6e8eb",
        }}
      >
        {children}
      </body>
    </html>
  );
}
