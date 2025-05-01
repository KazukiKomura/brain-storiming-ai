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
import { notesApi } from "@/lib/api"
import { useSession } from "@/lib/session-context"

// 付箋のタイプ定義
export type Note = {
  id: string
  content: string
  position: { x: number; y: number }
  color: string
  zIndex: number
  gridPosition?: { row: number; col: number } // グリッドでの位置を追加
  finishEditing?: boolean // 編集終了フラグを追加
  creator?: 'ai' | 'user' // 作成者情報を追加
}

// 利用可能な付箋の色
export const COLORS = {
  yellow: "bg-yellow-200 hover:bg-yellow-300",
  orange: "bg-orange-200 hover:bg-orange-300",
  red: "bg-red-200 hover:bg-red-300",
  pink: "bg-pink-200 hover:bg-pink-300",
  green: "bg-green-200 hover:bg-green-300",
  teal: "bg-teal-200 hover:bg-teal-300",
  blue: "bg-blue-200 hover:bg-blue-300",
  indigo: "bg-indigo-200 hover:bg-indigo-300",
  purple: "bg-purple-200 hover:bg-purple-300",
  white: "bg-white hover:bg-gray-100",
}

// 色ごとの列を定義
export const COLOR_COLUMNS = {
  yellow: 0,
  orange: 1,
  red: 2,
  pink: 3,
  green: 4,
  teal: 5,
  blue: 6,
  indigo: 7,
  purple: 8,
  white: 9,
}

// グリッドのサイズ
const GRID_SIZE = 180; // グリッドサイズを1.5倍に（120px→180px）
const GRID_COLS = 15; // 列数
const GRID_ROWS = 20; // 行数を15から20に増やす
export const NOTE_SIZE = 150; // 付箋のサイズを1.5倍に（100px→150px）

// 色とグリッド列の関係を再定義（各列に色を割り当て）
export const GRID_COLORS: Record<number, string> = {
  0: "yellow",
  1: "orange", 
  2: "red",
  3: "pink",
  4: "green",
  5: "teal",
  6: "blue",
  7: "indigo",
  8: "purple",
  9: "white",
  10: "yellow",
  11: "orange",
  12: "green",
  13: "blue",
  14: "purple",
};

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
  環境: "teal",
  教育: "purple",
  健康: "white",
  政治: "red",
  文化: "pink",
  科学: "indigo",
  生活: "orange",
}

// ゲームの状態を表す型
type GameState = "idle" | "waiting_for_id" | "topic_selection" | "user_turn" | "ai_turn" | "transitioning"

// プロパティタイプの定義を更新
interface CollaborativeCanvasProps {
  isTestMode?: boolean;
  onSaveNotes?: (notes: Note[]) => void;
  currentState?: 'initial' | 'video' | 'test' | 'session1' | 'session2' | 'survey';
}

