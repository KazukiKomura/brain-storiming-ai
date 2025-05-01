FROM node:20-alpine

WORKDIR /app

# pnpmのインストール
RUN npm install -g pnpm

# 依存関係のファイルをコピー
COPY package.json pnpm-lock.yaml ./

# 依存関係のインストール
RUN pnpm install

# ソースコードをコピー
COPY . .

# 開発サーバーを起動
CMD ["pnpm", "dev"] 