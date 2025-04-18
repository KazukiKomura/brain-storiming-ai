FROM node:20-alpine

WORKDIR /app

# pnpmのインストール
RUN npm install -g pnpm

# 依存関係のファイルをコピー
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# 依存関係のインストール
RUN pnpm install

# ソースコードをコピー
COPY frontend/ .

# 開発サーバーを起動
CMD ["pnpm", "dev"] 