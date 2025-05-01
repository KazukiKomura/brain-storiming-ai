"use client"

import React, { useState, useRef, useEffect } from "react"
import { X, User, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Note } from "@/types/notes"
import { COLORS, NOTE_SIZE } from "@/types/notes"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface StickyNoteProps {
  note: Note
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  colors: typeof COLORS
  canvasRef?: React.RefObject<HTMLDivElement>
  className?: string
}

export default function StickyNote({ note, updateNote, deleteNote, colors, canvasRef, className }: StickyNoteProps) {
  // 付箋の編集状態を管理
  const [isEditing, setIsEditing] = useState(note.content === "")
  // ローカルステートでテキスト内容を管理
  const [localContent, setLocalContent] = useState(note.content || "")
  // AI生成とユーザー生成のフラグ
  const [isAIGenerated, setIsAIGenerated] = useState(note.id.startsWith("ai-"))
  const [isUserGenerated, setIsUserGenerated] = useState(note.id.startsWith("user-"))
  
  // 参照
  const noteRef = useRef(null)
  const textareaRef = useRef(null)

  // note.contentが変更されたときにlocalContentも更新
  useEffect(() => {
    setLocalContent(note.content || "");
  }, [note.content]);

  // 編集モードになったらテキストエリアにフォーカス
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      if (textareaRef.current.value) {
        const len = textareaRef.current.value.length
        textareaRef.current.setSelectionRange(len, len)
      }
    }
  }, [isEditing])

  // 付箋の外側をクリックしたら編集を完了する
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isEditing && 
          noteRef.current && 
          !noteRef.current.contains(event.target)) {
        finishEditing()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing])

  // 編集モードを有効にする
  const enableEditMode = (e) => {
    // 親要素へのイベント伝播を防止
    e.stopPropagation()
    console.log("Enable edit mode")
    setIsEditing(true)
  }

  // 編集を完了する
  const finishEditing = () => {
    console.log("Finishing edit, content:", localContent)
    // turnIdを含むすべての元のプロパティを保持しつつ、contentだけを更新
    updateNote(note.id, { 
      content: localContent,
      finishEditing: true,
      // 明示的にturnIdを渡して確実に保持されるようにする
      turnId: note.turnId 
    })
    setIsEditing(false)
  }

  // テキスト変更時の処理
  const handleTextChange = (e) => {
    setLocalContent(e.target.value)
  }

  // キー入力時の処理
  const handleKeyDown = (e) => {
    // Enterキー（Shift押さない）で編集完了
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      finishEditing()
    }
    // Escキーで編集キャンセル
    else if (e.key === 'Escape') {
      setLocalContent(note.content || "")
      setIsEditing(false)
    }
  }
  
  // 付箋を削除する
  const handleDelete = (e) => {
    e.stopPropagation()
    deleteNote(note.id)
  }

  // Z-indexを更新して最前面に
  const bringToFront = () => {
    updateNote(note.id, { zIndex: note.zIndex + 1 })
  }

  // 本体クリック時の処理
  const handleNoteClick = (e) => {
    // ボタンや特定の要素のクリックは無視
    if (
      e.target instanceof HTMLButtonElement || 
      e.target.closest("button") 
    ) {
      return
    }
    
    // AIが作成した付箋は編集不可
    if (isAIGenerated) {
      // AIの付箋はクリックしても編集モードにならない
      console.log("AIの付箋は編集できません");
      bringToFront();
      return;
    }
    
    // 最前面に
    bringToFront()
    
    // 編集モードでなければ編集モードに
    if (!isEditing) {
      enableEditMode(e)
    }
  }

  return (
    <div
      ref={noteRef}
      className={`absolute shadow-md rounded p-3 flex flex-col ${colors[note.color]} ${
        isEditing ? "ring-2 ring-blue-500" : ""
      } ${isAIGenerated ? "animate-fadeIn" : ""} ${className || ""}`}
      style={{
        left: `${note.position.x}px`,
        top: `${note.position.y}px`,
        width: `${NOTE_SIZE}px`,
        height: `${NOTE_SIZE}px`,
        zIndex: note.zIndex,
        cursor: isAIGenerated ? "default" : (isEditing ? "text" : "pointer"),
        fontSize: "0.8rem",
      }}
      onClick={handleNoteClick}
    >
      {/* AI/ユーザーマーク */}
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

      {/* コントロール部分 - 削除ボタンのみ */}
      <div className="flex justify-end mb-2 note-controls">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 p-0 hover:bg-red-100" 
          onClick={handleDelete}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 本文部分 */}
      <div className="flex-1 flex items-center justify-center">
        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={localContent}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none border-none bg-transparent focus-visible:ring-0 p-0 text-[0.9rem] text-center"
            placeholder="入力..."
            autoFocus
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center overflow-auto ${!isAIGenerated ? "cursor-pointer" : ""}`}>
            {localContent ? (
              <p className="whitespace-pre-wrap text-[0.9rem] text-center">{localContent}</p>
            ) : (
              !isAIGenerated && <p className="text-gray-400 text-[0.9rem]">クリックして編集</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
