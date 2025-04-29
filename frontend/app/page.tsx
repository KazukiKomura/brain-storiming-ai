"use client";

import { useSession } from "@/lib/session-context";
import CollaborativeCanvas from "@/components/collaborative-canvas";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const VIDEO_URL = "https://example.com/explanation-video.mp4"; // 説明動画のURL
const SURVEY_URL = "https://example.com/survey?id="; // アンケートのベースURL

export default function Home() {
  const { sessionId, simpleId, currentState, initSession, goToState, completeSession, saveSessionData } = useSession();

  // 初期化時にセッションがなければ作成
  useEffect(() => {
    if (!sessionId && currentState === 'initial') {
      initSession();
    }
  }, [sessionId, currentState, initSession]);

  // 現在の状態に応じたコンポーネントを表示
  const renderContent = () => {
    switch (currentState) {
      case 'initial':
        return (
          <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
            <h1 className="text-2xl font-bold">ブレインストーミングセッションへようこそ</h1>
            <p>セッションを初期化しています...</p>
          </div>
        );

      case 'video':
        return (
          <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
            <h1 className="text-2xl font-bold">ブレインストーミングの説明</h1>
            <div className="aspect-video w-full max-w-3xl bg-gray-200 rounded">
              <video src={VIDEO_URL} controls className="w-full h-full" />
            </div>
            <p className="text-center max-w-2xl">
              このビデオでは、ブレインストーミングセッションの進め方について説明しています。
              セッションでは、アイデアを付箋に書き込み、他の参加者と共有します。
              動画を視聴したら「テストセッションへ進む」ボタンをクリックしてください。
            </p>
            <Button 
              onClick={() => goToState('test')}
              className="mt-4"
            >
              テストセッションへ進む
            </Button>
          </div>
        );

      case 'test':
        return (
          <div className="flex flex-col min-h-screen">
            <div className="p-3 bg-gray-900 text-white flex justify-between items-center">
              <h1 className="text-xl font-bold">テストセッション</h1>
              <Button 
                onClick={async () => {
                  // テストセッションから本番セッション1へ移動時に付箋を消去
                  document.dispatchEvent(new CustomEvent('clearCanvas'));
                  // キャンバスからのノートデータ取得はCollaborativeCanvasコンポーネント側で実装する必要があります
                  // ここでは簡略化のため、保存せずに次のステップに進みます
                  goToState('session1');
                }}
              >
                本番セッション1へ進む
              </Button>
            </div>
            <CollaborativeCanvas 
              isTestMode={true}
              onSaveNotes={(notes) => saveSessionData('test', notes)}
            />
          </div>
        );

      case 'session1':
        return (
          <div className="flex flex-col min-h-screen">
            <div className="p-3 bg-gray-900 text-white flex justify-between items-center">
              <h1 className="text-xl font-bold">本番セッション 1</h1>
              <Button 
                onClick={async () => {
                  // 本番セッション1から本番セッション2へ移動時に付箋を消去
                  document.dispatchEvent(new CustomEvent('clearCanvas'));
                  // キャンバスからのノートデータ取得はCollaborativeCanvasコンポーネント側で実装する必要があります
                  goToState('session2');
                }}
              >
                本番セッション2へ進む
              </Button>
            </div>
            <CollaborativeCanvas 
              isTestMode={false}
              onSaveNotes={(notes) => saveSessionData('session1', notes)}
            />
          </div>
        );

      case 'session2':
        return (
          <div className="flex flex-col min-h-screen">
            <div className="p-3 bg-gray-900 text-white flex justify-between items-center">
              <h1 className="text-xl font-bold">本番セッション 2</h1>
              <Button 
                onClick={async () => {
                  await completeSession();
                  goToState('survey');
                }}
              >
                セッション完了・アンケートへ
              </Button>
            </div>
            <CollaborativeCanvas 
              isTestMode={false}
              onSaveNotes={(notes) => saveSessionData('session2', notes)}
            />
          </div>
        );

      case 'survey':
        return (
          <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
            <h1 className="text-2xl font-bold">セッション完了</h1>
            <p className="text-center max-w-2xl">
              ブレインストーミングセッションは完了しました。
              アンケート回答にお進みください。
            </p>
            {simpleId && (
              <div className="bg-gray-100 p-6 rounded-lg mt-4 text-center">
                <p className="text-lg font-bold mb-2">あなたのID</p>
                <p className="text-3xl font-mono">{simpleId}</p>
                <p className="mt-2 text-sm text-gray-600">
                  このIDはアンケート回答時に必要です。メモを取るか、画面をキャプチャしてください。
                </p>
              </div>
            )}
            <Button 
              onClick={() => {
                // アンケートページへリダイレクト
                if (simpleId) {
                  window.location.href = SURVEY_URL + simpleId;
                }
              }}
              className="mt-6"
            >
              アンケートに回答する
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      {renderContent()}
    </main>
  );
}

