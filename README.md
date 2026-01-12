![Header Image](docs/assets/header.png)

# 料理レシピURL管理システム

Discordに投稿された料理レシピURLを自動収集・分類し、見やすいWebサイトで閲覧できるシステム

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0.0-black)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20D1%20%2B%20Pages-orange)

---

## 概要

このシステムは、Discordの特定チャンネルに投稿された料理レシピURLを自動的に収集し、以下の処理を行います：

1. **自動収集**: Cron Triggerで毎日Discord REST APIからメッセージを取得
2. **スクレイピング**: URLからタイトル、画像、説明文を抽出
3. **AI分類**: OpenAI GPT 5.2で素材・ジャンル・カテゴリを自動分類
4. **データベース保存**: Cloudflare D1に保存
5. **Web表示**: Next.js + Cloudflare Pagesで閲覧

---

## システム構成

```
Discord Channel
      ↓
Cron Trigger (毎時) → Cloudflare Workers → Cloudflare D1
                            ↑
                       OpenAI GPT 5.2
                            ↓
              Cloudflare Pages ← Workers API
```

| 項目 | 技術 |
|------|------|
| フロントエンド | Next.js 15 (App Router) + Tailwind CSS |
| ホスティング | Cloudflare Pages |
| バックエンド | Cloudflare Workers (TypeScript) |
| データベース | Cloudflare D1 (SQLite) |
| Discord連携 | REST API + Cron Triggers |
| AI分類 | OpenAI GPT 5.2 |

---

## 主な機能

### データ収集（Cloudflare Workers）

- Cron Triggerで毎日自動実行（日本時間9:00）
- Discord REST APIでメッセージ取得
- OGPスクレイピング
- OpenAI GPTによる自動分類
- D1への自動登録
- 重複URL自動スキップ
- KVで実行履歴管理

### フロントエンド（Next.js + Cloudflare Pages）

- レシピ一覧表示（投稿日時の新しい順）
- ジャンル別フィルタリング
- レスポンシブデザイン（モバイルファースト）
- レシピカード表示
  - タイトル、サムネイル画像
  - ジャンル・カテゴリバッジ
  - 素材タグ、説明文、投稿日時

---

## セットアップ

### 前提条件

- Node.js 18以上
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Cloudflareアカウント
- Discord Developer アカウント
- OpenAI APIキー

### 1. リポジトリのクローン

```bash
git clone https://github.com/yourusername/cooking-recipe-url.git
cd cooking-recipe-url
```

### 2. Cloudflare D1のセットアップ

```bash
cd workers

# D1データベース作成
wrangler d1 create recipe-db

# wrangler.tomlのdatabase_idを更新

# スキーマ適用
wrangler d1 execute recipe-db --file=./schema.sql --remote
```

### 3. Cloudflare KVのセットアップ

```bash
# KV namespace作成
wrangler kv:namespace create RECIPE_KV

# wrangler.tomlのidを更新
```

### 4. Workersのシークレット設定

```bash
wrangler secret put DISCORD_TOKEN
wrangler secret put DISCORD_CHANNEL_ID
wrangler secret put OPENAI_API_KEY
```

### 5. Discord Botのセットアップ

1. [Discord Developer Portal](https://discord.com/developers/applications)でアプリ作成
2. Bot作成、トークン取得
3. MESSAGE CONTENT INTENT 有効化
4. サーバーに招待（権限: Read Messages, Read Message History）
5. チャンネルIDを取得

### 6. フロントエンドのセットアップ

```bash
cd frontend
npm install
```

---

## 開発

### Workers開発

```bash
cd workers
npm install
wrangler dev
```

ローカルで `http://localhost:8787` で動作確認。

### フロントエンド開発

```bash
cd frontend
npm run dev
```

ブラウザで http://localhost:3000 を開く。

---

## デプロイ

### Workersのデプロイ

```bash
cd workers
wrangler deploy
```

### Pagesのデプロイ

```bash
cd frontend
npm run pages:deploy
```

Cloudflare Dashboard → Pages → Settings → Functions → Compatibility flags で `nodejs_compat` を設定。

---

## プロジェクト構造

```
cooking-recipe-url/
├── README.md
├── CLAUDE.md                     # Claude Code用ガイド
├── docs/
│   └── requirements.md
├── workers/                      # Cloudflare Workers
│   ├── wrangler.toml             # Workers設定
│   ├── schema.sql                # D1スキーマ
│   ├── package.json
│   └── src/
│       ├── index.ts              # エントリーポイント
│       ├── services/
│       │   ├── discord.ts        # Discord REST API
│       │   ├── scraper.ts        # OGPスクレイパー
│       │   └── classifier.ts     # OpenAI GPT分類
│       ├── repositories/
│       │   └── recipe.ts         # D1アクセス層
│       └── types/
│           └── index.ts
└── frontend/                     # Next.js + Cloudflare Pages
    ├── wrangler.toml             # Pages設定
    ├── package.json
    ├── app/
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── RecipeList.tsx
    │   └── RecipeCard.tsx
    └── lib/
        └── api.ts                # Workers APIクライアント
```

---

## API エンドポイント

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/recipes` | GET | 全レシピ取得 |
| `/api/recipes/:id` | GET | レシピ詳細取得 |
| `/api/health` | GET | ヘルスチェック |
| `/api/collect` | POST | 手動収集トリガー |

---

## コスト見積もり

### 想定月額コスト: ほぼ無料

| サービス | 無料枠 | 想定使用量 | 月額コスト |
|---------|--------|-----------|-----------|
| Cloudflare Workers | 10万リクエスト/日 | 数千リクエスト | $0 |
| Cloudflare D1 | 5GB | 数MB | $0 |
| Cloudflare Pages | 無制限 | - | $0 |
| Cloudflare KV | 10万読み取り/日 | 数百 | $0 |
| OpenAI API | 従量課金 | 数百トークン/レシピ | ~$1-5 |
| **合計** | - | - | **~$1-5** |

---

## ライセンス

MIT License

---

## 謝辞

- [Cloudflare](https://cloudflare.com) - Workers, D1, Pages, KV
- [Next.js](https://nextjs.org) - フロントエンドフレームワーク
- [OpenAI](https://openai.com) - GPT API
- [Tailwind CSS](https://tailwindcss.com) - スタイリング
