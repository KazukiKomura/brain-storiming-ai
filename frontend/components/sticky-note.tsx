"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Palette, User, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Note, COLORS } from "@/components/collaborative-canvas"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface StickyNoteProps {
  note: Note
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  colors: typeof COLORS
}

export default function StickyNote({ note, updateNote, deleteNote, colors }: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState<boolean>(note.content === "")
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isAIGenerated, setIsAIGenerated] = useState<boolean>(note.id.startsWith("ai-"))
  const [isUserGenerated, setIsUserGenerated] = useState<boolean>(note.id.startsWith("user-"))
  const noteRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // 編集モードになったらテキストエリアにフォーカス
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  // ドラッグ開始時の処理（マウス用）
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // ボタンクリック時はドラッグを開始しない
    if (e.target instanceof HTMLButtonElement || (e.target as HTMLElement).closest("button")) {
      return
    }

    // テキストエリアやテキスト部分をクリックした場合は編集モードに
    if (
      e.target instanceof HTMLTextAreaElement ||
      e.target === contentRef.current ||
      (e.target as HTMLElement).closest(".note-content")
    ) {
      setIsEditing(true)
      return
    }

    e.preventDefault()
    e.stopPropagation() // キャンバスへのイベント伝播を防止
    setIsDragging(true)

    if (noteRef.current) {
      const rect = noteRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })

      // 付箋をクリックしたときにZ-indexを更新して最前面に表示
      updateNote(note.id, { zIndex: note.zIndex }) // これによりzIndexが更新される
    }
  }

  // タッチ開始時の処理
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // ボタンタッチ時はドラッグを開始しない
    if (e.target instanceof HTMLButtonElement || (e.target as HTMLElement).closest("button")) {
      return
    }

    // テキストエリアやテキスト部分をタッチした場合は編集モードに
    if (
      e.target instanceof HTMLTextAreaElement ||
      e.target === contentRef.current ||
      (e.target as HTMLElement).closest(".note-content")
    ) {
      setIsEditing(true)
      return
    }

    e.stopPropagation()

    const touch = e.touches[0]
    setIsDragging(true)

    if (noteRef.current) {
      const rect = noteRef.current.getBoundingClientRect()
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      })

      // 付箋をタッチしたときにZ-indexを更新して最前面に表示
      updateNote(note.id, { zIndex: highestZIndex + 1 })
    }
  }

  // マウス移動時の処理
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && noteRef.current && noteRef.current.parentElement) {
      const parentRect = noteRef.current.parentElement.getBoundingClientRect()

      // 親要素内での位置を計算
      let x = e.clientX - parentRect.left - dragOffset.x
      let y = e.clientY - parentRect.top - dragOffset.y

      // 画面外に出ないように制限（オプション）
      x = Math.max(0, Math.min(x, parentRect.width - 100))
      y = Math.max(0, Math.min(y, parentRect.height - 100))

      updateNote(note.id, {
        position: { x, y },
      })
    }
  }

  // タッチ移動時の処理
  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && noteRef.current && noteRef.current.parentElement) {
      const touch = e.touches[0]
      const parentRect = noteRef.current.parentElement.getBoundingClientRect()

      // 親要素内での位置を計算
      let x = touch.clientX - parentRect.left - dragOffset.x
      let y = touch.clientY - parentRect.top - dragOffset.y

      // 画面外に出ないように制限
      x = Math.max(0, Math.min(x, parentRect.width - 100))
      y = Math.max(0, Math.min(y, parentRect.height - 100))

      updateNote(note.id, {
        position: { x, y },
      })

      // スクロールを防止
      e.preventDefault()
    }
  }

  // ドラッグ終了時の処理
  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // マウス/タッチイベントの登録と解除
  useEffect(() => {
    if (isDragging) {
      // マウスイベント
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleDragEnd)

      // タッチイベント - パッシブを無効化して preventDefault を有効にする
      window.addEventListener("touchmove", handleTouchMove, { passive: false })
      window.addEventListener("touchend", handleDragEnd)
      window.addEventListener("touchcancel", handleDragEnd)
    }

    return () => {
      // マウスイベント
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleDragEnd)

      // タッチイベント
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleDragEnd)
      window.removeEventListener("touchcancel", handleDragEnd)
    }
  }, [isDragging, dragOffset, updateNote])

  // 付箋の色を変更する関数
  const changeColor = (color: string) => {
    updateNote(note.id, { color })
  }

  // 最高のZ-indexを取得（コンポーネント内で定義）
  const highestZIndex = 10000 // 十分に大きな値

  // 編集を完了する関数
  const finishEditing = () => {
    setIsEditing(false)
  }

  // AIによって生成された付箋かどうかを判定
  useEffect(() => {
    setIsAIGenerated(note.id.startsWith("ai-"))
    setIsUserGenerated(note.id.startsWith("user-"))
  }, [note.id])

  return (
    <div
      ref={noteRef}
      className={cn(
        "absolute shadow-md rounded p-2 w-48 min-h-[150px] flex flex-col",
        typeof colors[note.color as keyof typeof colors] === "string" ? colors[note.color as keyof typeof colors] : "",
        isEditing ? "ring-2 ring-blue-500" : "",
        isAIGenerated ? "animate-fadeIn" : "", // AIが生成した付箋にアニメーション効果
      )}
      style={{
        left: `${note.position.x}px`,
        top: `${note.position.y}px`,
        zIndex: note.zIndex,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none", // タッチデバイスでのスクロールを防止
        transition: isAIGenerated && !isDragging ? "transform 0.3s ease-out" : "none", // AIによる整理時のアニメーション
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {isAIGenerated && (
        <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-1 rounded-full flex items-center">
          <Bot className="h-3 w-3 mr-0.5" />
          <span>AI</span>
        </div>
      )}

      {isUserGenerated && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 rounded-full flex items-center">
          <User className="h-3 w-3 mr-0.5" />
          <span>ユーザー</span>
        </div>
      )}

      <div className="flex justify-between mb-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Palette className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {Object.entries(colors).map(([colorName, colorClass]) => {
              const baseColorClass = typeof colorClass === "string" ? colorClass.split(" ")[0] : ""

              return (
                <DropdownMenuItem
                  key={colorName}
                  onClick={() => changeColor(colorName)}
                  className="flex items-center gap-2"
                >
                  <div className={cn("w-4 h-4 rounded", baseColorClass)} />
                  <span className="capitalize">{colorName}</span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteNote(note.id)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="flex flex-col flex-1">
          <Textarea
            ref={textareaRef}
            value={note.content}
            onChange={(e) => updateNote(note.id, { content: e.target.value })}
            className="flex-1 resize-none border-none bg-transparent focus-visible:ring-0 p-0"
            placeholder="アイデアを入力..."
          />
          <div className="flex justify-end mt-1">
            <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={finishEditing}>
              完了
            </Button>
          </div>
        </div>
      ) : (
        <div ref={contentRef} className="flex-1 whitespace-pre-wrap text-sm overflow-auto note-content cursor-text">
          {note.content || <span className="text-gray-400">クリックしてアイデアを入力...</span>}
        </div>
      )}
    </div>
  )
}

