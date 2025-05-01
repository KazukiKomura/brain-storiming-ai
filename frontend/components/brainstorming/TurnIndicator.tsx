"use client";

import { User, Bot, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GameState } from '@/types/session';

interface TurnIndicatorProps {
  gameState: GameState;
  turnMessage: string;
  currentTopic: string;
  userTurnCount: number;
  aiTurnCount: number;
  isAILoading?: boolean;
}

export default function TurnIndicator({
  gameState,
  turnMessage,
  currentTopic,
  userTurnCount,
  aiTurnCount,
  isAILoading = false
}: TurnIndicatorProps) {
  return (
    <>
      {/* トピックとターン表示 */}
      <div className="bg-gray-800 text-white p-2 flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-medium mr-2">お題:</span>
          <span>{currentTopic}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            <span className="font-medium mr-1">ユーザーターン:</span>
            <span>{userTurnCount}</span>
          </div>
          <div className="flex items-center">
            <Bot className="h-4 w-4 mr-1" />
            <span className="font-medium mr-1">AIターン:</span>
            <span>{aiTurnCount}</span>
          </div>
        </div>
      </div>

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
    </>
  );
} 