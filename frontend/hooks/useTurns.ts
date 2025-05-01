"use client";

import { useState, useEffect } from 'react';
import { GameState, TOPICS, AI_GENERATED_CONTENTS, AI_COLOR_GROUPS } from '@/types/session';
import { Note } from '@/types/notes';

interface UseTurnsProps {
  isTestMode?: boolean;
  currentState?: string;
  userId: string;
  onSaveNotes?: (notes: Note[]) => void;
  addAiNote: (content: string, color: string) => void;
  clearCanvas: () => void;
  goToState: (state: string) => void;
  countUserNotes?: () => number;
  countNotesWithContent?: () => number;
}

export function useTurns({
  isTestMode = false,
  currentState = 'session1',
  userId,
  onSaveNotes,
  addAiNote,
  clearCanvas,
  goToState,
  countUserNotes = () => 0,
  countNotesWithContent = () => 0
}: UseTurnsProps) {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [turnCount, setTurnCount] = useState<number>(0);
  const [aiTurnCount, setAiTurnCount] = useState<number>(0);
  const [userTurnCount, setUserTurnCount] = useState<number>(0);
  const [turnMessage, setTurnMessage] = useState<string>("");
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [canvasTitle, setCanvasTitle] = useState<string>("ブレインストーミングセッション");
  const [isAILoading, setIsAILoading] = useState<boolean>(false);

  // セッションタイプに応じたデフォルトのタイトル設定
  useEffect(() => {
    console.log("useTurns effect - currentState:", currentState, "isTestMode:", isTestMode, "userId:", userId, "gameState:", gameState);

    if (isTestMode) {
      setCanvasTitle("テストセッション");
    } else if (currentState === "session1") {
      setCanvasTitle("本番セッション1");
    } else if (currentState === "session2") {
      setCanvasTitle("本番セッション2");
    } else {
      setCanvasTitle("ブレインストーミングセッション");
    }
    
    // テストモードでなく、かつユーザーIDが設定されている場合のみ、ゲームを開始
    if (!isTestMode && userId && gameState === "idle") {
      console.log("自動的にAIターンを開始します（userId:" + userId + "）");
      
      // ランダムなトピックを選んでからAIターンを開始
      const randomIndex = Math.floor(Math.random() * TOPICS.length);
      const selectedTopic = TOPICS[randomIndex];
      setCurrentTopic(selectedTopic);
      setCanvasTitle(`お題: ${selectedTopic}`);
      
      // AIターンを開始
      setGameState("ai_turn");
      setTurnMessage("AIの番です。AIがアイデアを生成しています...");
      
      // 少し遅延してからAIターン処理を開始
      setTimeout(() => {
        handleAITurn();
      }, 1000);
    }
  }, [isTestMode, userId, gameState, currentState]);

  // ランダムなお題を選択
  const selectRandomTopic = () => {
    const randomIndex = Math.floor(Math.random() * TOPICS.length);
    setCurrentTopic(TOPICS[randomIndex]);
    setCanvasTitle(`お題: ${TOPICS[randomIndex]}`);

    // 最初のターンはユーザー
    setTimeout(() => {
      setGameState("user_turn");
      setTurnMessage(`${userId}さんの番です。アイデアを付箋に書いてください。`);
    }, 1000);
  };

  // ユーザーのターンを開始
  const startUserTurn = () => {
    setGameState("user_turn");
    setTurnMessage(`${userId}さんの番です。アイデアを付箋に書いてください。`);
  };

  // ユーザーのターンを終了
  const endUserTurn = () => {
    console.log("endUserTurn called - 付箋数チェック開始");
    
    // 付箋の数を確認
    const userNotes = countUserNotes();
    const notesWithContent = countNotesWithContent();
    
    console.log(`付箋数チェック - 総数: ${userNotes}, 内容あり: ${notesWithContent}`);
    
    // 付箋がない場合はターン終了不可
    if (userNotes === 0) {
      console.error("ターン終了エラー: 付箋が追加されていません");
      return;
    }
    
    // 内容のある付箋がない場合はターン終了不可
    if (notesWithContent === 0) {
      console.error("ターン終了エラー: 付箋に内容が入力されていません");
      return;
    }
    
    const newUserTurnCount = userTurnCount + 1;
    setUserTurnCount(newUserTurnCount);
    setTurnCount(turnCount + 1);
    
    // ユーザーが3回終了したら、次のセッションへ
    if (newUserTurnCount >= 3) {
      // すぐに移行中状態に変更して入力を防止
      setGameState("transitioning");
      
      // 完了メッセージを表示
      setTurnMessage(`素晴らしい！3つのアイデアを出していただきありがとうございます。次のセッションに移ります...`);
      
      console.log("セッション完了: 3ターン終了");
      console.log("現在のセッション:", currentState);
      
      // 3回終了したので、セッションを完了して次へ
      setTimeout(() => {
        console.log("次のセッションへ移行します");
        
        // 保存してからセッション移行
        if (onSaveNotes) {
          console.log("ノートを保存中...");
          onSaveNotes([]);
        }
        
        // 現在のセッションに応じて次のステップへ
        let nextState = "";
        
        if (isTestMode) {
          // テストモードの場合はセッション1へ
          console.log("テストモードからセッション1へ移行");
          nextState = 'session1';
        } else if (currentState === "session1") {
          // セッション1の場合はセッション2へ
          console.log("セッション1からセッション2へ移行");
          nextState = 'session2';
        } else if (currentState === "session2") {
          // セッション2の場合はサーベイへ
          console.log("セッション2からサーベイへ移行");
          nextState = 'survey';
        }
        
        // 最初にキャンバスとセッション状態をリセット
        console.log("キャンバスをクリアして状態をリセット");
        // キャンバスをクリア
        clearCanvas();
        // メッセージと状態をリセット
        resetSessionState();
        
        // リセット後に次のセッションへ遷移
        setTimeout(() => {
          console.log(`次のセッション(${nextState})へ遷移します`);
          goToState(nextState);
          
          // セッション2に遷移した場合、少し遅らせてからセットアップを開始
          if (nextState === 'session1' || nextState === 'session2') {
            setTimeout(() => {
              console.log("新しいセッションのセットアップを開始");
              // 新しいセッションで最初のステップを開始
              setUserIdAndContinue();
            }, 500);
          }
        }, 500);
        
      }, 3000);  // 3秒後に移行処理を実行
      
      return;
    }
    
    // 通常のターン切り替え
    setGameState("ai_turn");
    setTurnMessage("AIの番です。AIがアイデアを考えています...");

    // AIのターン処理
    setTimeout(() => {
      handleAITurn();
    }, 1500);
  };

  // AIのターン処理
  const handleAITurn = async () => {
    console.log("AIターン処理開始");
    setIsAILoading(true);

    try {
      // バックエンドとの通信をシミュレート
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // シナリオに合わせて常に3つの付箋を生成する
      const numNotes = 3;
      console.log(`AIが${numNotes}つのノートを生成します、お題: ${currentTopic}`);

      for (let i = 0; i < numNotes; i++) {
        // 現在のお題に関連するコンテンツを選択
        let content = "AIのアイデア";
        if (AI_GENERATED_CONTENTS[currentTopic as keyof typeof AI_GENERATED_CONTENTS]) {
          const contentArray = AI_GENERATED_CONTENTS[currentTopic as keyof typeof AI_GENERATED_CONTENTS];
          const contentIndex = Math.floor(Math.random() * contentArray.length);
          content = contentArray[contentIndex];
        }

        // コンテンツに基づいて色を選択
        let color = "blue"; // デフォルト色
        for (const [category, categoryColor] of Object.entries(AI_COLOR_GROUPS)) {
          if (content.includes(category)) {
            color = categoryColor;
            break;
          }
        }
        
        // 付箋を追加
        console.log(`AI付箋を追加 #${i+1}:`, { content: content.substring(0, 20) + "...", color });
        addAiNote(content, color);
      }
    } catch (error) {
      console.error("AIターンエラー:", error);
    } finally {
      setIsAILoading(false);
      
      // AIのターンカウントを更新
      const newAiTurnCount = aiTurnCount + 1;
      setAiTurnCount(newAiTurnCount);
      setTurnCount(turnCount + 1);
      
      console.log("AIターン完了、ユーザーターンに切り替えます", { aiTurnCount: newAiTurnCount });
      
      // AIが3回終了したら、次のセッションへの準備は行わず、ユーザーのターンに戻す
      setGameState("user_turn");
      setTurnMessage(`${userId}さんの番です。3つのアイデアを付箋に書いてください。`);
    }
  };

  // IDを設定してゲームを続行
  const setUserIdAndContinue = (explicitUserId?: string) => {
    // 引数で渡されたIDか、状態のIDを使用
    const effectiveUserId = explicitUserId || userId;
    
    if (effectiveUserId) {
      console.log("setUserIdAndContinue - ユーザーID設定済み、ゲームを開始します:", effectiveUserId);
      
      // ランダムなトピックを選択
      const randomIndex = Math.floor(Math.random() * TOPICS.length);
      const selectedTopic = TOPICS[randomIndex];
      setCurrentTopic(selectedTopic);
      setCanvasTitle(`お題: ${selectedTopic}`);
      
      // トピック選択後、AIターンを自動的に開始
      setGameState("ai_turn");
      setTurnMessage("AIの番です。AIがアイデアを生成しています...");
      
      // 確実に状態が更新された後でAIターンを開始するため、少し遅延を入れる
      setTimeout(() => {
        console.log("AIターンを開始します", { userId: effectiveUserId, gameState: "ai_turn", currentTopic: selectedTopic });
        handleAITurn();
      }, 1000);
    } else {
      console.error("ユーザーIDが設定されていません。ターン開始できません");
    }
  };

  // セッション状態をリセット
  const resetSessionState = () => {
    setTurnCount(0);
    setAiTurnCount(0);
    setUserTurnCount(0);
    setGameState("idle");
    setTurnMessage("");
    setCurrentTopic("");
    
    // セッションに応じたタイトルを設定
    if (isTestMode) {
      setCanvasTitle("テストセッション");
    } else if (currentState === "session1") {
      setCanvasTitle("本番セッション1");
    } else if (currentState === "session2") {
      setCanvasTitle("本番セッション2");
    } else {
      setCanvasTitle("ブレインストーミングセッション");
    }
    
    console.log("セッション状態をリセットしました:", currentState);
  };

  return {
    gameState,
    turnCount,
    aiTurnCount,
    userTurnCount,
    turnMessage,
    currentTopic,
    canvasTitle,
    isAILoading,
    startUserTurn,
    endUserTurn,
    handleAITurn,
    setUserIdAndContinue,
    resetSessionState,
    setCanvasTitle
  };
} 