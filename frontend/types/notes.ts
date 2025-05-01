export type NoteColor = 'yellow' | 'orange' | 'red' | 'pink' | 'green' | 
                     'teal' | 'blue' | 'indigo' | 'purple' | 'white';

export type NoteCreator = 'ai' | 'user';

export type GridPosition = {
  row: number;
  col: number;
};

export type Note = {
  id: string;
  content: string;
  position: { x: number; y: number };
  color: NoteColor;
  zIndex: number;
  gridPosition?: GridPosition;
  finishEditing?: boolean;
  creator?: NoteCreator;
  turnId?: number;  // 付箋が追加されたターン番号
};

// 利用可能な付箋の色
export const COLORS: Record<string, string> = {
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
};

// 色ごとの列を定義
export const COLOR_COLUMNS: Record<string, number> = {
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
};

// グリッドのサイズ
export const GRID_SIZE = 180;
export const GRID_COLS = 15; 
export const GRID_ROWS = 20;
export const NOTE_SIZE = 150;

// 色とグリッド列の関係
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