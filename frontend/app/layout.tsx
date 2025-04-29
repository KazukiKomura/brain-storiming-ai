import "./globals.css";
import type { Metadata } from "next";
import { SessionProvider } from "@/lib/session-context";

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
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
