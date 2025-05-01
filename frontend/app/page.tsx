"use client";

import { useSession } from "@/lib/session-context";
import Canvas from "@/components/brainstorming/Canvas";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const VIDEO_URL = "https://brain-storming-ai.s3.ap-northeast-1.amazonaws.com/brainstorming-instruction.mp4"; // 説明動画のURL
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
            <div className="text-center max-w-2xl space-y-4">
              <p>
                このビデオでは、UI/UXデザインにおけるブレインストーミングの方法を説明しています。
                セッションでは、アイデアを付箋に書き込み、他の参加者と共有することで、より良いデザイン案を出し合います。
              </p>
              <div className="bg-blue-50 p-4 rounded-md text-left">
                <h2 className="font-bold text-blue-700 mb-2">ブレインストーミング・セッションの進め方</h2>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>まず<strong>テストセッション</strong>で付箋の作成・編集操作に慣れていただきます</li>
                  <li>その後、<strong>本番セッション1</strong>では指定されたお題についてAIと交互に各3つのアイデアを出し合います</li>
                  <li><strong>本番セッション2</strong>では、新たなお題について再びAIと交互に各3つのアイデアを出し合います</li>
                  <li>各セッションでは、AIが先に3つのアイデアを提示し、次にあなたが3つのアイデアを付箋に書いて貼ってください</li>
                  <li>全てのセッション完了後、簡単なアンケートにお答えいただきます</li>
                </ol>
              </div>
              <p className="mt-4 font-medium">
                まずはテストセッションで操作に慣れてから、本番セッションに進んでください。
              </p>
            </div>
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
                  // メッセージと状態をリセット
                  document.dispatchEvent(new CustomEvent('resetSessionState'));
                  // キャンバスからのノートデータ取得はCanvasコンポーネント側で実装する必要があります
                  // ここでは簡略化のため、保存せずに次のステップに進みます
                  goToState('session1');
                }}
              >
                本番セッション1へ進む
              </Button>
            </div>
            <div className="bg-green-50 p-3 border-l-4 border-green-500">
              <h2 className="font-bold text-green-700 mb-2">テストセッション - 操作方法</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold text-green-600">付箋の基本操作</h3>
                  <ol className="list-decimal list-inside space-y-1 ml-2 text-green-800">
                    <li>上部の色ボタンをクリックすると、その色の付箋が追加されます</li>
                    <li>付箋をクリックすると編集モードになります</li>
                    <li>テキストを入力し、完了ボタンを押すか外側をクリックすると確定します</li>
                    <li>付箋内の「×」ボタンで削除できます</li>
                    <li>付箋内のパレットアイコンで色を変更できます</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-semibold text-green-600">お試しください</h3>
                  <p className="text-green-800 mb-2">
                    このテストセッションでは、以下の操作を自由に試してみてください:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-green-800">
                    <li>複数の付箋を作成してみる</li>
                    <li>付箋にテキストを入力してみる</li>
                    <li>付箋の色を変えてみる</li>
                    <li>付箋を削除してみる</li>
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-green-700">
                操作に慣れたら「本番セッション1へ進む」ボタンをクリックしてください。
              </p>
            </div>
            <Canvas 
              isTestMode={true}
              onSaveNotes={(notes) => saveSessionData('test', notes)}
            />
          </div>
        );

      case 'session1':
        return (
          <div className="flex flex-col min-h-screen">
            <Canvas 
              isTestMode={false}
              onSaveNotes={(notes) => saveSessionData('session1', notes)}
            />
          </div>
        );

      case 'session2':
        return (
          <div className="flex flex-col min-h-screen">
            <Canvas 
              isTestMode={false}
              currentState="session2"
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

