"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useSession } from '@/lib/session-context';
import { GameState } from '@/types/session';
import { Note, NoteColor, COLORS, COLOR_COLUMNS, GRID_SIZE, NOTE_SIZE, GRID_ROWS, GRID_COLS, GRID_COLORS } from '@/types/notes';
import StickyNote from '@/components/sticky-note';
import SessionHeader from './SessionHeader';
import TurnIndicator from './TurnIndicator';
import ColorPalette from './ColorPalette';
import Minimap from './Minimap';
import { useTurns } from '@/hooks/useTurns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CollaborativeCanvasProps {
  isTestMode?: boolean;
  onSaveNotes?: (notes: Note[]) => void;
  currentState?: 'initial' | 'video' | 'test' | 'session1' | 'session2' | 'survey';
}

// イベント処理のための型定義
type CanvasClickEvent = { 
  target: EventTarget;
  touches?: { clientX: number; clientY: number }[];
  clientX?: number;
  clientY?: number;
};

export default function Canvas({ 
  isTestMode = false, 
  onSaveNotes, 
  currentState = 'session1' 
}: CollaborativeCanvasProps) {
  const [userId, setUserId] = useState("");
  const [selectedColor, setSelectedColor] = useState("yellow" as NoteColor);
  const [isIdDialogOpen, setIsIdDialogOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [currentTurnNotesCount, setCurrentTurnNotesCount] = useState(0); // 現在のターンの付箋カウンター
  const userIdInputRef = useRef<HTMLInputElement>(null);
  
  // コンテキストからキャンバス操作機能を取得
  const { 
    notes, 
    addNote, 
    updateNote, 
    deleteNote, 
    clearCanvas,
    canvasRef,
    canvasWrapperRef,
    viewportInfo,
    handleMinimapClick,
    forceUpdateViewport
  } = useCanvasContext();
  
  // セッション管理機能を取得
  const { goToState } = useSession();

  // 内容のある付箋の数をカウントする関数
  const countNotesWithContent = () => {
    return notes.filter(note => 
      // ユーザーが作成した付箋で、内容があるものだけをカウント
      note.creator === 'user' && note.content && note.content.trim() !== ''
    ).length;
  };

  // ユーザーが作成した付箋の総数をカウントする関数
  const countUserNotes = () => {
    return notes.filter(note => note.creator === 'user').length;
  };

  // 現在のターンで追加された付箋の数をカウントする関数
  const countCurrentTurnNotes = () => {
    return notes.filter(note => 
      note.creator === 'user' && note.turnId === turns.userTurnCount
    ).length;
  };

  // 現在のターンで内容のある付箋の数をカウントする関数
  const countCurrentTurnNotesWithContent = () => {
    return notes.filter(note => 
      // 現在のターンでユーザーが作成した付箋で、内容があるものだけをカウント
      note.creator === 'user' && 
      note.turnId === turns.userTurnCount && 
      note.content && 
      note.content.trim() !== ''
    ).length;
  };

  // ターン管理機能を取得
  const turns = useTurns({
    isTestMode,
    currentState,
    userId,
    onSaveNotes,
    addAiNote: (content, color) => {
      // AIノート追加ロジックを実装
      console.log("AIノートを追加:", content, color);
      
      // 色に適した空きグリッドセルを探す
      const colorAsNoteColor = color as NoteColor;
      const preferredCol = COLOR_COLUMNS[colorAsNoteColor];
      let gridPosition = null;
      
      // useNotesのfindEmptyGridCellForColorの代わりに直接探索ロジックを実装
      for (let row = 0; row < GRID_ROWS; row++) {
        const foundPosition = addNote(
          { 
            x: preferredCol * GRID_SIZE + (GRID_SIZE - NOTE_SIZE) / 2, 
            y: row * GRID_SIZE + (GRID_SIZE - NOTE_SIZE) / 2 
          }, 
          colorAsNoteColor, 
          'ai',
          { turnId: turns.aiTurnCount }
        );
        
        if (foundPosition) {
          // 成功した場合はノートの内容を設定
          const aiNote = notes.find((note: Note) => note.id === foundPosition.id);
          if (aiNote) {
            updateNote(aiNote.id, { content });
            break;
          }
        }
      }
    },
    clearCanvas: () => clearCanvas(false),
    goToState,
    countUserNotes: countUserNotes,
    countNotesWithContent: countNotesWithContent
  });
  
  // タッチデバイスの検出
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // 付箋数が変更された時またはターン番号が変わった時に現在のターンの付箋カウントを更新
  useEffect(() => {
    const count = countCurrentTurnNotes();
    setCurrentTurnNotesCount(count);
    console.log(`現在のターン(${turns.userTurnCount})の付箋数: ${count}個`);
  }, [notes, turns.userTurnCount]);

  // ターン状態変化の監視
  useEffect(() => {
    console.log("ゲーム状態変更:", turns.gameState);
    if (turns.gameState === "user_turn") {
      console.log(`ユーザーターン(${turns.userTurnCount})開始: カウンターは自動更新されます`);
    }
  }, [turns.gameState, turns.userTurnCount]);

  // 本番セッション開始時の処理
  useEffect(() => {
    console.log("Canvas: セッション状態チェック", { isTestMode, userId, currentState });
    
    // テストモードでなく、ユーザーIDが設定されていない場合はIDダイアログを表示
    if (!isTestMode && !userId) {
      console.log("本番セッション: ユーザーIDが未設定なのでダイアログを表示します");
      // 少し遅延させて確実にダイアログが表示されるようにする
      setTimeout(() => {
        setIsIdDialogOpen(true);
      }, 300);
    }
  }, [isTestMode, userId, currentState]);

  // IDを設定してゲームを続行
  const setUserIdAndContinue = () => {
    if (userIdInputRef.current && userIdInputRef.current.value.trim()) {
      const newUserId = userIdInputRef.current.value.trim();
      console.log("ID設定完了:", newUserId);
      setUserId(newUserId);
      setIsIdDialogOpen(false);
      
      // IDをセットした後、少し遅延してからターン開始
      setTimeout(() => {
        console.log("ユーザーID設定後にターン開始処理を呼び出します");
        // ユーザーIDを明示的に渡す
        turns.setUserIdAndContinue(newUserId);
      }, 500);
    } else {
      console.log("ユーザーIDが入力されていません");
      alert("ユーザーIDを入力してください");
    }
  };

  // カラーパレットでの色選択処理
  const handleColorSelect = (colorName: string) => {
    // 現在のターンですでに3個の付箋を配置済みの場合はアラート表示
    if (!isTestMode && turns.gameState === "user_turn" && countCurrentTurnNotes() >= 3) {
      alert("このターンでは付箋は3個までしか配置できません。既存の付箋を編集するか削除してから追加してください。");
      return;
    }

    setSelectedColor(colorName as NoteColor);
    // 最初の空きセルを探して付箋を追加
    const preferredCol = COLOR_COLUMNS[colorName];
    const gridPosition = findEmptyGridCellForColor(colorName as NoteColor, preferredCol);
    
    if (gridPosition) {
      const posX = gridPosition.col * GRID_SIZE + (GRID_SIZE - NOTE_SIZE) / 2;
      const posY = gridPosition.row * GRID_SIZE + (GRID_SIZE - NOTE_SIZE) / 2;
      
      console.log(`付箋追加: 色=${colorName}, ターン=${turns.userTurnCount}`);
      
      const newNote = addNote(
        { x: posX, y: posY }, 
        colorName as NoteColor, 
        'user',
        { turnId: turns.userTurnCount }
      );
    }
  };

  // 空きグリッドセルを探す関数
  const findEmptyGridCellForColor = (color: NoteColor, preferredCol?: number): { row: number, col: number } | null => {
    // 実装省略 - useNotesフックに移動されています
    return null;
  };
  
  // キャンバス上のクリックイベント処理
  const handleCanvasClick = (e: any) => {
    // ユーザーターンでない場合は処理しない
    if ((turns.gameState !== "user_turn" && !isTestMode) || turns.gameState === "transitioning") {
      console.log("現在はユーザーのターンではないため、付箋を追加できません");
      return;
    }

    // イベントのターゲット要素を使用
    const element = e.target as HTMLElement;
    
    // すでに付箋の上でクリックされた場合は処理しない（付箋の編集を妨げないため）
    const isClickingOnNote = element.closest('.sticky-note') != null;
    if (isClickingOnNote) {
      return;
    }

    // 現在のターンですでに3個の付箋を配置済みの場合はアラート表示
    if (!isTestMode && turns.gameState === "user_turn" && countCurrentTurnNotes() >= 3) {
      alert("このターンでは付箋は3個までしか配置できません。既存の付箋を編集するか削除してから追加してください。");
      return;
    }

    if (!canvasRef.current || !canvasRef.current.contains(element)) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    // タッチイベントとマウスイベントの両方に対応
    if ('touches' in e && e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e && typeof e.clientX === 'number') {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return; // どちらのプロパティも持たない場合は処理しない
    }

    // キャンバス要素の左上からの相対座標を計算
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // デバッグ情報
    console.log('--- addNote start ---');
    console.log('raw click', { clientX, clientY });
    console.log('canvas rect', rect);
    console.log('calc relative inside canvas', { x, y });

    // クリックした位置からグリッドの列と行を計算
    const gridCol = Math.floor(x / GRID_SIZE);
    const gridRow = Math.floor(y / GRID_SIZE);
    
    // 列番号と行番号の範囲をチェック
    if (gridCol >= 0 && gridCol < GRID_COLS && gridRow >= 0 && gridRow < GRID_ROWS) {
      // 列に割り当てられた色を取得
      const colorName = GRID_COLORS[gridCol] as NoteColor;
      
      console.log(`列 ${gridCol} がクリックされました。色: ${colorName}`);
      
      // クリックされた列の色に更新
      setSelectedColor(colorName);
      
      // 付箋を追加 (ギリッド上の配置を考慮)
      const posX = gridCol * GRID_SIZE + (GRID_SIZE - NOTE_SIZE) / 2;
      const posY = gridRow * GRID_SIZE + (GRID_SIZE - NOTE_SIZE) / 2;

      console.log(`付箋追加: 色=${colorName}, ターン=${turns.userTurnCount}`);
      
      const newNote = addNote(
        { x: posX, y: posY }, 
        colorName, 
        'user',
        { turnId: turns.userTurnCount }
      );
    }
  };

  // キャンバスをスクロールしたときにビューポート情報を更新するためのハンドラー
  const handleCanvasScroll = () => {
    // 遅延を入れて実行すると良いケースも
    setTimeout(forceUpdateViewport, 50);
  };

  // 付箋同士のコネクション（ヒモ）をレンダリングする関数
  const renderNoteConnections = () => {
    const connections: any[] = [];
    
    // 列ごとに付箋を整理
    const notesByColumn: Record<number, Note[]> = {};
    
    notes.forEach((note: Note) => {
      if (note.gridPosition) {
        const col = note.gridPosition.col;
        if (!notesByColumn[col]) {
          notesByColumn[col] = [];
        }
        notesByColumn[col].push(note);
      }
    });
    
    // 各列ごとに縦方向のコネクションを作成
    Object.entries(notesByColumn).forEach(([col, colNotes]) => {
      // 行でソート
      const sortedNotes = colNotes.sort((a, b) => {
        if (a.gridPosition && b.gridPosition) {
          return a.gridPosition.row - b.gridPosition.row;
        }
        return 0;
      });
      
      // 色ごとにグループ化
      const notesByColor: Record<string, Note[]> = {};
      sortedNotes.forEach(note => {
        if (!notesByColor[note.color]) {
          notesByColor[note.color] = [];
        }
        notesByColor[note.color].push(note);
      });
      
      // 同じ色の付箋同士をつなぐ
      Object.entries(notesByColor).forEach(([color, colorNotes]) => {
        // 色ごとに行でソート
        const sortedColorNotes = colorNotes.sort((a, b) => {
          if (a.gridPosition && b.gridPosition) {
            return a.gridPosition.row - b.gridPosition.row;
          }
          return 0;
        });
        
        // 同じ色の隣接する付箋をつなぐ
        for (let i = 0; i < sortedColorNotes.length - 1; i++) {
          const currentNote = sortedColorNotes[i];
          const nextNote = sortedColorNotes[i + 1];
          
          if (currentNote.gridPosition && nextNote.gridPosition) {
            // 付箋の中心を計算
            const startX = currentNote.position.x + NOTE_SIZE / 2; // 付箋幅の半分
            const startY = currentNote.position.y + NOTE_SIZE; // 付箋の下端
            const endY = nextNote.position.y; // 付箋の上端
            
            const connectionColor = 
              COLORS[currentNote.color].split(' ')[0].replace('bg-', 'border-');
            
            connections.push(
              <div
                key={`connection-${currentNote.id}-${nextNote.id}`}
                className={`absolute pointer-events-none ${connectionColor}`}
                style={{
                  left: `${startX}px`,
                  top: `${startY}px`,
                  width: '2px',
                  height: `${endY - startY}px`,
                  borderLeft: '2px dashed',
                  transform: 'translateX(-1px)',
                  zIndex: Math.min(currentNote.zIndex, nextNote.zIndex) - 1
                }}
              />
            );
          }
        }
      });
    });
    
    return connections;
  };

  // イベントリスナーのセットアップ
  useEffect(() => {
    // キャンバスクリアイベントリスナー
    const handleClearCanvasEvent = () => {
      clearCanvas(false);
    };
    
    // セッションリセットイベントリスナー
    const handleResetSessionStateEvent = () => {
      turns.resetSessionState();
    };
    
    document.addEventListener('clearCanvas', handleClearCanvasEvent);
    document.addEventListener('resetSessionState', handleResetSessionStateEvent);
    
    return () => {
      document.removeEventListener('clearCanvas', handleClearCanvasEvent);
      document.removeEventListener('resetSessionState', handleResetSessionStateEvent);
    };
  }, [clearCanvas, turns]);

  // ユーザーターン終了時に付箋数をチェック
  const handleEndUserTurn = () => {
    console.log("Canvas: ターン終了処理を開始 - 付箋状況", {
      現在のターンの付箋数: countCurrentTurnNotes(),
      現在のターンの内容あり付箋数: countCurrentTurnNotesWithContent(),
      全体の内容あり付箋数: countNotesWithContent()
    });

    // 現在のターンの内容のある付箋の数をカウント
    const currentTurnNotesWithContent = countCurrentTurnNotesWithContent();
    
    if (currentTurnNotesWithContent === 0) {
      alert("ターンを終了するには、このターンで追加した付箋のうち、少なくとも1つに内容を入力してください。");
      return;
    }
    
    // ターン終了
    turns.endUserTurn();
  };

  // 付箋を削除する処理をオーバーライド
  const handleDeleteNote = (id: string) => {
    console.log("付箋を削除:", id);
    // 削除前に付箋情報を取得
    const noteToDelete = notes.find(note => note.id === id);
    deleteNote(id);
    console.log("付箋削除後のカウント更新", { 
      現在のターンの付箋数: countCurrentTurnNotes(),
      現在のターンの内容あり付箋数: countCurrentTurnNotesWithContent()
    });
  };

  return (
    <div className="flex flex-col h-screen w-full">
      {/* ID入力ダイアログ */}
      <Dialog open={isIdDialogOpen} onOpenChange={(open: boolean) => {
        // ダイアログを閉じようとした場合にIDが設定されていなければ閉じない
        if (!open && !userId) {
          alert("続けるにはIDを入力してください");
          return;
        }
        setIsIdDialogOpen(open);
      }}>
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
      {!isTestMode && (
        <SessionHeader
          title={turns.canvasTitle}
          isTestMode={isTestMode}
          gameState={turns.gameState}
          userId={userId}
          selectedColor={selectedColor}
          onColorSelect={handleColorSelect}
          onEndTurn={handleEndUserTurn}
          isEditable={turns.gameState === "idle"}
          onTitleChange={turns.setCanvasTitle}
        />
      )}

      {/* ターン表示 */}
      {!isTestMode && turns.gameState !== "idle" && (
        <TurnIndicator
          gameState={turns.gameState}
          turnMessage={turns.turnMessage}
          currentTopic={turns.currentTopic}
          userTurnCount={turns.userTurnCount}
          aiTurnCount={turns.aiTurnCount}
          isAILoading={turns.isAILoading}
        />
      )}

      {/* ユーザーターン時の付箋カウント表示 */}
      {!isTestMode && turns.gameState === "user_turn" && (
        <div className="bg-blue-50 px-4 py-2 flex justify-between items-center">
          <span className="text-blue-800">
            このターンの付箋: {currentTurnNotesCount} / 3個
            {currentTurnNotesCount > 0 && (
              <span className="ml-2 text-sm">
                (内容あり: {countCurrentTurnNotesWithContent()} / 必要数: 1)
                {currentTurnNotesCount >= 3 ? (
                  <span className="text-orange-600 ml-2 font-medium">
                    ※このターンの付箋は上限です。編集または削除してください。
                  </span>
                ) : (
                  <span className="text-blue-600 ml-2 font-medium">
                    ※削除すると新しい付箋を追加できます
                  </span>
                )}
              </span>
            )}
          </span>
          <Button 
            onClick={handleEndUserTurn} 
            variant="outline" 
            className="bg-green-500 hover:bg-green-600 text-white"
            disabled={countCurrentTurnNotesWithContent() === 0}
          >
            ターンを終了する
          </Button>
        </div>
      )}

      {/* 付箋コントロールバー */}
      <ColorPalette
        selectedColor={selectedColor}
        onSelectColor={handleColorSelect}
        disabled={(turns.gameState !== "user_turn" && !isTestMode) || countCurrentTurnNotes() >= 3}
      />
      
      {/* キャンバス */}
      <div 
        ref={canvasWrapperRef}
        className="flex-1 relative overflow-auto"
        style={{ touchAction: "auto" }}
        onScroll={handleCanvasScroll}
      >
        <div
          ref={canvasRef}
          className="relative bg-gray-100"
          onClick={handleCanvasClick}
          onTouchStart={isTouchDevice ? handleCanvasClick : undefined}
          style={{ 
            width: `${viewportInfo.totalWidth}px`, 
            height: `${viewportInfo.totalHeight}px` 
          }}
        >
          {/* グリッドの表示 */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {Array(GRID_ROWS).fill(0).map((_, row) => (
              <div key={`row-${row}`} className="flex">
                {Array(GRID_COLS).fill(0).map((_, col) => {
                  // グリッド列に対応する色を取得
                  const cellColorName = GRID_COLORS[col];
                  // 色が無効な場合のフォールバック
                  const colorClass = cellColorName && COLORS[cellColorName as NoteColor] 
                    ? COLORS[cellColorName as NoteColor].split(' ')[0]
                    : 'bg-gray-100';
                  
                  return (
                    <div
                      key={`cell-${row}-${col}`}
                      className={`border border-gray-200 ${colorClass} opacity-10`}
                      style={{
                        width: `${GRID_SIZE}px`,
                        height: `${GRID_SIZE}px`
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          
          {/* 付箋同士のコネクション（ヒモ）を表示 */}
          {renderNoteConnections()}
          
          {notes.map((note: Note) => {
            // 付箋の色を検証し、無効な場合はデフォルト色を使用
            const noteColor = note.color in COLORS ? note.color : 'yellow';
            return (
              <StickyNote 
                key={note.id} 
                note={{...note, color: noteColor }} 
                updateNote={updateNote} 
                deleteNote={handleDeleteNote} 
                colors={COLORS}
                className="sticky-note" 
              />
            );
          })}
        </div>
      </div>

      {/* ミニマップ */}
      <Minimap
        notes={notes}
        viewportInfo={viewportInfo}
        onMinimapClick={handleMinimapClick}
      />
    </div>
  );
} 