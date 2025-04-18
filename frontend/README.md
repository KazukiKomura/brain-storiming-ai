# Brain Storming UI

Next.jsを使用したブレインストーミング用のWebアプリケーション

## 開発環境のセットアップ

### 必要条件

- Docker
- Docker Compose
- pnpm (ローカル開発用)

### Dockerを使用した開発環境の起動

1. リポジトリのクローン
```bash
git clone [repository-url]
cd brain-storming-ui
```

2. Dockerコンテナのビルドと起動
```bash
docker compose up --build
```

3. アプリケーションへのアクセス
ブラウザで http://localhost:3000 にアクセスしてください。

### 開発環境の停止

```bash
docker compose down
```

## プロジェクト構造

```
brain-storming-ui/
├── app/          # Next.jsのページコンポーネント
├── components/   # 再利用可能なUIコンポーネント
├── lib/          # ユーティリティ関数
├── hooks/        # カスタムフック
├── styles/       # スタイルシート
└── public/       # 静的ファイル
```

## 技術スタック

- Next.js
- TypeScript
- Tailwind CSS
- pnpm

## 開発ガイドライン

- コンポーネントは`components/`ディレクトリに配置
- ページコンポーネントは`app/`ディレクトリに配置
- スタイリングはTailwind CSSを使用
- 型定義は必ず行う

## ライセンス

[ライセンス情報を追加してください] 