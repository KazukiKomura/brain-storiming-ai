"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Plus, Download, HelpCircle, Sparkles, LayoutGrid, Loader2, User, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import StickyNote from "@/components/sticky-note"
import ColorPalette from "@/components/color-palette"
import html2canvas from "html2canvas"

// 付箋のタイプ定義
export type Note = {
  id: string
  content: string
  position: { x: number; y: number }
  color: string
  zIndex: number
}

// 利用可能な付箋の色
export const COLORS = {
  yellow: "bg-yellow-200 hover:bg-yellow-300",
  orange: "bg-orange-200 hover:bg-orange-300",
  green: "bg-green-200 hover:bg-green-300",
  blue: "bg-blue-200 hover:bg-blue-300",
  purple: "bg-purple-200 hover:bg-purple-300",
  white: "bg-white hover:bg-gray-100",
}

// お題のリスト
const TOPICS = [
  "未来の働き方について",
  "持続可能な社会のためのアイデア",
  "理想的な教育システム",
  "都市の交通問題の解決策",
  "高齢化社会への対応",
  "デジタル技術と人間の関係",
  "環境問題への取り組み",
  "健康的なライフスタイルの促進",
  "コミュニティ形成のための施策",
  "グローバル化と地域文化の共存",
]

// AIが生成する付箋のサンプルコンテンツ
const AI_GENERATED_CONTENTS = {
  未来の働き方について: [
    "リモートワークとオフィスワークのハイブリッドモデルの標準化",
    "AIによる単純作業の自動化と人間の創造的業務へのシフト",
    "成果主義と労働時間の分離による柔軟な評価システム",
    "デジタルノマドを支援する国際的な法整備と税制",
    "メタバース内での仮想オフィス環境の構築",
  ],
  持続可能な社会のためのアイデア: [
    "都市部での垂直農業の推進による食料自給率の向上",
    "使い捨てプラスチックの完全代替材料の開発と普及",
    "再生可能エネルギーの地域分散型ネットワーク構築",
    "シェアリングエコノミーの税制優遇による促進",
    "サーキュラーエコノミーに基づく製品設計の義務化",
  ],
  理想的な教育システム: [
    "個別最適化された学習プログラムとAIチューターの導入",
    "実社会の課題解決を中心としたプロジェクト型学習",
    "年齢ではなく習熟度に基づいた柔軟な進級システム",
    "デジタルリテラシーと批判的思考を核とした基礎教育",
    "生涯学習を支援する教育クレジットシステムの導入",
  ],
  都市の交通問題の解決策: [
    "自動運転公共交通機関の24時間運行ネットワーク",
    "都市中心部の車両進入制限と歩行者優先ゾーンの拡大",
    "需要予測AIによる動的な交通流制御システム",
    "自転車専用高速道路網の整備",
    "空飛ぶタクシーの導入と立体的交通網の構築",
  ],
  高齢化社会への対応: [
    "高齢者の経験を活かした世代間交流プログラムの制度化",
    "AIとロボティクスによる在宅介護支援システムの普及",
    "高齢者向けシェアハウスと若年層との混住促進策",
    "リモート医療診断と予防医療の強化による医療費削減",
    "認知症予防のための社会参加型コミュニティ活動の推進",
  ],
}

// AIによる付箋の色の選択（意味的なグループごとに色を変える）
const AI_COLOR_GROUPS = {
  技術: "blue",
  社会: "yellow",
  経済: "green",
  環境: "orange",
  教育: "purple",
  健康: "white",
}

// ゲームの状態を表す型
type GameState = "idle" | "waiting_for_id" | "topic_selection" | "user_turn" | "ai_turn"

