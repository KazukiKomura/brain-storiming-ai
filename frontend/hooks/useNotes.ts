"use client";

import { useState } from 'react';
import { Note, GridPosition, NoteColor, GRID_SIZE, NOTE_SIZE, GRID_ROWS, GRID_COLS } from '@/types/notes';
import { notesApi } from '@/lib/api';

type GridCells = boolean[][];

export function useNotes(initialNotes: Note[] = []) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [highestZIndex, setHighestZIndex] = useState<number>(1);
  const [gridCells, setGridCells] = useState<GridCells>(
    Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(false))
  );

  // 付箋を追加する関数
  const addNote = (
    position: { x: number, y: number }, 
    color: NoteColor, 
    creator: 'user' | 'ai' = 'user',
    metadata?: { turnId?: number } // turnIdなどのメタデータを受け取るオプションパラメータ
  ) => {
    const gridRow = Math.floor(position.y / GRID_SIZE);
    const gridCol = Math.floor(position.x / GRID_SIZE);

    if (gridRow >= 0 && gridRow < GRID_ROWS && gridCol >= 0 && gridCol < GRID_COLS) {
      if (!gridCells[gridRow][gridCol]) {
        const posX = gridCol * GRID_SIZE + (GRID_SIZE - NOTE_SIZE) / 2;
        const posY = gridRow * GRID_SIZE + (GRID_SIZE - NOTE_SIZE) / 2;

        const newNote: Note = {
          id: `${creator}-${Date.now()}`,
          content: "",
          position: { x: posX, y: posY },
          color,
          zIndex: highestZIndex + 1,
          gridPosition: { row: gridRow, col: gridCol },
          creator,
          ...(metadata || {}) // メタデータがあれば追加
        };

        const newGridCells = [...gridCells];
        newGridCells[gridRow][gridCol] = true;
        setGridCells(newGridCells);
        setNotes([...notes, newNote]);
        setHighestZIndex(highestZIndex + 1);
        
        return newNote;
      }
    }
    
    return null;
  };

  // 付箋を更新する関数
  const updateNote = (id: string, updates: Partial<Note>) => {
    // 位置が更新される場合、グリッドの占有状態も更新
    if (updates.gridPosition) {
      const noteToUpdate = notes.find((note: Note) => note.id === id);
      if (noteToUpdate && noteToUpdate.gridPosition) {
        // 古い位置の占有状態をクリア
        const newGridCells = [...gridCells];
        newGridCells[noteToUpdate.gridPosition.row][noteToUpdate.gridPosition.col] = false;
        
        // 新しい位置を占有中に設定
        newGridCells[updates.gridPosition.row][updates.gridPosition.col] = true;
        setGridCells(newGridCells);
      }
    }
    
    // デバッグログを追加
    console.log('付箋更新:', { id, updates, hasFinishEditing: !!updates.finishEditing });
    
    // 編集終了フラグがある場合のみ、コンテンツをバックエンドに保存
    if (updates.finishEditing && updates.content !== undefined) {
      // ユーザーが作成した付箋のみを保存対象とする
      if (id.startsWith('user-')) {
        // 非同期で保存処理を行う
        (async () => {
          try {
            // 付箋の現在の情報を取得
            const noteToUpdate = notes.find((note: Note) => note.id === id);
            // グリッド位置情報があれば一緒に保存
            const gridPosition = noteToUpdate?.gridPosition;
            
            // 全ての付箋情報（編集されたものを含む）を準備
            const updatedNotes = notes.map((note: Note) => 
              note.id === id 
                ? { 
                    ...note, 
                    content: updates.content, 
                    ...(updates.gridPosition && { gridPosition: updates.gridPosition }) 
                  }
                : note
            );
            
            // 必要な情報だけを含む配列を作成
            const allNotesData = updatedNotes.map((note: Note) => ({
              id: note.id,
              content: note.content,
              gridPosition: note.gridPosition,
              creator: note.creator || (note.id.startsWith('ai-') ? 'ai' : 'user'),
              turnId: note.turnId // turnIdも明示的に含める
            }));
            
            // デバッグログを追加
            console.log('保存する付箋データ:', {
              id,
              content: updates.content,
              gridPosition,
              turnId: noteToUpdate?.turnId,
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

    // 付箋データの更新（既存のnoteに対してupdatesを上書き）
    setNotes(notes.map((note: Note) => {
      if (note.id === id) {
        // turnIdなどの重要なフィールドが明示的に含まれていない場合は保持する
        const updatedNote = { 
          ...note, 
          ...updates,
          // turnIdが明示的に指定されていない場合は現在の値を保持
          turnId: updates.turnId !== undefined ? updates.turnId : note.turnId,
          zIndex: highestZIndex + 1 
        };
        
        console.log('付箋を更新しました:', { 
          id, 
          旧content: note.content, 
          新content: updatedNote.content,
          turnId: updatedNote.turnId 
        });
        
        return updatedNote;
      }
      return note;
    }));
    setHighestZIndex(highestZIndex + 1);
  };

  // 付箋を削除する関数
  const deleteNote = (id: string) => {
    const noteToDelete = notes.find((note: Note) => note.id === id);
    if (noteToDelete && noteToDelete.gridPosition) {
      // グリッドの占有状態を更新
      const newGridCells = [...gridCells];
      newGridCells[noteToDelete.gridPosition.row][noteToDelete.gridPosition.col] = false;
      setGridCells(newGridCells);
    }
    
    setNotes(notes.filter((note: Note) => note.id !== id));
  };

  // キャンバスをクリアする関数
  const clearCanvas = (withConfirm: boolean = true) => {
    const doClear = () => {
      setNotes([]);
      // グリッドセルの占有状態をリセット
      setGridCells(Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(false)));
    };

    if (withConfirm) {
      if (confirm("すべての付箋を削除してもよろしいですか？")) {
        doClear();
      }
    } else {
      doClear();
    }
  };

  // 現在のグリッドセルが空いているかを確認する関数
  const isGridCellEmpty = (row: number, col: number): boolean => {
    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      return !gridCells[row][col];
    }
    return false;
  };

  // 指定された色のために最初の空きグリッドセルを見つける関数
  const findEmptyGridCellForColor = (color: NoteColor, preferredCol?: number): GridPosition | null => {
    const targetCol = preferredCol !== undefined ? preferredCol : 0;
    
    // 指定された列を優先的に探索
    for (let row = 0; row < GRID_ROWS; row++) {
      if (isGridCellEmpty(row, targetCol)) {
        return { row, col: targetCol };
      }
    }
    
    // 指定列に空きがなければ他の列も探索
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (isGridCellEmpty(row, col)) {
          return { row, col };
        }
      }
    }
    
    return null;
  };

  return {
    notes,
    setNotes,
    gridCells,
    highestZIndex,
    addNote,
    updateNote,
    deleteNote,
    clearCanvas,
    isGridCellEmpty,
    findEmptyGridCellForColor
  };
} 