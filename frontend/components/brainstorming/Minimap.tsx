"use client";

import React, { useState, useEffect } from 'react';
import { Note } from '@/types/notes';
import { ViewportInfo } from '@/types/index';
import { COLORS, GRID_ROWS, GRID_COLS, GRID_COLORS } from '@/types/notes';

interface MinimapProps {
  notes: Note[];
  viewportInfo: ViewportInfo;
  onMinimapClick: (e: any) => void;
}

export default function Minimap({ notes, viewportInfo, onMinimapClick }: MinimapProps) {
  // 前回のビューポート情報を保持
  const [lastViewport, setLastViewport] = useState<ViewportInfo | null>(null);
  
  // ビューポート情報が変更されたらログに出力
  useEffect(() => {
    const isViewportChanged = !lastViewport || 
      lastViewport.x !== viewportInfo.x || 
      lastViewport.y !== viewportInfo.y;
    
    if (isViewportChanged) {
      console.log("Minimap received new viewport position:", {
        x: viewportInfo.x,
        y: viewportInfo.y,
        width: viewportInfo.width,
        height: viewportInfo.height,
      });
      setLastViewport(viewportInfo);
    }
  }, [viewportInfo, lastViewport]);
  
  // ビューポートの比率や位置を計算
  const viewportWidthPercentage = Math.min((viewportInfo.width / viewportInfo.totalWidth) * 100, 100);
  const viewportHeightPercentage = Math.min((viewportInfo.height / viewportInfo.totalHeight) * 100, 100);
  const viewportLeftPercentage = (viewportInfo.x / viewportInfo.totalWidth) * 100;
  const viewportTopPercentage = (viewportInfo.y / viewportInfo.totalHeight) * 100;
  
  // デバッグ出力
  console.log("Minimap rendering with viewport position:", {
    left: `${viewportLeftPercentage}%`,
    top: `${viewportTopPercentage}%`, 
    width: `${viewportWidthPercentage}%`,
    height: `${viewportHeightPercentage}%`,
  });
  
  return (
    <div className="absolute bottom-4 right-4 w-48 h-36 bg-white shadow-lg rounded-md p-1 border border-gray-300 z-50">
      <div 
        className="w-full h-full relative cursor-pointer" 
        style={{ 
          backgroundColor: '#f3f4f6',
          border: '1px solid #e5e7eb'
        }}
        onClick={onMinimapClick}
      >
        {/* カラーグリッド背景 */}
        <div className="absolute top-0 left-0 w-full h-full">
          {Array(GRID_COLS).fill(0).map((_, col) => {
            const colorName = GRID_COLORS[col];
            const colorClass = COLORS[colorName as any]?.split(' ')[0]?.replace('bg-', '') || 'gray-100';
            return (
              <div 
                key={`bg-col-${col}`}
                className={`absolute h-full bg-${colorClass} opacity-10`}
                style={{ 
                  left: `${(col * 100) / GRID_COLS}%`,
                  width: `${100 / GRID_COLS}%`
                }}
              />
            );
          })}
        </div>
        
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
              backgroundColor: Object.entries(COLORS).find(([color]) => color === note.color)?.[1].split(' ')[0].replace('bg-', '') || 'gray'
            }}
          />
        ))}
        
        {/* 表示範囲を示す枠 - より詳細な表示 */}
        <div 
          className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-30 pointer-events-none"
          style={{
            left: `${viewportLeftPercentage}%`,
            top: `${viewportTopPercentage}%`, 
            width: `${viewportWidthPercentage}%`,
            height: `${viewportHeightPercentage}%`,
          }}
        />
        
        {/* グリッド線の表示 */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {Array(GRID_ROWS).fill(0).map((_, row) => (
            <div 
              key={`minimap-row-${row}`}
              className="absolute border-t border-gray-300 w-full"
              style={{ top: `${(row * 100) / GRID_ROWS}%` }}
            />
          ))}
          {Array(GRID_COLS).fill(0).map((_, col) => (
            <div 
              key={`minimap-col-${col}`}
              className="absolute border-l border-gray-300 h-full"
              style={{ left: `${(col * 100) / GRID_COLS}%` }}
            />
          ))}
        </div>
      </div>
      <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-white text-xs p-1 rounded-full shadow border border-gray-200">
        {Math.round(viewportWidthPercentage)}%
      </div>
    </div>
  );
} 