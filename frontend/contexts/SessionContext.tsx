"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SessionState } from '@/types/session';

interface SessionData {
  [key: string]: any;
}

interface SessionContextType {
  sessionId: string;
  simpleId: string;
  currentState: SessionState;
  initSession: () => void;
  goToState: (state: SessionState) => void;
  completeSession: () => void;
  saveSessionData: (stateKey: string, data: any) => void;
  sessionData: SessionData;
}

// デフォルト値を持つコンテキストを作成
const SessionContext = createContext<SessionContextType>({
  sessionId: '',
  simpleId: '',
  currentState: 'initial',
  initSession: () => {},
  goToState: () => {},
  completeSession: () => {},
  saveSessionData: () => {},
  sessionData: {}
});

interface SessionProviderProps {
  children: React.ReactNode;
}

// プロバイダーコンポーネント
export const SessionProvider = ({ children }: SessionProviderProps) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [simpleId, setSimpleId] = useState<string>('');
  const [currentState, setCurrentState] = useState<SessionState>('initial');
  const [sessionData, setSessionData] = useState<SessionData>({});

  // URLからセッション状態を初期化する
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const stateParam = queryParams.get('state');

    if (stateParam && ['video', 'test', 'session1', 'session2', 'survey'].includes(stateParam)) {
      setCurrentState(stateParam as SessionState);
    } else {
      setCurrentState('initial');
    }
  }, []);

  // セッションを初期化する関数
  const initSession = () => {
    // セッションID生成（UUIDなど）
    const newSessionId = `session-${Date.now()}`;
    // シンプルなID（ユーザー向け）
    const newSimpleId = Math.floor(100000 + Math.random() * 900000).toString();
    
    setSessionId(newSessionId);
    setSimpleId(newSimpleId);
    setCurrentState('video');
    
    // URLを変更
    const url = new URL(window.location.href);
    url.searchParams.set('state', 'video');
    window.history.pushState({}, '', url);
  };

  // 状態を変更する関数
  const goToState = (state: SessionState) => {
    setCurrentState(state);
    
    // URLを変更
    const url = new URL(window.location.href);
    url.searchParams.set('state', state);
    window.history.pushState({}, '', url);
  };

  // セッションを完了する関数
  const completeSession = () => {
    // 完了状態を設定
    setCurrentState('survey');
    
    // URLを変更
    const url = new URL(window.location.href);
    url.searchParams.set('state', 'survey');
    window.history.pushState({}, '', url);
  };

  // セッションデータを保存する関数
  const saveSessionData = (stateKey: string, data: any) => {
    setSessionData((prevData) => ({
      ...prevData,
      [stateKey]: data
    }));
    
    // 実際のアプリケーションでは、ここでバックエンドAPIに保存するなどの処理を行う
    console.log(`セッションデータ保存: ${stateKey}`, data);
  };

  const value = {
    sessionId,
    simpleId,
    currentState,
    initSession,
    goToState,
    completeSession,
    saveSessionData,
    sessionData
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

// 使いやすいようにフックを作成
export const useSession = () => useContext(SessionContext);

export default SessionContext; 