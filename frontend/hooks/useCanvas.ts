"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ViewportInfo } from '@/types/index';
import { GRID_SIZE, GRID_COLS, GRID_ROWS } from '@/types/notes';

export function useCanvas() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);

  // 初期値をデフォルト値で初期化
  const [viewportInfo, setViewportInfo] = useState({
    x: 0,
    y: 0,
    width: 800, // サーバーサイドレンダリング時のデフォルト値
    height: 600, // サーバーサイドレンダリング時のデフォルト値
    totalWidth: GRID_COLS * GRID_SIZE,
    totalHeight: GRID_ROWS * GRID_SIZE
  });

  // ビューポート情報の更新
  const updateViewportInfo = () => {
    if (canvasWrapperRef.current && canvasRef.current) {
      const wrapper = canvasWrapperRef.current;
      const canvas = canvasRef.current;
      
      const newViewportInfo = {
        x: wrapper.scrollLeft,
        y: wrapper.scrollTop,
        width: wrapper.clientWidth,
        height: wrapper.clientHeight,
        totalWidth: canvas.scrollWidth || GRID_COLS * GRID_SIZE,
        totalHeight: canvas.scrollHeight || GRID_ROWS * GRID_SIZE
      };
      
      console.log("Updating viewport info:", newViewportInfo);
      setViewportInfo(newViewportInfo);
    }
  };

  // クライアントサイドでwindowのサイズを取得
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // windowの幅と高さを使って初期値を更新
      setViewportInfo(prev => ({
        ...prev,
        width: window.innerWidth,
        height: window.innerHeight
      }));
    }
  }, []);

  // スクロール時にビューポート情報更新
  useEffect(() => {
    // 安全にwindowにアクセス
    if (typeof window === 'undefined') return;
    
    // 初期更新の遅延
    const initialUpdateDelay = 100;
    const throttleDelay = 10; // スクロールイベントの間引き時間(ms)
    let lastUpdateTime = 0;
    
    // 更新をthrottleする関数
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdateTime > throttleDelay) {
        lastUpdateTime = now;
        updateViewportInfo();
      }
    };
    
    // ウィンドウのサイズ変更時にも更新
    setTimeout(() => {
      updateViewportInfo();
      console.log("Initial viewport update after delay");
    }, initialUpdateDelay);
    
    const wrapper = canvasWrapperRef.current;
    if (wrapper) {
      // passive: trueを指定してパフォーマンスを向上
      wrapper.addEventListener('scroll', throttledUpdate, { passive: true });
      window.addEventListener('resize', updateViewportInfo);
      
      // 初期更新 - 複数回更新を試みる
      console.log("Setting up multiple viewport updates");
      updateViewportInfo(); // すぐに一度更新
      
      // DOM読み込み後に再度更新
      const timeouts = [100, 500, 1000, 2000].map(time => 
        setTimeout(() => {
          console.log(`Viewport update at ${time}ms`);
          updateViewportInfo();
        }, time)
      );
      
      return () => {
        wrapper.removeEventListener('scroll', throttledUpdate);
        window.removeEventListener('resize', updateViewportInfo);
        timeouts.forEach(id => clearTimeout(id));
      };
    }
  }, []);
  
  // 明示的にスクロール位置を追跡する機能を追加
  const forceUpdateViewport = () => {
    console.log("Force updating viewport");
    updateViewportInfo();
  };
  
  // 指定した位置にスクロール
  const scrollToPosition = (x: number, y: number) => {
    if (canvasWrapperRef.current) {
      canvasWrapperRef.current.scrollTo({
        left: x,
        top: y,
        behavior: 'smooth'
      });
      
      // スクロール後に少し遅延してビューポート情報を更新
      setTimeout(updateViewportInfo, 500);
    }
  };

  // ミニマップでのクリック処理
  const handleMinimapClick = (e: any) => {
    // ミニマップの矩形情報を取得
    const minimap = e.currentTarget.getBoundingClientRect();
    
    // クライアント座標を取得（タッチイベントとマウスイベントを両方サポート）
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // ミニマップ内でのクリック位置（相対位置、0-1の割合）
    const relativeX = (clientX - minimap.left) / minimap.width;
    const relativeY = (clientY - minimap.top) / minimap.height;
    
    // デバッグ情報
    console.log(`Minimap: click at client (${clientX}, ${clientY}), minimap rect (${minimap.left}, ${minimap.top}, ${minimap.width}, ${minimap.height})`);
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
  };

  return {
    canvasRef,
    canvasWrapperRef,
    viewportInfo,
    updateViewportInfo,
    forceUpdateViewport,
    scrollToPosition,
    handleMinimapClick
  };
} 