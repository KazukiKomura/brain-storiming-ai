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
  // グリッドベースのレイアウトを使用するため、ドラッグ機能は無効化
  const [isDragging, setIsDragging] = useState<boolean>(false)
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

  // 付箋の外側をクリックしたら編集を完了する
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && 
          noteRef.current && 
          !noteRef.current.contains(event.target as Node)) {
        finishEditing()
      }
    }

    // ESCキーを押したら編集を完了する
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditing && event.key === 'Escape') {
        finishEditing()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isEditing])

  // クリックイベント処理 - ドラッグではなく編集のみを許可
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // ボタンクリックは親要素に伝播しないように
    if (e.target instanceof HTMLButtonElement || (e.target as HTMLElement).closest("button")) {
      e.stopPropagation()
      return
    }

    // テキストエリアやテキスト部分をクリックした場合は編集モードに
    if (
      e.target instanceof HTMLTextAreaElement ||
      e.target === contentRef.current ||
      (e.target as HTMLElement).closest(".note-content")
    ) {
      setIsEditing(true)
      e.stopPropagation() // キャンバスへのイベント伝播を防止
    }

    // 付箋をクリックしたときにZ-indexを更新して最前面に表示
    updateNote(note.id, { zIndex: note.zIndex + 1 })
  }

  // タッチイベント処理 - ドラッグではなく編集のみを許可
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // ボタンタッチ時は親要素に伝播しないように
    if (e.target instanceof HTMLButtonElement || (e.target as HTMLElement).closest("button")) {
      e.stopPropagation()
      return
    }

    // テキストエリアやテキスト部分をタッチした場合は編集モードに
    if (
      e.target instanceof HTMLTextAreaElement ||
      e.target === contentRef.current ||
      (e.target as HTMLElement).closest(".note-content")
    ) {
      setIsEditing(true)
      e.stopPropagation() // キャンバスへのイベント伝播を防止
    }

    // 付箋をタッチしたときにZ-indexを更新して最前面に表示
    updateNote(note.id, { zIndex: note.zIndex + 1 })
  }

  // 最高のZ-indexを取得（コンポーネント内で定義）
  const highestZIndex = 10000 // 十分に大きな値

  // 編集を完了する関数
  const finishEditing = () => {
    // 編集終了時にコンテンツを保存するフラグを追加
    if (isEditing) {
      updateNote(note.id, { content: note.content, finishEditing: true });
    }
    setIsEditing(false);
  }

  // テキストエリアの入力変更時
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNote(note.id, { content: e.target.value })
  }

  // テキストエリアでEnterキーを押したら編集完了
  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      finishEditing()
    }
  }

  // 付箋の色を変更する関数 - グリッドでの位置も更新
  const changeColor = (color: string) => {
    // グリッド位置を更新しない（グリッドベースのレイアウトでは色変更時に位置は更新しない）
    updateNote(note.id, { color })
  }
  
  // 付箋を削除する処理
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // クリックイベントの伝播を止める
    deleteNote(note.id)
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
        "absolute shadow-md rounded p-3 w-[150px] h-[150px] flex flex-col",
        typeof colors[note.color as keyof typeof colors] === "string" ? colors[note.color as keyof typeof colors] : "",
        isEditing ? "ring-2 ring-blue-500" : "",
        isAIGenerated ? "animate-fadeIn" : "", // AIが生成した付箋にアニメーション効果
      )}
      style={{
        left: `${note.position.x}px`,
        top: `${note.position.y}px`,
        zIndex: note.zIndex,
        cursor: "default",
        fontSize: "0.9rem", // フォントサイズを大きくしてさらに読みやすく
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* AIマーク、ユーザーマークなどの表示 */}
      {isAIGenerated && (
        <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-[0.7rem] px-1.5 rounded-full flex items-center">
          <Bot className="h-3 w-3 mr-0.5" />
          <span>AI</span>
        </div>
      )}

      {isUserGenerated && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[0.7rem] px-1.5 rounded-full flex items-center">
          <User className="h-3 w-3 mr-0.5" />
          <span>ユーザー</span>
        </div>
      )}

      <div className="flex justify-between mb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
              <Palette className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {Object.entries(colors).map(([colorName, colorClass]) => {
              const baseColorClass = typeof colorClass === "string" ? colorClass.split(" ")[0] : ""

              return (
                <DropdownMenuItem
                  key={colorName}
                  onClick={() => changeColor(colorName)}
                  className="flex items-center gap-2 text-xs py-1"
                >
                  <div className={cn("w-4 h-4 rounded", baseColorClass)} />
                  <span className="capitalize">{colorName}</span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 p-0 hover:bg-red-100" 
            onClick={handleDelete}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="flex flex-col flex-1">
          <Textarea
            ref={textareaRef}
            value={note.content}
            onChange={handleTextChange}
            onKeyDown={handleTextKeyDown}
            onBlur={finishEditing}
            className="flex-1 resize-none border-none bg-transparent focus-visible:ring-0 p-0 text-[0.9rem] min-h-0"
            placeholder="入力..."
          />
        </div>
      ) : (
        <div 
          ref={contentRef} 
          className="flex-1 whitespace-pre-wrap text-[0.9rem] overflow-auto note-content cursor-text"
          onClick={() => setIsEditing(true)}
        >
          {note.content || <span className="text-gray-400 text-[0.9rem]">クリック</span>}
        </div>
      )}
    </div>
  )
}
