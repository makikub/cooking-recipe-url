# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Discordに投稿された料理レシピURLを自動収集・分類し、Webサイトで閲覧できるシステム。

**技術スタック（Cloudflare構成）:**
- フロントエンド: Next.js 15 + Cloudflare Pages
- バックエンド: Cloudflare Workers (TypeScript)
- データベース: Cloudflare D1 (SQLite)
- AI分類: OpenAI GPT 5.2
- Discord連携: REST API + Cron Triggers（毎日9:00 JST実行）

## よく使うコマンド

### Workers（バックエンドAPI）

```bash
cd workers

# 開発サーバー起動
wrangler dev

# 本番デプロイ
wrangler deploy

# D1スキーマ適用
wrangler d1 execute recipe-db --file=./schema.sql --remote

# D1スキーマ適用（ローカル）
wrangler d1 execute recipe-db --file=./schema.sql --local

# シークレット設定
wrangler secret put DISCORD_TOKEN
wrangler secret put DISCORD_CHANNEL_ID
wrangler secret put OPENAI_API_KEY
```

### Frontend（Pages）

```bash
cd frontend

# 開発サーバー起動
npm run dev

# Cloudflare Pages用ビルド
npm run pages:build

# Cloudflare Pagesへデプロイ
npm run pages:deploy
```

## アーキテクチャ

```
Discord Channel → Cron Trigger (毎日) → Workers → D1
                                              ↑
                                         OpenAI GPT
                                              ↓
                        Cloudflare Pages ← Workers API
```

### ディレクトリ構造

```
workers/
├── src/
│   ├── index.ts           # エントリーポイント（API + Cronハンドラ）
│   ├── services/
│   │   ├── discord.ts     # Discord REST APIクライアント
│   │   ├── scraper.ts     # OGPスクレイパー
│   │   └── classifier.ts  # OpenAI GPT分類
│   ├── repositories/
│   │   └── recipe.ts      # D1データアクセス層
│   └── types/
│       └── index.ts       # 型定義
├── schema.sql             # D1スキーマ
└── wrangler.toml          # Workers設定

frontend/
├── app/
│   ├── layout.tsx
│   └── page.tsx           # export const runtime = 'edge' 必須
├── components/
│   ├── RecipeList.tsx
│   └── RecipeCard.tsx
├── lib/
│   └── api.ts             # Workers APIクライアント
└── wrangler.toml          # Pages設定
```

## 重要な技術的注意点

### D1 (SQLite) の制約
- 配列型なし → `ingredients`はJSON文字列で保存
- フロントエンドでパース: `JSON.parse(recipe.ingredients)`

### Cloudflare Pages
- `export const runtime = 'edge'`をpage.tsxに追加必須
- `nodejs_compat`フラグはCloudflare Dashboard→Functions→Compatibility flagsで設定

### Workers API
- エンドポイント: `/api/recipes`, `/api/recipes/:id`, `/api/health`, `/api/collect`
- CORSヘッダー設定済み

## コーディング規約

- 日本語でコメントとドキュメントを記述
- TypeScript: 型安全性を重視、`any`の使用は避ける
- React: 関数コンポーネントとHooksを使用
- Tailwind CSS: インラインスタイリング
