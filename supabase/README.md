# Supabase セットアップ手順

このドキュメントでは、料理レシピURL管理システムのSupabaseセットアップ手順を説明します。

## 📋 前提条件

- Supabaseアカウント（無料）
- ブラウザ

---

## 🚀 セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) にアクセスしてログイン
2. 「New Project」をクリック
3. プロジェクト情報を入力：
   - **Name**: `recipe-manager`（任意の名前）
   - **Database Password**: 強力なパスワードを設定（メモしておく）
   - **Region**: `Northeast Asia (Tokyo)` を選択（日本からのアクセスが速い）
   - **Pricing Plan**: `Free` を選択
4. 「Create new project」をクリック
5. プロジェクトの初期化を待つ（1〜2分）

### 2. データベーススキーマの作成

1. 左サイドバーから「SQL Editor」をクリック
2. 「New query」をクリック
3. `supabase/schema.sql` の内容をコピー＆ペースト
4. 「Run」ボタンをクリックしてSQLを実行
5. 「Success. No rows returned」と表示されればOK

### 3. テーブルの確認

1. 左サイドバーから「Table Editor」をクリック
2. `recipes` テーブルが作成されていることを確認
3. カラム一覧が表示されることを確認：
   - id (uuid)
   - url (text)
   - title (text)
   - image_url (text)
   - description (text)
   - ingredients (text[])
   - cuisine_type (text)
   - category (text)
   - posted_by (text)
   - posted_at (timestamp)
   - created_at (timestamp)
   - updated_at (timestamp)

### 4. API認証情報の取得

1. 左サイドバーから「Settings」→「API」をクリック
2. 以下の情報をメモする：

   **Project URL**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **API Keys**
   - `anon` `public` key（フロントエンド用・読み取り専用）
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   - `service_role` `secret` key（Python用・書き込み可能）
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   ⚠️ **重要**: `service_role` キーは絶対に公開しないこと！

### 5. Row Level Security (RLS) の設定

MVPでは個人利用のため、RLSは無効化します。

1. 左サイドバーから「Authentication」→「Policies」をクリック
2. `recipes` テーブルを選択
3. 「Enable RLS」がOFFになっていることを確認
   - もしONになっている場合は、OFFに切り替える

**将来的な対応**：複数ユーザー対応時にRLSを有効化します。

---

## 🔑 環境変数の設定

取得したAPI情報を環境変数ファイルに設定します。

### Pythonスクリプト用（`scripts/.env`）

```env
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（service_role key）
```

### Next.jsフロントエンド用（`frontend/.env.local`）

```env
# Supabase（読み取り専用）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（anon key）
```

---

## ✅ 動作確認

### テストデータの挿入

SQL Editorで以下を実行してテストデータを挿入：

```sql
INSERT INTO recipes (
  url,
  title,
  image_url,
  description,
  ingredients,
  cuisine_type,
  category,
  posted_by,
  posted_at
) VALUES (
  'https://cookpad.com/recipe/123456',
  'トマトとバジルのパスタ',
  'https://example.com/pasta.jpg',
  '新鮮なトマトとバジルを使ったシンプルなパスタです',
  ARRAY['トマト', 'バジル', 'パスタ', 'にんにく', 'オリーブオイル'],
  'イタリアン',
  '主菜',
  'テストユーザー',
  now()
);
```

### データの確認

1. Table Editorで `recipes` テーブルを開く
2. 1件のレコードが表示されることを確認
3. `id`、`created_at`、`updated_at` が自動生成されていることを確認

### テストデータの削除

確認後、テストデータを削除：

```sql
DELETE FROM recipes WHERE url = 'https://cookpad.com/recipe/123456';
```

---

## 📊 Supabase無料枠の制限

| 項目 | 制限 |
|------|------|
| データベース容量 | 500MB |
| APIリクエスト | 5万リクエスト/月 |
| ストレージ | 1GB |
| 帯域幅 | 2GB/月 |

**想定使用量**：
- レシピ数: 〜1000件（約50MB）
- 月間閲覧: 〜1万リクエスト

→ 無料枠で十分運用可能

---

## 🔧 トラブルシューティング

### SQL実行時にエラーが出る

- エラーメッセージを確認
- テーブルが既に存在する場合は、一度削除してから再実行：
  ```sql
  DROP TABLE IF EXISTS recipes CASCADE;
  ```

### API接続ができない

- Project URLが正しいか確認
- APIキーが正しいか確認（anonキーとservice_role keyを間違えていないか）
- ネットワーク接続を確認

### RLSエラーが出る

- RLSが無効化されているか確認
- Authentication → Policies で `recipes` テーブルのRLSをOFFに

---

## 📚 参考リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [PostgreSQL配列型](https://www.postgresql.org/docs/current/arrays.html)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

---

## ✨ 次のステップ

Supabaseのセットアップが完了したら、次は以下を実装します：

1. **Pythonスクリプト**：Discord連携、スクレイピング、AI分類
2. **Next.jsフロントエンド**：レシピ一覧表示、認証

詳細は `docs/requirements.md` を参照してください。
