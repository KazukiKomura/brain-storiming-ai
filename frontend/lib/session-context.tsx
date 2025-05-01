"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type SessionState = 'initial' | 'video' | 'test' | 'session1' | 'session2' | 'survey';

interface SessionContextType {
  sessionId: string | null;
  simpleId: string | null;
  currentState: SessionState;
  initSession: () => Promise<void>;
  goToState: (state: SessionState) => void;
  completeSession: () => Promise<void>;
  saveSessionData: (type: 'test' | 'session1' | 'session2', notes: any[]) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [simpleId, setSimpleId] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<SessionState>('initial');

  // LocalStorageからセッション情報を復元
  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    const storedSimpleId = localStorage.getItem('simpleId');
    const storedState = localStorage.getItem('sessionState') as SessionState | null;

    if (storedSessionId) setSessionId(storedSessionId);
    if (storedSimpleId) setSimpleId(storedSimpleId);
    if (storedState) setCurrentState(storedState);
  }, []);

  // 状態が変わったらLocalStorageに保存
  useEffect(() => {
    if (sessionId) localStorage.setItem('sessionId', sessionId);
    if (simpleId) localStorage.setItem('simpleId', simpleId);
    localStorage.setItem('sessionState', currentState);
  }, [sessionId, simpleId, currentState]);

  // APIのベースURLを設定 - Docker環境に対応
  // Note: Docker Composeで設定されたバックエンドサービス名を使用
  const API_BASE_URL = '/api'; // 相対パスを使用してプロキシ経由でアクセス

  // 新しいセッションを初期化
  const initSession = async () => {
    try {
      console.log("APIリクエスト開始: セッション作成");
      const response = await fetch(`${API_BASE_URL}/sessions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log("APIレスポンス:", data);
      
      if (data.success) {
        setSessionId(data.sessionId);
        setSimpleId(data.simpleId);
        setCurrentState('video');
      } else {
        console.error('セッション初期化エラー:', data.message);
      }
    } catch (error) {
      console.error('セッション初期化エラー:', error);
    }
  };

  // セッションの状態を変更
  const goToState = (state: SessionState) => {
    setCurrentState(state);
  };

  // セッションデータを保存
  const saveSessionData = async (type: 'test' | 'session1' | 'session2', notes: any[]) => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, notes })
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error('セッションデータ保存エラー:', data.message);
      }
    } catch (error) {
      console.error('セッションデータ保存エラー:', error);
    }
  };

  // セッションを完了
  const completeSession = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error('セッション完了エラー:', data.message);
      }
    } catch (error) {
      console.error('セッション完了エラー:', error);
    }
  };

  return (
    <SessionContext.Provider 
      value={{ 
        sessionId, 
        simpleId, 
        currentState, 
        initSession, 
        goToState, 
        completeSession,
        saveSessionData
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}; 