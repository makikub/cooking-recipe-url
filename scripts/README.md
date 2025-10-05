# Pythonデータ収集スクリプト

Discordに投稿された料理レシピURLを自動収集・分類し、Supabaseに登録するスクリプトです。

## 📋 機能

- Discord Bot経由でメッセージ取得（指定チャンネルのみ）
- URLスクレイピング（タイトル、OGP画像、説明文）
- Claude APIによる自動分類（素材、ジャンル、カテゴリ）
- Supabaseへのデータ登録
- 実行履歴管理（差分取得）
- ログ出力

---

## 🚀 セットアップ

### 前提条件

- [pyenv](https://github.com/pyenv/pyenv) がインストールされていること
- [uv](https://github.com/astral-sh/uv) がインストールされていること

```bash
# pyenvのインストール（未インストールの場合）
curl https://pyenv.run | bash

# uvのインストール（未インストールの場合）
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 1. Pythonバージョンの設定

```bash
cd scripts

# pyenvでPython 3.12.11をインストール（未インストールの場合）
pyenv install 3.12.11

# プロジェクトでPython 3.12.11を使用
pyenv local 3.12.11
```

### 2. 依存関係のインストール

```bash
# uvで依存関係をインストール
uv sync
```

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成：

```bash
cp .env.example .env
```

`.env` を編集して各種キーを設定：

```env
# Discord
DISCORD_TOKEN=your_bot_token_here
DISCORD_CHANNEL_ID=1234567890

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Claude API
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

## 🔑 Discord Bot設定

### Bot作成手順

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. 「New Application」をクリック
3. アプリ名を入力（例: `recipe-collector`）
4. 左メニューから「Bot」を選択
5. 「Add Bot」をクリック
6. 「Reset Token」をクリックしてトークンを取得
   - ⚠️ トークンは一度しか表示されないのでコピーしておく
7. 「Privileged Gateway Intents」で以下を有効化：
   - ✅ MESSAGE CONTENT INTENT

### Bot招待

1. 左メニューから「OAuth2」→「URL Generator」を選択
2. 「SCOPES」で `bot` を選択
3. 「BOT PERMISSIONS」で以下を選択：
   - ✅ Read Messages/View Channels
   - ✅ Read Message History
4. 生成されたURLをコピーしてブラウザで開く
5. 招待先のサーバーを選択

### チャンネルID取得

1. Discordの設定 → 詳細設定 → 開発者モード ON
2. 対象チャンネルを右クリック → 「IDをコピー」

---

## 📝 使い方

### 基本的な実行

```bash
cd scripts
uv run python collector.py
```

### 初回実行

- チャンネル内の全メッセージを取得
- URL含むメッセージのみ処理
- 実行履歴を `last_run.json` に保存

### 2回目以降

- 前回実行日時以降のメッセージのみ取得
- 差分のみ処理（効率的）

### テスト実行

各モジュールを個別にテスト可能：

```bash
# Discord連携テスト
uv run python discord_client.py

# スクレイピングテスト
uv run python scraper.py

# AI分類テスト
uv run python classifier.py
```

---

## 📂 ファイル構成

```
scripts/
├── collector.py          # メインスクリプト
├── discord_client.py     # Discord連携
├── scraper.py            # スクレイピング処理
├── classifier.py         # AI分類処理
├── pyproject.toml        # プロジェクト設定・依存関係（uv用）
├── uv.lock               # 依存関係ロックファイル（uv自動生成）
├── .python-version       # Pythonバージョン指定（pyenv用）
├── .env.example          # 環境変数テンプレート
├── .env                  # 環境変数（Git除外）
├── last_run.json         # 実行履歴（自動生成）
└── logs/                 # ログ出力先（自動生成）
    └── collector_YYYYMMDD_HHMMSS.log
```

---

## 🔍 処理フロー

1. **Discord連携**
   - 指定チャンネルからメッセージ取得
   - URL含むメッセージのみ抽出

2. **スクレイピング**
   - URLにアクセス
   - タイトル、OGP画像、説明文を取得
   - 失敗時はスキップ

3. **AI分類**
   - Claude APIで自動分類
   - 素材、ジャンル、カテゴリを抽出

4. **DB登録**
   - Supabaseにデータ登録
   - 重複URLは自動スキップ

5. **実行履歴保存**
   - 最終実行日時を記録
   - 次回は差分のみ取得

---

## 📊 ログ出力

### ログファイル

- 場所: `logs/collector_YYYYMMDD_HHMMSS.log`
- 形式: タイムスタンプ + レベル + メッセージ
- 標準出力にも同時出力

### ログレベル

- `INFO`: 通常の処理状況
- `WARNING`: スクレイピング失敗など
- `ERROR`: API接続エラーなど

---

## 🛠️ トラブルシューティング

### Discord接続エラー

```
Discord Bot Token が無効です
```

→ `.env` の `DISCORD_TOKEN` を確認

### チャンネルが見つからない

```
チャンネルが見つかりません: 1234567890
```

→ チャンネルIDが正しいか確認
→ Botがそのチャンネルにアクセスできるか確認

### MESSAGE CONTENT INTENTエラー

```
Privileged intent provided is not enabled or whitelisted
```

→ Discord Developer Portalで MESSAGE CONTENT INTENT を有効化

### スクレイピング失敗

```
タイトル取得失敗: https://...
```

→ 正常動作（失敗したURLはスキップされる）
→ サイトがアクセスを拒否している可能性

### Claude APIエラー

```
Rate limit exceeded
```

→ API利用制限に達した
→ 少し待ってから再実行

---

## 💰 コスト見積もり

### Claude API

- モデル: `claude-3-5-sonnet-20241022`
- 1リクエスト: 約$0.01〜0.05
- 月100件処理: $1〜5

### 無料枠

- Discord API: 無料
- Supabase: 無料枠内で運用可能

---

## 📚 参考リンク

- [Discord.py Documentation](https://discordpy.readthedocs.io/)
- [BeautifulSoup Documentation](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- [Claude API Documentation](https://docs.anthropic.com/)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)

---

## ✨ 次のステップ

1. Discord Botを作成・招待
2. `.env` に認証情報を設定
3. `python discord_client.py` でテスト実行
4. 問題なければ `python collector.py` で本番実行

詳細は `../docs/requirements.md` を参照してください。
