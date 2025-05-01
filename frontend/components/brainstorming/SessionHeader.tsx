"use client";

import { useState } from 'react';
import { User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GameState } from '@/types/session';

interface SessionHeaderProps {
  title: string;
  isTestMode: boolean;
  gameState: GameState;
  userId: string;
  selectedColor: string;
  onColorSelect: (color: string) => void;
  onEndTurn?: () => void;
  isEditable?: boolean;
  onTitleChange?: (title: string) => void;
}

export default function SessionHeader({
  title,
  isTestMode,
  gameState,
  userId,
  selectedColor,
  onColorSelect,
  onEndTurn,
  isEditable = false,
  onTitleChange
}: SessionHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editableTitle, setEditableTitle] = useState<string>(title);

  const handleTitleChange = (value: string) => {
    setEditableTitle(value);
  };

  const finishTitleEdit = () => {
    setIsEditingTitle(false);
    if (onTitleChange) {
      onTitleChange(editableTitle);
    }
  };

  // タイトルが変更されたら状態を更新
  if (title !== editableTitle && !isEditingTitle) {
    setEditableTitle(title);
  }

  return (
    <header className="flex justify-between items-center p-3 bg-gray-900 text-white">
      <div className="flex items-center">
        {isEditingTitle && gameState === "idle" ? (
          <Input
            value={editableTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            onBlur={finishTitleEdit}
            onKeyDown={(e) => e.key === "Enter" && finishTitleEdit()}
            className="max-w-xs text-black"
            autoFocus
          />
        ) : (
          <h1
            className="text-xl font-bold"
            onClick={() => isEditable && setIsEditingTitle(true)}
          >
            {title}
          </h1>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {gameState === "idle" ? (
          <>
            {/* アイドル状態のコントロール - 通常は表示しない */}
          </>
        ) : (
          <>
            {/* ゲーム進行中の状態表示 */}
            {gameState === "user_turn" && onEndTurn && (
              <Button variant="outline" onClick={onEndTurn} className="bg-green-500 hover:bg-green-600 text-white">
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
  );
} 