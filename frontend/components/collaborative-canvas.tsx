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
import { notesApi } from "@/lib/api"

// 付箋のタイプ定義
export type Note = {
  id: string
  content: string
  position: { x: number; y: number }
  color: string
  zIndex: number
  gridPosition?: { row: number; col: number } // グリッドでの位置を追加
  finishEditing?: boolean // 編集終了フラグを追加
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
const GRID_SIZE = 180; // より大きいセルサイズ（ピクセル）
const GRID_COLS = 15; // 列数
const GRID_ROWS = 15; // 行数

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
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // ミニマップの位置をキャンバス座標に変換
    const ratioX = viewportInfo.totalWidth / rect.width
    const ratioY = viewportInfo.totalHeight / rect.height
    
    const targetX = x * ratioX - (viewportInfo.width / 2)
    const targetY = y * ratioY - (viewportInfo.height / 2)
    
    scrollToPosition(targetX, targetY)
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
        // 1〜2個のランダムな付箋を生成
        const numNotes = Math.floor(Math.random() * 2) + 1
        const newNotes: Note[] = []

        // グリッドの左上を優先するために行と列のインデックスを準備
        const allRows = Array.from({ length: GRID_ROWS }, (_, i) => i);
        const allCols = Array.from({ length: GRID_COLS }, (_, i) => i);

        for (let i = 0; i < numNotes; i++) {
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
          
          // 空いているセルを探す - 左上から優先的に探索
          let foundCell = false;
          
          // 色に対応する列を見つける
          const possibleCols = Object.entries(GRID_COLORS)
            .filter(([_, colorName]) => colorName === color)
            .map(([colIndex]) => parseInt(colIndex))
          
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
                const posX = col * GRID_SIZE + (GRID_SIZE - 150) / 2
                const posY = row * GRID_SIZE + (GRID_SIZE - 150) / 2

                newNotes.push({
                  id: `ai-${Date.now()}-${i}`,
                  content,
                  position: { x: posX, y: posY },
                  color,
                  zIndex: highestZIndex + i + 1,
                  gridPosition: { row, col }
                })

                // グリッドの占有状態を更新
                const newGridCells = [...gridCells]
                newGridCells[row][col] = true
                setGridCells(newGridCells)
                
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
                  const posX = col * GRID_SIZE + (GRID_SIZE - 150) / 2
                  const posY = row * GRID_SIZE + (GRID_SIZE - 150) / 2

                  newNotes.push({
                    id: `ai-${Date.now()}-${i}`,
                    content,
                    position: { x: posX, y: posY },
                    color,
                    zIndex: highestZIndex + i + 1,
                    gridPosition: { row, col }
                  })

                  // グリッドの占有状態を更新
                  const newGridCells = [...gridCells]
                  newGridCells[row][col] = true
                  setGridCells(newGridCells)
                  break;
                }
              }
              if (foundCell) break;
            }
          }
        }

        setNotes([...notes, ...newNotes])
        setHighestZIndex(highestZIndex + newNotes.length)
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
      let clientX, clientY

      if ("touches" in e) {
        // タッチイベントの場合
        const touch = e.touches[0]
        clientX = touch.clientX
        clientY = touch.clientY
      } else {
        // マウスイベントの場合
        clientX = e.clientX
        clientY = e.clientY
      }

      const rect = canvasRef.current.getBoundingClientRect()
      const x = clientX - rect.left + canvasWrapperRef.current!.scrollLeft
      const y = clientY - rect.top + canvasWrapperRef.current!.scrollTop

      // クリックしたグリッドのセルを計算
      const col = Math.floor(x / GRID_SIZE)
      const row = Math.floor(y / GRID_SIZE)

      // グリッドの範囲内であることを確認
      if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
        // クリックしたグリッドが空いているかを確認
        if (!gridCells[row][col]) {
          // グリッドの列に対応する色を取得
          const colorForColumn = GRID_COLORS[col]
          
          // 実際の座標を計算（グリッドのセルの中央に配置）
          const posX = col * GRID_SIZE + (GRID_SIZE - 150) / 2
          const posY = row * GRID_SIZE + (GRID_SIZE - 150) / 2

          const newNote: Note = {
            id: `user-${Date.now()}`,
            content: "",
            position: { x: posX, y: posY },
            color: colorForColumn,
            zIndex: highestZIndex + 1,
            gridPosition: { row, col }
          }

          // グリッドの占有状態を更新
          const newGridCells = [...gridCells]
          newGridCells[row][col] = true
          setGridCells(newGridCells)

          // 選択色も更新
          setSelectedColor(colorForColumn)
          
          setNotes([...notes, newNote])
          setHighestZIndex(highestZIndex + 1)
        }
      }
    }
  }

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
            // ここで明示的に型チェックを行う
            const content = updates.content;
            if (content !== undefined) {
              await notesApi.saveNoteContent(id, content);
              console.log(`付箋 ${id} の内容を保存しました`);
            }
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
      // バックエンドAPIを呼び出す
      const topic = currentTopic || "未来の働き方について";
      const response = await notesApi.generateAINotes(topic, Math.floor(Math.random() * 2) + 1);

      if (response.success && canvasRef.current) {
        const aiNotes = response.notes;
        const newNotes: Note[] = [];

        // 生成された付箋をグリッドに配置
        for (const aiNote of aiNotes) {
          // 色に対応する列を見つける
          const possibleCols = Object.entries(GRID_COLORS)
            .filter(([_, colorName]) => colorName === aiNote.color)
            .map(([colIndex]) => parseInt(colIndex));
          
          if (possibleCols.length === 0) continue;
          
          // 空いているセルを探す
          let foundCell = false;
          
          // 左上から順に探索
          for (let row = 0; row < GRID_ROWS && !foundCell; row++) {
            for (const col of possibleCols) {
              // セルが空いているかチェック
              if (!gridCells[row][col]) {
                foundCell = true;
                
                // 実際の座標を計算
                const posX = col * GRID_SIZE + (GRID_SIZE - 150) / 2;
                const posY = row * GRID_SIZE + (GRID_SIZE - 150) / 2;

                newNotes.push({
                  id: aiNote.id,
                  content: aiNote.content,
                  position: { x: posX, y: posY },
                  color: aiNote.color,
                  zIndex: highestZIndex + newNotes.length + 1,
                  gridPosition: { row, col }
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
          
          // 左上からの探索で見つからない場合のバックアップとして、ランダムに試す
          if (!foundCell) {
            // 残りのどこかに空きがあるか最大30回試行
            for (let attempt = 0; attempt < 30 && !foundCell; attempt++) {
              const row = Math.floor(Math.random() * GRID_ROWS);
              const colIndex = Math.floor(Math.random() * possibleCols.length);
              const col = possibleCols[colIndex];
              
              // セルが空いているかチェック
              if (!gridCells[row][col]) {
                foundCell = true;
                
                // 実際の座標を計算
                const posX = col * GRID_SIZE + (GRID_SIZE - 150) / 2;
                const posY = row * GRID_SIZE + (GRID_SIZE - 150) / 2;

                newNotes.push({
                  id: aiNote.id,
                  content: aiNote.content,
                  position: { x: posX, y: posY },
                  color: aiNote.color,
                  zIndex: highestZIndex + newNotes.length + 1,
                  gridPosition: { row, col }
                });

                // グリッドの占有状態を更新
                const newGridCells = [...gridCells];
                newGridCells[row][col] = true;
                setGridCells(newGridCells);
              }
            }
          }
        }

        if (newNotes.length > 0) {
          setNotes([...notes, ...newNotes]);
          setHighestZIndex(highestZIndex + newNotes.length);
        }
      }
    } catch (error) {
      console.error("AI付箋追加エラー:", error);
    } finally {
      setIsAILoading(false);
    }
  };

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
      
      // 並んだ付箋同士をつなぐ
      for (let i = 0; i < sortedNotes.length - 1; i++) {
        const currentNote = sortedNotes[i];
        const nextNote = sortedNotes[i + 1];
        
        if (currentNote.gridPosition && nextNote.gridPosition) {
          // 隣接しているかチェック（行が連続しているか）
          if (nextNote.gridPosition.row - currentNote.gridPosition.row === 1) {
            // 付箋の中心を計算
            const startX = currentNote.position.x + 75; // 付箋幅の半分
            const startY = currentNote.position.y + 150; // 付箋の下端
            const endX = nextNote.position.x + 75; // 付箋幅の半分
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
      }
    });
    
    return connections;
  };

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
              {/* 色ボタン - 付箋追加用 */}
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
                        setSelectedColor(colorName)
                        // 最初の空きセルを探す
                        const col = COLOR_COLUMNS[colorName as keyof typeof COLOR_COLUMNS]
                        let row = -1
                        for (let r = 0; r < GRID_ROWS; r++) {
                          if (!gridCells[r][col]) {
                            row = r
                            break
                          }
                        }
                        
                        // 空きセルがあれば付箋を追加
                        if (row !== -1 && canvasRef.current) {
                          const posX = col * GRID_SIZE + (GRID_SIZE - 150) / 2
                          const posY = row * GRID_SIZE + (GRID_SIZE - 150) / 2
                          
                          const newNote: Note = {
                            id: `user-${Date.now()}`,
                            content: "",
                            position: { x: posX, y: posY },
                            color: colorName,
                            zIndex: highestZIndex + 1,
                            gridPosition: { row, col }
                          }
                          
                          // グリッドの占有状態を更新
                          const newGridCells = [...gridCells]
                          newGridCells[row][col] = true
                          setGridCells(newGridCells)
                          
                          setNotes([...notes, newNote])
                          setHighestZIndex(highestZIndex + 1)
                        }
                      }}
                      title={`${colorName}の付箋を追加`}
                    />
                  )
                })}
              </div>

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
                        上部の色ボタンをクリックすると、その色の付箋が追加されます。
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">付箋の編集</h3>
                      <p className="text-sm text-muted-foreground">
                        付箋のテキスト部分をクリック/タップすると編集モードになります。編集が終わったら「完了」ボタンをクリックしてください。
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">付箋の色変更</h3>
                      <p className="text-sm text-muted-foreground">
                        付箋内のパレットアイコンをクリックすると色を変更できます。
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
                        // ゲームモード時は色の選択のみ
                        setSelectedColor(colorName)
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

