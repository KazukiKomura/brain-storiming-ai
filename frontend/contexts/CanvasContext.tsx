"use client";

import React, { createContext, useContext } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { useCanvas } from '@/hooks/useCanvas';
import { Note, NoteColor, GridPosition } from '@/types/notes';

// コンテキストの型定義
interface CanvasContextType {
  // useNotesから
  notes: Note[];
  addNote: (
    position: { x: number, y: number }, 
    color: NoteColor, 
    creator?: 'user' | 'ai', 
    metadata?: { turnId?: number }
  ) => Note | null;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  clearCanvas: (withConfirm?: boolean) => void;
  findEmptyGridCellForColor: (color: NoteColor, preferredCol?: number) => GridPosition | null;
  
  // useCanvasから
  canvasRef: React.RefObject<HTMLDivElement>;
  canvasWrapperRef: React.RefObject<HTMLDivElement>;
  viewportInfo: {
    x: number;
    y: number;
    width: number;
    height: number;
    totalWidth: number;
    totalHeight: number;
  };
  scrollToPosition: (x: number, y: number) => void;
  handleMinimapClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

// デフォルト値を持つコンテキストを作成
const CanvasContext = createContext<CanvasContextType>({
  notes: [],
  addNote: () => null,
  updateNote: () => {},
  deleteNote: () => {},
  clearCanvas: () => {},
  findEmptyGridCellForColor: () => null,
  canvasRef: { current: null },
  canvasWrapperRef: { current: null },
  viewportInfo: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    totalWidth: 0,
    totalHeight: 0
  },
  scrollToPosition: () => {},
  handleMinimapClick: () => {}
});

interface CanvasProviderProps {
  children: React.ReactNode;
}

// プロバイダーコンポーネント
export const CanvasProvider: React.FC<CanvasProviderProps> = ({ children }) => {
  const notesHook = useNotes();
  const canvasHook = useCanvas();
  
  // useNotesとuseCanvasフックから得られる値を組み合わせる
  const value: CanvasContextType = {
    ...notesHook,
    ...canvasHook
  };
  
  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};

// 使いやすいようにフックを作成
export const useCanvasContext = () => useContext(CanvasContext);

export default CanvasContext; 