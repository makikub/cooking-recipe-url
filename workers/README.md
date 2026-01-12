# Recipe Collector Workers

Cloudflare Workers + D1 を使用したレシピ収集バックエンド

## セットアップ

### 1. 依存パッケージのインストール

```bash
cd workers
npm install
```

### 2. D1データベースの作成

```bash
# D1データベース作成
npm run d1:create
# 出力されたdatabase_idをwrangler.tomlに設定

# スキーマ適用
npm run d1:migrate
```

### 3. KVネームスペースの作成

```bash
npm run kv:create
# 出力されたidをwrangler.tomlに設定
```

### 4. wrangler.tomlの設定

```toml
[[d1_databases]]
binding = "DB"
database_name = "recipe-db"
database_id = "<作成したdatabase_id>"

[[kv_namespaces]]
binding = "KV"
id = "<作成したnamespace_id>"
```

### 5. シークレットの設定

```bash
wrangler secret put DISCORD_TOKEN
wrangler secret put DISCORD_CHANNEL_ID
wrangler secret put OPENAI_API_KEY
```

## 開発

```bash
# ローカル開発サーバー起動
npm run dev
```

APIエンドポイント:
- `GET /api/recipes` - 全レシピ取得
- `GET /api/recipes/:id` - レシピ詳細
- `GET /api/health` - ヘルスチェック
- `POST /api/collect` - 手動収集トリガー

## デプロイ

```bash
npm run deploy
```

## データ移行（Supabaseから）

```bash
# 環境変数を設定
export SUPABASE_URL=https://xxxxx.supabase.co
export SUPABASE_SERVICE_KEY=your_service_key

# SQLファイル生成
npm run migrate:from-supabase > migration.sql

# D1に適用
wrangler d1 execute recipe-db --file=./migration.sql
```

## ディレクトリ構造

```
workers/
├── wrangler.toml         # Workers設定
├── schema.sql            # D1スキーマ
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # エントリーポイント
│   ├── types/
│   │   └── index.ts      # 型定義
│   ├── repositories/
│   │   └── recipe.ts     # D1アクセス層
│   └── services/
│       ├── discord.ts    # Discord REST API
│       ├── scraper.ts    # OGPスクレイピング
│       └── classifier.ts # OpenAI GPT 5.2分類
└── scripts/
    └── migrate-from-supabase.ts  # データ移行スクリプト
```

## Cronトリガー

毎時0分に自動実行されます（wrangler.tomlで設定）:

```toml
[triggers]
crons = ["0 * * * *"]
```
