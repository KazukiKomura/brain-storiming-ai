export * from './notes';
export * from './session';

// モジュール宣言用の型定義を追加
// これはtypescript型エラーを解消するためのものです
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // 環境変数の型定義
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

// ビューポート情報の型
export type ViewportInfo = {
  x: number;
  y: number;
  width: number;
  height: number;
  totalWidth: number;
  totalHeight: number;
}; 