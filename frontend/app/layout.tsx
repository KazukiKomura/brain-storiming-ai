import "./globals.css";
import type { Metadata } from "next";
import { SessionProvider } from "@/lib/session-context";
import { CanvasProvider } from "@/contexts/CanvasContext";

export const metadata: Metadata = {
  title: "ブレインストーミングAIシステム",
  description: "研究用ブレインストーミングシステム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <SessionProvider>
          <CanvasProvider>
            {children}
          </CanvasProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
