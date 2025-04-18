import type { Metadata } from "next"
import CollaborativeCanvas from "@/components/collaborative-canvas"

export const metadata: Metadata = {
  title: "コラボレーティブ付箋アイデア出しシステム",
  description: "付箋を使ってアイデアを整理し、ブレインストーミングを行うためのシステム",
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <CollaborativeCanvas />
    </main>
  )
}