export default function CollaborativeCanvas() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedColor, setSelectedColor] = useState<string>("yellow")
  const [canvasTitle, setCanvasTitle] = useState<string>("コラボレーティブキャンバス")
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false)
  const [highestZIndex, setHighestZIndex] = useState<number>(1)
  const [isAILoading, setIsAILoading] = useState<boolean>(false)
  const [userId, setUserId] = useState<string>("")
  const [isIdDialogOpen, setIsIdDialogOpen] = useState<boolean>(false)
  const [currentTopic, setCurrentTopic] = useState<string>("")
  const [gameState, setGameState] = useState<GameState>("idle")
  const [turnMessage, setTurnMessage] = useState<string>("")
  const [turnCount, setTurnCount] = useState<number>(0)
  const canvasRef = useRef<HTMLDivElement>(null)
  const userIdInputRef = useRef<HTMLInputElement>(null)

  // ゲームを開始する
  const startGame = () => {
    setIsIdDialogOpen(true)
    setGameState("waiting_for_id")
  }

  // IDを設定してゲームを続行
  const setUserIdAndContinue = () => {
    if (userIdInputRef.current && userIdInputRef.current.value.trim()) {
      setUserId(userIdInputRef.current.value.trim())
      setIsIdDialogOpen(false)
      selectRandomTopic()
      setGameState("topic_selection")
    }
  }

  // ランダムなお題を選択
  const selectRandomTopic = () => {
    const randomIndex = Math.floor(Math.random() * TOPICS.length)
    setCurrentTopic(TOPICS[randomIndex])
    setCanvasTitle(`お題: ${TOPICS[randomIndex]}`)

    // 最初のターンはユーザー
    setTimeout(() => {
      setGameState("user_turn")
      setTurnMessage(`${userId}さんの番です。アイデアを付箋に書いてください。`)
    }, 1000)
  }

  // ユーザーのターンを終了
  const endUserTurn = () => {
    setTurnCount(turnCount + 1)
    setGameState("ai_turn")
    setTurnMessage("AIの番です。AIがアイデアを考えています...")

    // AIのターンをシミュレート
    setTimeout(() => {
      handleAITurn()
    }, 1500)
  }

  // AIのターン処理
  const handleAITurn = async () => {
    setIsAILoading(true)

    try {
      // バックエンドとの通信をシミュレート
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const width = rect.width
        const height = rect.height

        // 1〜2個のランダムな付箋を生成
        const numNotes = Math.floor(Math.random() * 2) + 1
        const newNotes: Note[] = []

        for (let i = 0; i < numNotes; i++) {
          // ランダムな位置を生成
          const x = Math.random() * (width - 200) + 50
          const y = Math.random() * (height - 200) + 50

          // 現在のお題に関連するコンテンツを選択
          let content = "AIのアイデア"
          if (AI_GENERATED_CONTENTS[currentTopic as keyof typeof AI_GENERATED_CONTENTS]) {
            const contentArray = AI_GENERATED_CONTENTS[currentTopic as keyof typeof AI_GENERATED_CONTENTS]
            const contentIndex = Math.floor(Math.random() * contentArray.length)
            content = contentArray[contentIndex]
          }

          // コンテンツに基づいて色を選択
          let color = "blue" // デフォルト色
          for (const [category, categoryColor] of Object.entries(AI_COLOR_GROUPS)) {
            if (content.includes(category)) {
              color = categoryColor
              break
            }
          }

          newNotes.push({
            id: `ai-${Date.now()}-${i}`,
            content,
            position: { x, y },
            color,
            zIndex: highestZIndex + i + 1,
          })
        }

        setNotes([...notes, ...newNotes])
        setHighestZIndex(highestZIndex + numNotes)
      }
    } catch (error) {
      console.error("AIターンエラー:", error)
    } finally {
      setIsAILoading(false)

      // ターンを終了し、ユーザーのターンに戻る
      setTimeout(() => {
        setTurnCount(turnCount + 1)
        setGameState("user_turn")
        setTurnMessage(`${userId}さんの番です。アイデアを付箋に書いてください。`)
      }, 1000)
    }
  }

  // キャンバス上のクリックイベント処理
  const addNote = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    // ユーザーのターン以外は付箋を追加できない
    if (gameState !== "user_turn" && gameState !== "idle") {
      return
    }

    // キャンバス上の位置を取得
    if (canvasRef.current) {
      let x, y

      if ("touches" in e) {
        // タッチイベントの場合
        const touch = e.touches[0]
        const rect = canvasRef.current.getBoundingClientRect()
        x = touch.clientX - rect.left
        y = touch.clientY - rect.top
      } else {
        // マウスイベントの場合
        const rect = canvasRef.current.getBoundingClientRect()
        x = e.clientX - rect.left
        y = e.clientY - rect.top
      }

      // クリックした場所が既存の付箋の上でなければ新しい付箋を追加
      if (e.target === e.currentTarget) {
        const newNote: Note = {
          id: `user-${Date.now()}`,
          content: "",
          position: { x, y },
          color: selectedColor,
          zIndex: highestZIndex + 1,
        }
        setNotes([...notes, newNote])
        setHighestZIndex(highestZIndex + 1)
      }
    }
  }

  // 付箋を更新する関数
  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(notes.map((note) => (note.id === id ? { ...note, ...updates, zIndex: highestZIndex + 1 } : note)))
    setHighestZIndex(highestZIndex + 1)
  }

  // 付箋を削除する関数
  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id))
  }

  // キャンバスをクリアする関数
  const clearCanvas = () => {
    if (confirm("すべての付箋を削除してもよろしいですか？")) {
      setNotes([])
    }
  }

  // キャンバスを画像として保存する関数
  const saveAsImage = async () => {
    if (canvasRef.current) {
      try {
        const canvas = await html2canvas(canvasRef.current)
        const image = canvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.href = image
        link.download = `${canvasTitle || "collaborative-canvas"}.png`
        link.click()
      } catch (error) {
        console.error("Error saving canvas:", error)
      }
    }
  }

  // AIによる付箋追加のシミュレーション
  const handleAIAddNotes = async () => {
    setIsAILoading(true)

    try {
      // バックエンドとの通信をシミュレート
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const width = rect.width
        const height = rect.height

        // 3〜5個のランダムな付箋を生成
        const numNotes = Math.floor(Math.random() * 3) + 3
        const newNotes: Note[] = []

        for (let i = 0; i < numNotes; i++) {
          // ランダムな位置を生成（既存の付箋と重ならないように）
          const x = Math.random() * (width - 200) + 50
          const y = Math.random() * (height - 200) + 50

          // ランダムなコンテンツを選択
          let content = "AIのアイデア"
          if (currentTopic && AI_GENERATED_CONTENTS[currentTopic as keyof typeof AI_GENERATED_CONTENTS]) {
            const contentArray = AI_GENERATED_CONTENTS[currentTopic as keyof typeof AI_GENERATED_CONTENTS]
            const contentIndex = Math.floor(Math.random() * contentArray.length)
            content = contentArray[contentIndex]
          } else {
            const contentIndex = Math.floor(Math.random() * AI_GENERATED_CONTENTS["未来の働き方について"].length)
            content = AI_GENERATED_CONTENTS["未来の働き方について"][contentIndex]
          }

          // コンテンツに基づいて色を選択
          let color = "yellow"
          for (const [category, categoryColor] of Object.entries(AI_COLOR_GROUPS)) {
            if (content.includes(category)) {
              color = categoryColor
              break
            }
          }

          newNotes.push({
            id: `ai-${Date.now()}-${i}`,
            content,
            position: { x, y },
            color,
            zIndex: highestZIndex + i + 1,
          })
        }

        setNotes([...notes, ...newNotes])
        setHighestZIndex(highestZIndex + numNotes)
      }
    } catch (error) {
      console.error("AI付箋追加エラー:", error)
    } finally {
      setIsAILoading(false)
    }
  }

  // AIによる付箋整理のシミュレーション
  const handleAIOrganizeNotes = async () => {
    if (notes.length < 2) {
      alert("整理するには少なくとも2つの付箋が必要です。")
      return
    }

    setIsAILoading(true)

    try {
      // バックエンドとの通信をシミュレート
      await new Promise((resolve) => setTimeout(resolve, 2000))

      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const width = rect.width
        const height = rect.height

        // 付箋をグループ化（デモのため、単純に色でグループ化）
        const groupedNotes: Record<string, Note[]> = {}

        notes.forEach((note) => {
          if (!groupedNotes[note.color]) {
            groupedNotes[note.color] = []
          }
          groupedNotes[note.color].push(note)
        })

        // グループごとに配置
        const updatedNotes: Note[] = []
        let groupIndex = 0

        for (const [color, colorNotes] of Object.entries(groupedNotes)) {
          // グループの開始位置を計算
          const groupX = 100 + ((groupIndex * 300) % (width - 200))
          const groupY = 100 + Math.floor((groupIndex * 300) / (width - 200)) * 300

          // グループ内の付箋を配置
          colorNotes.forEach((note, noteIndex) => {
            const row = Math.floor(noteIndex / 3)
            const col = noteIndex % 3

            updatedNotes.push({
              ...note,
              position: {
                x: groupX + col * 160,
                y: groupY + row * 160,
              },
              zIndex: highestZIndex + updatedNotes.length + 1,
            })
          })

          groupIndex++
        }

        setNotes(updatedNotes)
        setHighestZIndex(highestZIndex + updatedNotes.length)
      }
    } catch (error) {
      console.error("AI付箋整理エラー:", error)
    } finally {
      setIsAILoading(false)
    }
  }

  // タッチデバイスの検出
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0)
  }, [])

  return (
    <div className="flex flex-col h-screen w-full">
      {/* ID入力ダイアログ */}
      <Dialog open={isIdDialogOpen} onOpenChange={setIsIdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>IDを入力してください</DialogTitle>
            <DialogDescription>
              AIとのアイデア出し合いを開始するために、あなたのIDを入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="user-id" className="text-right">
                ユーザーID
              </label>
              <Input id="user-id" ref={userIdInputRef} placeholder="あなたのIDを入力" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={setUserIdAndContinue}>開始</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ヘッダー */}
      <header className="flex justify-between items-center p-3 bg-gray-900 text-white">
        <div className="flex items-center">
          {isEditingTitle && gameState === "idle" ? (
            <Input
              value={canvasTitle}
              onChange={(e) => setCanvasTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
              className="max-w-xs text-black"
              autoFocus
            />
          ) : (
            <h1
              className={`text-xl font-bold ${gameState === "idle" ? "cursor-pointer" : ""}`}
              onClick={() => gameState === "idle" && setIsEditingTitle(true)}
            >
              {canvasTitle}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {gameState === "idle" ? (
            <>
              <ColorPalette colors={COLORS} selectedColor={selectedColor} onSelectColor={setSelectedColor} />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleAIAddNotes}
                      disabled={isAILoading}
                      className="bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      {isAILoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>AIによる付箋追加</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleAIOrganizeNotes}
                      disabled={isAILoading}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {isAILoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutGrid className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>AIによる付箋整理</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" title="ヘルプ">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>使い方</DialogTitle>
                    <DialogDescription>このアプリケーションの基本的な操作方法です</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <h3 className="font-medium">付箋の追加</h3>
                      <p className="text-sm text-muted-foreground">
                        キャンバス上の空いている場所をクリック/タップすると新しい付箋が追加されます。
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">付箋の編集</h3>
                      <p className="text-sm text-muted-foreground">
                        付箋のテキスト部分をクリック/タップすると編集モードになります。編集が終わったら「完了」ボタンをクリックしてください。
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">付箋の移動</h3>
                      <p className="text-sm text-muted-foreground">
                        付箋のヘッダー部分や背景部分をドラッグすると付箋を移動できます。
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">付箋の色変更</h3>
                      <p className="text-sm text-muted-foreground">
                        パレットアイコンをクリックすると付箋の色を変更できます。
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">AI機能</h3>
                      <p className="text-sm text-muted-foreground">
                        <span className="inline-flex items-center mr-1">
                          <Sparkles className="h-3 w-3 mr-1" /> ボタン
                        </span>
                        : AIがアイデアを生成し、自動的に付箋を追加します。
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="inline-flex items-center mr-1">
                          <LayoutGrid className="h-3 w-3 mr-1" /> ボタン
                        </span>
                        : AIが既存の付箋を意味的に整理し、グループ化します。
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="icon" onClick={saveAsImage} title="画像として保存">
                <Download className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <span className="sr-only">メニューを開く</span>
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={clearCanvas}>キャンバスをクリア</DropdownMenuItem>
                  <DropdownMenuItem onClick={startGame}>AIとアイデア出し合いを開始</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <ColorPalette colors={COLORS} selectedColor={selectedColor} onSelectColor={setSelectedColor} />

              {gameState === "user_turn" && (
                <Button variant="outline" onClick={endUserTurn} className="bg-green-500 hover:bg-green-600 text-white">
                  ターン終了
                </Button>
              )}

              <div className="flex items-center gap-1 ml-2">
                <div
                  className={`w-2 h-2 rounded-full ${gameState === "user_turn" ? "bg-green-500" : "bg-gray-500"}`}
                ></div>
                <User className="h-4 w-4" />
                <span className="text-sm">{userId || "ユーザー"}</span>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <div
                  className={`w-2 h-2 rounded-full ${gameState === "ai_turn" ? "bg-green-500" : "bg-gray-500"}`}
                ></div>
                <Bot className="h-4 w-4" />
                <span className="text-sm">AI</span>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ターン表示 */}
      {gameState !== "idle" && (
        <div className="bg-gray-800 text-white p-2 flex justify-between items-center">
          <div className="flex items-center">
            <span className="font-medium mr-2">お題:</span>
            <span>{currentTopic}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-2">ターン:</span>
            <span>{turnCount}</span>
          </div>
        </div>
      )}

      {/* ターンメッセージ */}
      {turnMessage && (
        <Alert
          className={
            gameState === "user_turn" ? "bg-green-100" : gameState === "ai_turn" ? "bg-blue-100" : "bg-gray-100"
          }
        >
          <AlertTitle className="flex items-center">
            {gameState === "user_turn" ? <User className="h-4 w-4 mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
            ターン情報
          </AlertTitle>
          <AlertDescription>
            {turnMessage}
            {gameState === "ai_turn" && isAILoading && (
              <div className="flex items-center mt-1">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>AIが考え中...</span>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* キャンバス */}
      <div
        ref={canvasRef}
        className="flex-1 relative bg-gray-100 overflow-auto"
        onClick={addNote}
        onTouchStart={isTouchDevice ? addNote : undefined}
        style={{ touchAction: "auto" }}
      >
        {notes.map((note) => (
          <StickyNote key={note.id} note={note} updateNote={updateNote} deleteNote={deleteNote} colors={COLORS} />
        ))}
      </div>
    </div>
  )
}