export default function CollaborativeCanvas({ isTestMode = false, onSaveNotes, currentState = 'session1' }: CollaborativeCanvasProps) {
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
  const [aiTurnCount, setAiTurnCount] = useState<number>(0)
  const [userTurnCount, setUserTurnCount] = useState<number>(0)
  const [gridCells, setGridCells] = useState<Array<Array<boolean>>>(
    Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(false))
  ) // グリッドのセルの占有状態を管理
  const [viewportInfo, setViewportInfo] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    totalWidth: GRID_COLS * GRID_SIZE,
    totalHeight: GRID_ROWS * GRID_SIZE
  })
  const canvasRef = useRef<HTMLDivElement>(null)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const userIdInputRef = useRef<HTMLInputElement>(null)
  
  // useSessionフックを使用して、goToState関数を取得
  const { goToState } = useSession()

  // セッションタイプに応じたデフォルトのタイトル設定
  useEffect(() => {
    if (isTestMode) {
      setCanvasTitle("テストセッション");
    } else {
      setCanvasTitle("ブレインストーミングセッション");
      
      // テストモードでなければ（本番セッションなら）自動的にAIターンを開始
      if (gameState === "idle") {
        // ユーザーIDが設定済みであれば自動的にAIターンに移行
        if (userId) {
          setGameState("ai_turn");
          setTurnMessage("AIの番です。AIがアイデアを生成しています...");
          setTimeout(() => {
            handleAITurn();
          }, 1000);
        }
        // IDが設定されていなければID入力ダイアログを表示
        else {
          setIsIdDialogOpen(true);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTestMode, userId, gameState]);

  // ノートが変更されたときの処理
  useEffect(() => {
    if (notes.length > 0 && onSaveNotes) {
      // 変更の度に保存するのではなく、デバウンスするか定期的に保存
      const saveTimeout = setTimeout(() => {
        onSaveNotes(notes);
      }, 3000); // 3秒後に保存
      
      return () => clearTimeout(saveTimeout);
    }
  }, [notes, onSaveNotes]);

  // ビューポート情報の更新
  const updateViewportInfo = () => {
    if (canvasWrapperRef.current && canvasRef.current) {
      const wrapper = canvasWrapperRef.current
      const canvas = canvasRef.current
      
      setViewportInfo({
        x: wrapper.scrollLeft,
        y: wrapper.scrollTop,
        width: wrapper.clientWidth,
        height: wrapper.clientHeight,
        totalWidth: canvas.scrollWidth,
        totalHeight: canvas.scrollHeight
      })
    }
  }

  // スクロール時にビューポート情報更新
  useEffect(() => {
    const wrapper = canvasWrapperRef.current
    if (wrapper) {
      wrapper.addEventListener('scroll', updateViewportInfo)
      window.addEventListener('resize', updateViewportInfo)
      
      // 初期更新
      updateViewportInfo()
      
      return () => {
        wrapper.removeEventListener('scroll', updateViewportInfo)
        window.removeEventListener('resize', updateViewportInfo)
      }
    }
  }, [])
  
  // 指定した位置にスクロール
  const scrollToPosition = (x: number, y: number) => {
    if (canvasWrapperRef.current) {
      canvasWrapperRef.current.scrollTo({
        left: x,
        top: y,
        behavior: 'smooth'
      })
    }
  }

  // ミニマップでのクリック処理
  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // ミニマップの矩形情報を取得
    const minimap = e.currentTarget.getBoundingClientRect();
    
    // ミニマップ内でのクリック位置（相対位置、0-1の割合）
    const relativeX = (e.clientX - minimap.left) / minimap.width;
    const relativeY = (e.clientY - minimap.top) / minimap.height;
    
    // デバッグ情報
    console.log(`Minimap: click at client (${e.clientX}, ${e.clientY}), minimap rect (${minimap.left}, ${minimap.top}, ${minimap.width}, ${minimap.height})`);
    console.log(`Minimap: relative position (${relativeX.toFixed(4)}, ${relativeY.toFixed(4)})`);
    
    // グリッド座標を直接計算 - ミニマップの相対位置からグリッド位置を計算
    const gridCol = Math.min(Math.floor(relativeX * GRID_COLS), GRID_COLS - 1);
    const gridRow = Math.min(Math.floor(relativeY * GRID_ROWS), GRID_ROWS - 1);
    
    console.log(`Minimap: target grid cell (${gridRow}, ${gridCol})`);
    
    // グリッド座標からキャンバス上の絶対座標を計算（スクロール用）
    const canvasX = gridCol * GRID_SIZE;
    const canvasY = gridRow * GRID_SIZE;
    
    console.log(`Minimap: target canvas position (${canvasX}, ${canvasY})`);
    
    // ビューポートの中央にグリッドセルが表示されるようにスクロール
    const targetX = Math.max(0, canvasX - (viewportInfo.width / 2) + (GRID_SIZE / 2));
    const targetY = Math.max(0, canvasY - (viewportInfo.height / 2) + (GRID_SIZE / 2));
    
    console.log(`Minimap: scrolling to (${targetX}, ${targetY})`);
    
    // スクロール位置を設定
    scrollToPosition(targetX, targetY);
    
    // ミニマップクリックではノートを生成せず、ここで終了する
    return;
  }

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
      
      // トピック選択後、AIターンを自動的に開始
      setTimeout(() => {
        setGameState("ai_turn")
        setTurnMessage("AIの番です。AIがアイデアを生成しています...")
        setTimeout(() => {
          handleAITurn()
        }, 1000)
      }, 1500)
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
          onSaveNotes(notes);
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
        document.dispatchEvent(new CustomEvent('clearCanvas'));
        // メッセージと状態をリセット
        document.dispatchEvent(new CustomEvent('resetSessionState'));
        
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

    // AIのターンをシミュレート
    setTimeout(() => {
      handleAITurn();
    }, 1500);
  }

  // AIのターン処理
  const handleAITurn = async () => {
    setIsAILoading(true);

    try {
      // バックエンドとの通信をシミュレート
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (canvasRef.current) {
        // シナリオに合わせて常に3つの付箋を生成する
        const numNotes = 3;
        const newNotes: Note[] = [];

        // グリッドの左上を優先するために行と列のインデックスを準備
        const allRows = Array.from({ length: GRID_ROWS }, (_, i) => i);
        const allCols = Array.from({ length: GRID_COLS }, (_, i) => i);

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
          
          // 空いているセルを探す - 左上から優先的に探索
          let foundCell = false;
          
          // 色に対応する列を見つける
          const possibleCols = Object.entries(GRID_COLORS)
            .filter(([_, colorName]) => colorName === color)
            .map(([colIndex]) => parseInt(colIndex));
          
          if (possibleCols.length === 0) continue;
          
          // まず左上のセルを優先的に確認
          // 行は0から順に (上から下へ)
          for (let row = 0; row < GRID_ROWS && !foundCell; row++) {
            // 優先的に左側の列から探索
            for (let colIdx = 0; colIdx < possibleCols.length && !foundCell; colIdx++) {
              const col = possibleCols[colIdx];
              
              // セルが空いているかチェック
              if (!gridCells[row][col]) {
                foundCell = true;
                
                // 実際の座標を計算（グリッドのセルの中央に配置）
                const posX = col * GRID_SIZE + (GRID_SIZE - NOTE_SIZE) / 2;
                const posY = row * GRID_SIZE + (GRID_SIZE - NOTE_SIZE) / 2;

                newNotes.push({
                  id: `ai-${Date.now()}-${i}`,
                  content,
                  position: { x: posX, y: posY },
                  color,
                  zIndex: highestZIndex + i + 1,
                  gridPosition: { row, col },
                  creator: 'ai'
                });

                // グリッドの占有状態を更新
                const newGridCells = [...gridCells];
                newGridCells[row][col] = true;
                setGridCells(newGridCells);
                
                break; // 空きセルが見つかったらこの列の探索を終了
              }
            }
            if (foundCell) break; // 空きセルが見つかったら行の探索も終了
          }
          
          // それでも見つからない場合のバックアップとして、他の空きセルも探す
          if (!foundCell) {
            // 残りのどこかに空きがあるか試行
            for (let row = 0; row < GRID_ROWS && !foundCell; row++) {
              for (let col = 0; col < GRID_COLS && !foundCell; col++) {
                // 対応する色の列かチェック
                if (!possibleCols.includes(col)) continue;
                
                // セルが空いているかチェック
                if (!gridCells[row][col]) {
                  foundCell = true;
                  
                  // 実際の座標を計算
                  const posX = col * GRID_SIZE + (GRID_SIZE - NOTE_SIZE) / 2;
                  const posY = row * GRID_SIZE + (GRID_SIZE - NOTE_SIZE) / 2;

                  newNotes.push({
                    id: `ai-${Date.now()}-${i}`,
                    content,
                    position: { x: posX, y: posY },
                    color,
                    zIndex: highestZIndex + i + 1,
                    gridPosition: { row, col },
                    creator: 'ai'
                  });

                  // グリッドの占有状態を更新
                  const newGridCells = [...gridCells];
                  newGridCells[row][col] = true;
                  setGridCells(newGridCells);
                  break;
                }
              }
              if (foundCell) break;
            }
          }
        }

        setNotes([...notes, ...newNotes]);
        setHighestZIndex(highestZIndex + newNotes.length);
      }
    } catch (error) {
      console.error("AIターンエラー:", error);
    } finally {
      setIsAILoading(false);
      
      // AIのターンカウントを更新
      const newAiTurnCount = aiTurnCount + 1;
      setAiTurnCount(newAiTurnCount);
      setTurnCount(turnCount + 1);
      
      // AIが3回終了したら、次のセッションへの準備は行わず、ユーザーのターンに戻す
      setGameState("user_turn");
      setTurnMessage(`${userId}さんの番です。3つのアイデアを付箋に書いてください。`);
    }
  }

  // キャンバス上のクリックイベント処理
  const addNote = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    // ユーザーターンでない場合は処理しない
    if ((gameState !== "user_turn" && !isTestMode) || gameState === "transitioning") {
      console.log("現在はユーザーのターンではないため、付箋を追加できません");
      return;
    }

    // イベントがキャンバスから直接発生したことを確認
    if (e.currentTarget !== canvasRef.current) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;

    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // キャンバス要素の左上からの相対座標を計算 (scroll は getBoundingClientRect に含まれるため不要)
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // デバッグ情報
    console.log('--- addNote start ---');
    console.log('raw click', { clientX, clientY });
    console.log('canvas rect', rect);
    console.log('calc relative inside canvas', { x, y });

    const gridRow = Math.floor(y / GRID_SIZE);
    const gridCol = Math.floor(x / GRID_SIZE);

    console.log('grid cell', { row: gridRow, col: gridCol });

    // グリッド範囲チェックとノート追加ロジック (変更なし)
    if (gridRow >= 0 && gridRow < GRID_ROWS && gridCol >= 0 && gridCol < GRID_COLS) {
      if (!gridCells[gridRow][gridCol]) {
        const colorForColumn = GRID_COLORS[gridCol];
        const posX = gridCol * GRID_SIZE + (GRID_SIZE - NOTE_SIZE) / 2;
        const posY = gridRow * GRID_SIZE + (GRID_SIZE - NOTE_SIZE) / 2;

        const newNote: Note = {
          id: `user-${Date.now()}`,
          content: "",
          position: { x: posX, y: posY },
          color: colorForColumn,
          zIndex: highestZIndex + 1,
          gridPosition: { row: gridRow, col: gridCol },
          creator: 'user'
        };

        const newGridCells = [...gridCells];
        newGridCells[gridRow][gridCol] = true;
        setGridCells(newGridCells);
        setSelectedColor(colorForColumn);
        setNotes([...notes, newNote]);
        setHighestZIndex(highestZIndex + 1);
      } else {
        console.log(`Grid cell (${gridRow}, ${gridCol}) is already occupied.`);
      }
    } else {
      console.log(`Click (${gridRow}, ${gridCol}) is outside the grid boundaries.`);
    }
  };

  // 付箋を更新する関数
  const updateNote = (id: string, updates: Partial<Note>) => {
    // 位置が更新される場合、グリッドの占有状態も更新
    if (updates.gridPosition) {
      const noteToUpdate = notes.find(note => note.id === id)
      if (noteToUpdate && noteToUpdate.gridPosition) {
        // 古い位置の占有状態をクリア
        const newGridCells = [...gridCells]
        newGridCells[noteToUpdate.gridPosition.row][noteToUpdate.gridPosition.col] = false
        
        // 新しい位置を占有中に設定
        newGridCells[updates.gridPosition.row][updates.gridPosition.col] = true
        setGridCells(newGridCells)
      }
    }
    
    // 編集終了フラグがある場合のみ、コンテンツをバックエンドに保存
    if (updates.finishEditing && updates.content !== undefined) {
      // ユーザーが作成した付箋のみを保存対象とする
      if (id.startsWith('user-')) {
        // 非同期で保存処理を行う
        (async () => {
          try {
            // 付箋の現在の情報を取得
            const noteToUpdate = notes.find(note => note.id === id);
            // グリッド位置情報があれば一緒に保存
            const gridPosition = noteToUpdate?.gridPosition;
            
            // 全ての付箋情報（編集されたものを含む）を準備
            const updatedNotes = notes.map(note => 
              note.id === id 
                ? { 
                    ...note, 
                    content: updates.content, 
                    ...(updates.gridPosition && { gridPosition: updates.gridPosition }) 
                  }
                : note
            );
            
            // 必要な情報だけを含む配列を作成
            const allNotesData = updatedNotes.map(note => ({
              id: note.id,
              content: note.content,
              gridPosition: note.gridPosition,
              creator: note.creator || (note.id.startsWith('ai-') ? 'ai' : 'user')
            }));
            
            // デバッグログを追加
            console.log('保存する付箋データ:', {
              id,
              content: updates.content,
              gridPosition,
              allNotesDataLength: allNotesData.length
            });
            
            // 単一の付箋の更新と全ての付箋情報を一緒に送信
            await notesApi.saveNoteContent(id, updates.content, gridPosition, allNotesData, 'user');
            console.log(`付箋 ${id} の内容と全ての付箋情報を保存しました`);
          } catch (error) {
            console.error('付箋内容保存エラー:', error);
          }
        })();
      }
    }

    setNotes(notes.map((note) => (note.id === id ? { ...note, ...updates, zIndex: highestZIndex + 1 } : note)))
    setHighestZIndex(highestZIndex + 1)
  }

  // 付箋を削除する関数
  const deleteNote = (id: string) => {
    const noteToDelete = notes.find(note => note.id === id)
    if (noteToDelete && noteToDelete.gridPosition) {
      // グリッドの占有状態を更新
      const newGridCells = [...gridCells]
      newGridCells[noteToDelete.gridPosition.row][noteToDelete.gridPosition.col] = false
      setGridCells(newGridCells)
    }
    
    setNotes(notes.filter((note) => note.id !== id))
  }

  // キャンバスをクリアする関数
  const clearCanvas = () => {
    if (confirm("すべての付箋を削除してもよろしいですか？")) {
      setNotes([])
      // グリッドセルの占有状態をリセット
      setGridCells(Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(false)))
    }
  }
  
  // 確認なしでキャンバスをクリアする関数
  const clearCanvasWithoutConfirm = () => {
    setNotes([])
    // グリッドセルの占有状態をリセット
    setGridCells(Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(false)))
  }

  // キャンバスを画像として保存する関数
  const saveAsImage = async () => {
    // 削除されました
  }

  // タッチデバイスの検出
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0)
  }, [])

  // 付箋をレンダリングする前に、縦方向のコネクション（ヒモ）をレンダリングする関数を作成
  const renderNoteConnections = () => {
    const connections: React.ReactNode[] = [];
    
    // 列ごとに付箋を整理
    const notesByColumn: Record<number, Note[]> = {};
    
    notes.forEach(note => {
      if (note.gridPosition) {
        const col = note.gridPosition.col;
        if (!notesByColumn[col]) {
          notesByColumn[col] = [];
        }
        notesByColumn[col].push(note);
      }
    });
    
    // 各列ごとに、行で並べ替えて縦方向のコネクションを作成
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
              COLORS[currentNote.color as keyof typeof COLORS].split(' ')[0].replace('bg-', 'border-');
            
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

  // 色ボタンでの付箋追加処理
  const handleColorButtonClick = (colorName: string) => {
    // ユーザーターンでない場合は処理しない
    if ((gameState !== "user_turn" && !isTestMode) || gameState === "transitioning") {
      console.log("現在はユーザーのターンではないため、付箋を追加できません");
      return;
    }

    setSelectedColor(colorName);
    // 最初の空きセルを探す
    const col = COLOR_COLUMNS[colorName as keyof typeof COLOR_COLUMNS];
    let row = -1;
    for (let r = 0; r < GRID_ROWS; r++) {
      if (!gridCells[r][col]) {
        row = r;
        break;
      }
    }
    
    // 空きセルがあれば付箋を追加
    if (row !== -1 && canvasRef.current) {
      const posX = col * GRID_SIZE + (GRID_SIZE - NOTE_SIZE) / 2;
      const posY = row * GRID_SIZE + (GRID_SIZE - NOTE_SIZE) / 2;
      
      const newNote: Note = {
        id: `user-${Date.now()}`,
        content: "",
        position: { x: posX, y: posY },
        color: colorName,
        zIndex: highestZIndex + 1,
        gridPosition: { row, col },
        creator: 'user'
      };
      
      // グリッドの占有状態を更新
      const newGridCells = [...gridCells];
      newGridCells[row][col] = true;
      setGridCells(newGridCells);
      
      setNotes([...notes, newNote]);
      setHighestZIndex(highestZIndex + 1);
    }
  };

  // キャンバスをクリアするイベントリスナー
  useEffect(() => {
    const handleClearCanvasEvent = () => {
      clearCanvasWithoutConfirm();
    };
    
    document.addEventListener('clearCanvas', handleClearCanvasEvent);
    
    return () => {
      document.removeEventListener('clearCanvas', handleClearCanvasEvent);
    };
  }, []);

  // セッション状態をリセットするイベントリスナー
  useEffect(() => {
    const handleResetSessionStateEvent = () => {
      // 付箋とグリッド状態はclearCanvasイベントでリセットされるので、
      // その他の状態をここでリセット
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
    
    document.addEventListener('resetSessionState', handleResetSessionStateEvent);
    
    return () => {
      document.removeEventListener('resetSessionState', handleResetSessionStateEvent);
    };
  }, [isTestMode, currentState]);

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
      {!isTestMode && (
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
                className="text-xl font-bold"
              >
                {canvasTitle}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            {gameState === "idle" ? (
              <>
                {/* 色ボタン - 付箋追加用 - 削除 */}
              </>
            ) : (
              <>
                {/* ゲームモード時の色ボタン */}
                <div className="flex items-center gap-1 mr-2">
                  {Object.entries(COLORS).map(([colorName, colorClass]) => {
                    const baseColorClass = typeof colorClass === "string" ? colorClass.split(" ")[0] : ""
                    return (
                      <Button
                        key={colorName}
                        variant="ghost"
                        size="icon"
                        className={`w-6 h-6 rounded-full p-0 border-2 ${baseColorClass} ${
                          selectedColor === colorName ? "border-white" : "border-transparent"
                        }`}
                        onClick={() => {
                          handleColorButtonClick(colorName)
                        }}
                        title={`${colorName}の付箋を選択`}
                        disabled={gameState !== "user_turn"}
                      />
                    )
                  })}
                </div>

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
      )}

      {/* ターン表示 */}
      {!isTestMode && gameState !== "idle" && (
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
      )}

      {/* ターンメッセージ */}
      {!isTestMode && turnMessage && (
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

      {/* 付箋コントロールバー - シンプル化 */}
      <div className="bg-white border-b p-2 flex flex-wrap items-center">
        {/* 付箋追加コントロール */}
        <div className="flex items-center">
          <span className="mr-2 text-gray-700 text-sm">付箋を追加:</span>
          <div className="flex space-x-1">
            {Object.entries(COLORS).map(([colorName, colorClass]) => {
              const baseColorClass = typeof colorClass === "string" ? colorClass.split(" ")[0] : "";
              return (
                <button
                  key={colorName}
                  className={`w-6 h-6 rounded-full border-2 ${baseColorClass} ${
                    selectedColor === colorName ? "border-black" : "border-transparent"
                  }`}
                  onClick={() => {
                    handleColorButtonClick(colorName);
                  }}
                  title={`${colorName}の付箋を追加`}
                ></button>
              );
            })}
          </div>
        </div>
        
        {/* 他のコントロール - 全て削除 */}
        <div className="ml-auto flex items-center gap-2">
          {gameState === "user_turn" && (
            <button
              className="px-2 py-1 text-xs border rounded bg-green-500 hover:bg-green-600 text-white"
              onClick={endUserTurn}
              disabled={isAILoading}
            >
              アイデアを確定する
            </button>
          )}
        </div>
      </div>
      
      {/* キャンバス */}
      <div 
        ref={canvasWrapperRef}
        className="flex-1 relative overflow-auto"
        style={{ touchAction: "auto" }}
      >
        <div
          ref={canvasRef}
          className="relative bg-gray-100"
          onClick={addNote}
          onTouchStart={isTouchDevice ? addNote : undefined}
          style={{ 
            width: `${GRID_COLS * GRID_SIZE}px`, 
            height: `${GRID_ROWS * GRID_SIZE}px` 
          }}
        >
          {/* グリッドの表示 */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {/* グリッドの線 */}
            {Array(GRID_ROWS).fill(0).map((_, row) => (
              <div key={`row-${row}`} className="flex">
                {Array(GRID_COLS).fill(0).map((_, col) => {
                  const cellColor = GRID_COLORS[col]
                  const colorClass = COLORS[cellColor as keyof typeof COLORS].split(' ')[0]
                  
                  return (
                    <div
                      key={`cell-${row}-${col}`}
                      className={`border border-gray-200 ${
                        gridCells[row][col] ? 'opacity-20' : 'opacity-10'
                      } ${colorClass}`}
                      style={{
                        width: `${GRID_SIZE}px`,
                        height: `${GRID_SIZE}px`
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          
          {/* 付箋同士のコネクション（ヒモ）を表示 */}
          {renderNoteConnections()}
          
          {notes.map((note) => (
            <StickyNote key={note.id} note={note} updateNote={updateNote} deleteNote={deleteNote} colors={COLORS} />
          ))}
        </div>
      </div>

      {/* ミニマップ */}
      <div className="absolute bottom-4 right-4 w-48 h-36 bg-white shadow-lg rounded-md p-1 border border-gray-300 z-50">
        <div 
          className="w-full h-full relative cursor-pointer" 
          style={{ 
            backgroundColor: '#f3f4f6',
            border: '1px solid #e5e7eb'
          }}
          onClick={handleMinimapClick}
        >
          {/* ミニマップ上のノート表示 */}
          {notes.map((note) => (
            <div 
              key={`minimap-${note.id}`}
              className="absolute rounded-sm"
              style={{
                left: `${(note.position.x / viewportInfo.totalWidth) * 100}%`,
                top: `${(note.position.y / viewportInfo.totalHeight) * 100}%`,
                width: '4px',
                height: '4px',
                backgroundColor: Object.entries(COLORS).find(([color]) => color === note.color)?.[1].split(' ')[0].replace('bg-', '')
              }}
            />
          ))}
          
          {/* 表示範囲を示す枠 - より詳細な表示 */}
          <div 
            className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-30 pointer-events-none"
            style={{
              left: `${(viewportInfo.x / viewportInfo.totalWidth) * 100}%`,
              top: `${(viewportInfo.y / viewportInfo.totalHeight) * 100}%`,
              width: `${Math.min((viewportInfo.width / viewportInfo.totalWidth) * 100, 100)}%`,
              height: `${Math.min((viewportInfo.height / viewportInfo.totalHeight) * 100, 100)}%`,
            }}
          />
          
          {/* グリッド線の表示 */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {Array(GRID_ROWS).fill(0).map((_, row) => (
              <div 
                key={`minimap-row-${row}`}
                className="absolute border-t border-gray-300 w-full"
                style={{ top: `${(row * GRID_SIZE / viewportInfo.totalHeight) * 100}%` }}
              />
            ))}
            {Array(GRID_COLS).fill(0).map((_, col) => (
              <div 
                key={`minimap-col-${col}`}
                className="absolute border-l border-gray-300 h-full"
                style={{ 
                  left: `${(col * GRID_SIZE / viewportInfo.totalWidth) * 100}%`,
                  backgroundColor: `rgba(${Object.entries(COLORS).find(([color]) => color === GRID_COLORS[col])?.[1].split(' ')[0].replace('bg-', '')}, 0.1)` 
                }}
              />
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-white text-xs p-1 rounded-full shadow border border-gray-200">
          {Math.round((viewportInfo.width / viewportInfo.totalWidth) * 100)}%
        </div>
      </div>
    </div>
  )
}

