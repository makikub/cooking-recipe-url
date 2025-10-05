# 🍳 料理レシピURL管理システム

Discordに投稿された料理レシピURLを自動収集・分類し、見やすいWebサイトで閲覧できるシステム

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.2.0-black)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

---

## 📋 目次

- [概要](#概要)
- [システム構成](#システム構成)
- [主な機能](#主な機能)
- [技術スタック](#技術スタック)
- [セットアップ](#セットアップ)
- [使い方](#使い方)
- [プロジェクト構造](#プロジェクト構造)
- [開発](#開発)
- [デプロイ](#デプロイ)
- [トラブルシューティング](#トラブルシューティング)
- [今後の拡張](#今後の拡張)

---

## 🎯 概要

このシステムは、Discordの特定チャンネルに投稿された料理レシピURLを自動的に収集し、以下の処理を行います：

1. **自動収集**: Discord Botでメッセージを取得
2. **スクレイピング**: URLからタイトル、画像、説明文を抽出
3. **AI分類**: ローカルのClaude（`claude -p`）で素材・ジャンル・カテゴリを自動分類
4. **データベース保存**: Supabaseに保存
5. **Web表示**: Next.jsで美しいUIで閲覧

---

## 🏗️ システム構成

```
Discord → Pythonスクリプト → Supabase (PostgreSQL)
                                    ↓
                          Next.js Web UI (Vercel)
```

### アーキテクチャ詳細

- **データ収集**: Python（ローカル実行・月1回手動）+ Claude Code
- **データベース**: Supabase (PostgreSQL)
- **フロントエンド**: Next.js 14 + Vercel
- **AI分類**: ローカルのClaude Code（`claude -p`コマンド）

---

## ✨ 主な機能

### データ収集（Pythonスクリプト）

- ✅ Discord Bot経由でメッセージ取得（指定1チャンネル）
- ✅ 初回：全件取得、2回目以降：差分のみ取得
- ✅ URLスクレイピング（OGP優先）
- ✅ Claude（ローカル）による完全自動分類
- ✅ Supabaseへ自動登録
- ✅ 重複URL自動スキップ
- ✅ 実行履歴管理

### フロントエンド（Next.js）

- ✅ レシピ一覧表示（投稿日時の新しい順）
- ✅ レスポンシブデザイン（モバイルファースト）
- ✅ レシピカード表示
  - タイトル
  - サムネイル画像
  - ジャンル・カテゴリバッジ
  - 素材タグ
  - 説明文
  - 投稿日時
- ✅ 外部リンク（新規タブで開く）

---

## 🔧 技術スタック

### フロントエンド

| 項目 | 技術 |
|------|------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Hosting | Vercel |
| Database Client | @supabase/supabase-js |

### バックエンド・DB

| 項目 | 技術 |
|------|------|
| Database | Supabase (PostgreSQL) |
| API | Supabase REST API |

### データ収集（Python）

| 項目 | 技術/ライブラリ |
|------|----------------|
| 言語 | Python 3.11+ |
| 実行環境 | ローカルPC（手動実行・月1回） |
| Discord API | discord.py |
| スクレイピング | BeautifulSoup4, requests |
| AI分類 | ローカルのClaude Code（`claude -p`） |
| DB連携 | supabase-py |
| 環境変数 | python-dotenv |

---

## 🚀 セットアップ

### 前提条件

- Node.js 18以上
- Python 3.11以上
- [pyenv](https://github.com/pyenv/pyenv) - Pythonバージョン管理
- [uv](https://github.com/astral-sh/uv) - 高速なPythonパッケージマネージャー
- Supabaseアカウント
- Discord Developer アカウント
- Claude Code（ローカルにインストール済み）

### 1. リポジトリのクローン

```bash
git clone https://github.com/yourusername/cooking-recipe-url.git
cd cooking-recipe-url
```

### 2. Supabaseのセットアップ

詳細は [`supabase/README.md`](supabase/README.md) を参照

1. [Supabase](https://supabase.com)でプロジェクト作成（リージョン: Tokyo）
2. SQL Editorで`supabase/schema.sql`を実行
3. API情報を取得：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`（フロントエンド用）
   - `SUPABASE_SERVICE_KEY`（Python用）

### 3. Discord Botのセットアップ

詳細は [`scripts/README.md`](scripts/README.md) を参照

1. [Discord Developer Portal](https://discord.com/developers/applications)でアプリ作成
2. Bot作成、トークン取得
3. MESSAGE CONTENT INTENT 有効化
4. サーバーに招待（権限: Read Messages, Read Message History）
5. チャンネルIDを取得

### 4. Pythonスクリプトのセットアップ

```bash
cd scripts

# Pythonバージョンの設定（pyenv）
pyenv install 3.12.11  # 未インストールの場合
pyenv local 3.12.11

# 依存関係インストール（uv）
uv sync

# 環境変数設定
cp .env.example .env
# .envを編集して各種キーを設定
```

`.env` の内容：

```env
# Discord
DISCORD_TOKEN=your_bot_token_here
DISCORD_CHANNEL_ID=1234567890

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

### 5. フロントエンドのセットアップ

```bash
cd frontend

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.localを編集
```

`.env.local` の内容：

```env
# Supabase（読み取り専用）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 📝 使い方

### データ収集（月1回実行）

```bash
cd scripts
uv run python collector.py
```

**実行内容：**
1. Discordから新しいメッセージを取得
2. URL含むメッセージのみ処理
3. スクレイピング → AI分類 → DB登録
4. 実行履歴を保存（次回は差分のみ取得）

**ログ確認：**
```bash
cat logs/collector_YYYYMMDD_HHMMSS.log
```

### フロントエンド開発サーバー起動

```bash
cd frontend
npm run dev
```

ブラウザで http://localhost:3000 を開く

---

## 📁 プロジェクト構造

```
cooking-recipe-url/
├── .gitignore                    # Git除外設定
├── README.md                     # このファイル
├── docs/
│   └── requirements.md           # 要件定義書
├── supabase/
│   ├── README.md                 # Supabaseセットアップ手順
│   └── schema.sql                # データベーススキーマ
├── scripts/                      # Pythonデータ収集スクリプト
│   ├── README.md                 # スクリプト使用方法
│   ├── collector.py              # メインスクリプト
│   ├── discord_client.py         # Discord連携
│   ├── scraper.py                # スクレイピング処理
│   ├── classifier.py             # AI分類処理
│   ├── pyproject.toml            # プロジェクト設定・依存関係（uv用）
│   ├── uv.lock                   # 依存関係ロックファイル（uv自動生成）
│   ├── .python-version           # Pythonバージョン指定（pyenv用）
│   ├── .env.example              # 環境変数テンプレート
│   ├── .env                      # 環境変数（Git除外）
│   ├── last_run.json             # 実行履歴（自動生成）
│   └── logs/                     # ログ出力先（自動生成）
└── frontend/                     # Next.jsアプリケーション
    ├── README.md                 # フロントエンド使用方法
    ├── app/
    │   ├── layout.tsx            # ルートレイアウト
    │   ├── page.tsx              # トップページ
    │   └── globals.css           # グローバルスタイル
    ├── components/
    │   ├── RecipeList.tsx        # レシピ一覧
    │   └── RecipeCard.tsx        # レシピカード
    ├── lib/
    │   └── supabase.ts           # Supabaseクライアント
    ├── public/
    │   └── default-recipe.png    # デフォルト画像（要追加）
    ├── .env.local                # 環境変数（Git除外）
    ├── .env.example              # 環境変数テンプレート
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    └── next.config.js
```

---

## 🛠️ 開発

### Pythonスクリプトのテスト

各モジュールを個別にテスト可能：

```bash
cd scripts

# Discord連携テスト
uv run python discord_client.py

# スクレイピングテスト
uv run python scraper.py

# AI分類テスト
uv run python classifier.py
```

### フロントエンドの開発

```bash
cd frontend
npm run dev
```

- ホットリロード有効
- http://localhost:3000 で確認

---

## 🚢 デプロイ

### Vercelへのデプロイ

1. Vercel CLIをインストール

```bash
npm install -g vercel
```

2. デプロイ

```bash
cd frontend
vercel
```

3. 環境変数を設定
   - Vercel Dashboard → Settings → Environment Variables
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🔍 トラブルシューティング

### Pythonスクリプト

**Discord接続エラー**
```
Discord Bot Token が無効です
```
→ `.env` の `DISCORD_TOKEN` を確認

**チャンネルが見つからない**
```
チャンネルが見つかりません
```
→ チャンネルIDが正しいか確認
→ Botがそのチャンネルにアクセスできるか確認

**Claude コマンドが見つからない**
```
claude コマンドが見つかりません
```
→ Claude Codeがインストールされているか確認
→ PATHが通っているか確認

### フロントエンド

**レシピが表示されない**
- Supabaseの認証情報が正しいか確認
- Pythonスクリプトでデータが登録されているか確認
- ブラウザのコンソールでエラーを確認

**画像が表示されない**
- `next.config.js` の `remotePatterns` 設定を確認
- デフォルト画像が存在するか確認

---

## 💰 コスト見積もり

### 想定月額コスト: ほぼ無料

| サービス | 無料枠 | 想定使用量 | 月額コスト |
|---------|--------|-----------|-----------|
| Supabase | 500MB DB、5万リクエスト/月 | 50MB、1万リクエスト | $0 |
| Vercel | 個人利用無制限 | 個人利用 | $0 |
| Claude Code | ローカル実行 | - | $0 |
| Discord API | 無料 | - | $0 |
| **合計** | - | - | **$0** |

---

## 📈 今後の拡張

### 優先度: 高

- [ ] パスワード認証機能
- [ ] フィルタリング機能（ジャンル、カテゴリ、素材）
- [ ] ソート機能（投稿日、お気に入り）
- [ ] 全文検索（タイトル、説明文）

### 優先度: 中

- [ ] お気に入り機能
- [ ] カテゴリ・タグの手動編集UI
- [ ] レシピメモ機能
- [ ] 調理時間・難易度の追加

### 優先度: 低

- [ ] 定期自動実行（GitHub Actions、Cloud Functionsなど）
- [ ] Slack対応
- [ ] モバイルアプリ化（PWA）
- [ ] 複数チャンネル対応

---

## 📄 ライセンス

MIT License

---

## 🙏 謝辞

- [Supabase](https://supabase.com) - データベース・API
- [Next.js](https://nextjs.org) - フロントエンドフレームワーク
- [Discord.py](https://discordpy.readthedocs.io/) - Discord API
- [Claude Code](https://www.anthropic.com/) - AI分類
- [Tailwind CSS](https://tailwindcss.com) - スタイリング

---

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. [トラブルシューティング](#トラブルシューティング)セクション
2. 各ディレクトリの`README.md`
3. `docs/requirements.md`（詳細な要件定義）

---

**作成日**: 2025-10-05  
**バージョン**: 1.0.0
