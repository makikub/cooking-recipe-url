# 要件定義書：料理レシピURL管理システム

## 📋 プロジェクト概要
Discordに投稿された料理レシピURLを自動収集・分類し、見やすいWebサイトで閲覧できるシステム

作成日: 2025-10-05

---

## 🎯 システム構成

```
Discord → Pythonスクリプト → Supabase (PostgreSQL)
                                    ↓
                          Next.js Web UI (Vercel)
```

### アーキテクチャ詳細
- **データ収集**: Python（ローカル実行・手動）+ Claude Code
- **データベース**: Supabase (PostgreSQL)
- **フロントエンド**: Next.js 14 + Vercel
- **認証**: 環境変数ベースのシンプルなパスワード

---

## 📁 プロジェクト構成

### リポジトリ構造

```
recipe-manager/
├── .gitignore                   # 重要！機密情報を除外
├── README.md                    # プロジェクト概要、セットアップ手順
├── docs/
│   └── requirements.md          # この要件定義書
├── frontend/                    # Next.jsアプリケーション
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # レシピ一覧ページ
│   │   ├── login/
│   │   │   └── page.tsx        # ログインページ
│   │   └── api/
│   │       └── auth/           # 認証API
│   ├── components/
│   │   ├── RecipeList.tsx      # レシピ一覧コンポーネント
│   │   ├── RecipeCard.tsx      # レシピカード（リスト項目）
│   │   └── AuthGuard.tsx       # 認証ガード
│   ├── lib/
│   │   ├── supabase.ts         # Supabaseクライアント
│   │   └── auth.ts             # 認証ロジック
│   ├── public/
│   │   └── default-recipe.png  # デフォルト画像
│   ├── .env.local
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.ts
│   └── next.config.js
└── scripts/                     # Pythonデータ収集スクリプト
    ├── collector.py             # メインスクリプト
    ├── scraper.py               # スクレイピング処理
    ├── classifier.py            # AI分類処理
    ├── requirements.txt         # Python依存関係
    ├── .env.example
    ├── .env
    ├── last_run.json            # 実行履歴（自動生成）
    └── logs/                    # ログ出力先（自動生成）
        └── collector_YYYYMMDD.log
```

### ファイルの役割

**フロントエンド（Next.js）**
- `app/page.tsx`: レシピ一覧を表示するメインページ
- `app/login/page.tsx`: パスワード認証画面
- `components/RecipeList.tsx`: レシピ一覧の表示ロジック
- `lib/supabase.ts`: Supabaseクライアントの初期化

**データ収集（Python）**
- `collector.py`: Discord→スクレイピング→AI分類→DB登録の全体フロー
- `scraper.py`: URL情報取得（OGP、タイトルなど）
- `classifier.py`: Claude APIでの自動分類
- `last_run.json`: 最終実行日時を記録（次回の差分取得に使用）

---

## 🗄️ データベース設計

### recipesテーブル

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | uuid | PRIMARY KEY | レシピID |
| url | text | UNIQUE, NOT NULL | レシピURL |
| title | text | NOT NULL | レシピタイトル |
| image_url | text | NULLABLE | OGP画像URL（なければデフォルト画像使用） |
| description | text | NULLABLE | レシピ説明文 |
| ingredients | text[] | | 素材タグの配列（例: ["鶏肉", "トマト", "バジル"]） |
| cuisine_type | text | | ジャンル（例: "イタリアン", "和食", "中華"） |
| category | text | | カテゴリ（例: "主菜", "副菜", "デザート"） |
| posted_by | text | | Discord投稿者名（**UIには非表示、DB内部のみ保存**） |
| posted_at | timestamp | | Discord投稿日時 |
| created_at | timestamp | DEFAULT now() | レコード作成日時 |
| updated_at | timestamp | DEFAULT now() | レコード更新日時 |

### SQL作成文

```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  ingredients TEXT[],
  cuisine_type TEXT,
  category TEXT,
  posted_by TEXT,
  posted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- インデックス（パフォーマンス最適化）
CREATE INDEX idx_recipes_posted_at ON recipes(posted_at DESC);
CREATE INDEX idx_recipes_cuisine_type ON recipes(cuisine_type);
CREATE INDEX idx_recipes_category ON recipes(category);
```

### Supabase RLS（Row Level Security）

**MVP では RLS を無効化**（個人利用のため）
- フロントエンドからは `anon key` で読み取り専用アクセス
- Pythonスクリプトからは `service_role_key` で書き込み

将来的に複数ユーザー対応する場合は RLS を有効化する。

---

## 🔧 技術スタック

### フロントエンド
| 項目 | 技術 | 備考 |
|------|------|------|
| Framework | Next.js 14 (App Router) | React Server Components活用 |
| Styling | Tailwind CSS | ユーティリティファースト、**モバイルファースト設計** |
| Hosting | Vercel | 無料枠で運用 |
| Database Client | @supabase/supabase-js | Supabase公式クライアント |
| 認証 | 環境変数 + Cookie | パスワード認証（セッション有効期限: 1週間） |

### バックエンド・DB
| 項目 | 技術 | 備考 |
|------|------|------|
| Database | Supabase (PostgreSQL) | 無料枠: 500MB, 5万リクエスト/月 |
| API | Supabase REST API | 自動生成 |

### データ収集（Python）
| 項目 | 技術/ライブラリ | 用途 |
|------|----------------|------|
| 言語 | Python 3.11+ | |
| 実行環境 | ローカルPC（手動実行・月1回） | venv使用推奨 |
| Discord API | discord.py | メッセージ取得（特定1チャンネル） |
| スクレイピング | BeautifulSoup4, requests | URL情報取得（OGP優先） |
| AI分類 | anthropic (Claude API) | 自動カテゴライズ（完全自動） |
| DB連携 | supabase-py | データ登録 |
| 環境変数 | python-dotenv | 認証情報管理 |

---

## ✨ 機能要件

### MVP（最小実装）

#### フロントエンド機能

**実装する機能**
- ✅ レシピ一覧をリスト形式で表示（**投稿日時の新しい順**）
  - タイトル
  - サムネイル画像（image_url、なければデフォルト画像）
  - ジャンル（cuisine_type）表示
  - カテゴリ（category）表示
  - 投稿日時（posted_at）
  - **投稿者名は非表示**（プライバシー保護のため）
- ✅ URLクリックで元のレシピサイトへ遷移（新規タブ）
- ✅ シンプルなパスワード認証
  - 環境変数で設定したパスワードで保護
  - ログイン画面
  - セッション有効期限: **1週間**
- ✅ **モバイルファースト設計**（スマホでの閲覧を優先）

**実装しない機能（将来拡張）**
- ❌ お気に入り機能（将来的に追加検討）
- ❌ フィルタリング機能（素材、ジャンル）
- ❌ ソート機能（日付順など）
- ❌ 検索機能（全文検索）
- ❌ カード表示への切り替え
- ❌ タグ・カテゴリの手動編集UI

#### データ収集機能（Pythonスクリプト）

**実装する機能**
- ✅ Discord Bot経由でメッセージ取得
  - **指定した1チャンネルのみ**監視
  - 初回: 全メッセージ取得（チャンネル作成直後なので少量）
  - 2回目以降: 前回実行日時以降のメッセージのみ取得
  - **URL含むメッセージのみ抽出**（レシピURL以外も投稿されるが、URL形式のみ処理）
- ✅ URLスクレイピング
  - タイトル取得（`<title>`タグ）
  - OGP画像取得（`og:image`）
  - 説明文取得（`og:description`または`description`）
  - **主要サイト**: クックパッド、DELISH KITCHENなど（国内サイトのみ）
- ✅ Claude APIで自動分類（**完全自動、手動確認なし**）
  - 素材（ingredients）: 配列形式で抽出
  - ジャンル（cuisine_type）: イタリアン、和食、中華、フレンチなど
  - カテゴリ（category）: 主菜、副菜、デザート、スープなど
- ✅ Supabaseへデータ登録
  - 重複URL防止（UNIQUE制約）
  - **スクレイピング失敗時はスキップ**（DBに登録しない）
  - エラーハンドリング
- ✅ ログ出力
  - 処理状況の可視化
  - エラー詳細の記録
- ✅ 実行履歴管理
  - 最終実行日時を記録（次回実行時の開始点として使用）

**実装しない機能（将来拡張）**
- ❌ 定期自動実行（cron） ※月1回手動実行で運用
- ❌ Slack対応
- ❌ 手動確認フロー（AI分類結果の承認） ※完全自動で割り切る
- ❌ 複数チャンネル対応

### 将来的な拡張候補

**優先度: 高**
- お気に入り機能（ON/OFF切り替え）
- フィルタリング機能（素材、ジャンル、お気に入り）
- ソート機能（投稿日、お気に入り）
- 全文検索（タイトル、説明文）

**優先度: 中**
- カテゴリ・タグの手動編集UI（AI分類の修正）
- カード表示への切り替え
- レシピメモ機能
- 調理時間・難易度の追加

**優先度: 低**
- 定期自動実行（GitHub Actions、Cloud Functionsなど）
- Slack対応
- Supabase Auth への移行
- モバイルアプリ化（PWA）
- 複数チャンネル対応

---

## 🔐 認証・公開範囲

### 認証方式
- **個人向け限定公開**（自分のみアクセス）
- 環境変数によるシンプルなパスワード認証
  - `NEXT_PUBLIC_APP_PASSWORD` で設定
  - セッション管理（Cookie）
  - **セッション有効期限: 1週間**

### 将来的な移行
- Supabase Auth への移行を検討（複数ユーザー対応時）
  - メールアドレス認証
  - OAuth（Google、GitHubなど）

---

## 💰 コスト見積もり

### 想定月額コスト: ほぼ無料 〜 数ドル

| サービス | 無料枠 | 想定使用量 | 月額コスト |
|---------|--------|-----------|-----------|
| Supabase | 500MB DB、5万リクエスト/月 | 50MB、1万リクエスト | $0 |
| Vercel | 個人利用無制限 | 個人利用 | $0 |
| Claude API | 従量課金 | 月100〜500リクエスト | $1-5 |
| Discord API | 無料 | - | $0 |
| **合計** | - | - | **$1-5** |

### コスト最適化のポイント
- Supabaseの無料枠内で運用
- Claude APIは収集時のみ使用（閲覧時は不要）
- Vercelの無料枠で十分

---

## 📝 実装の順序

### Phase 1: 環境構築（1日目）
1. **Supabaseセットアップ**
   - [ ] プロジェクト作成（リージョン: Tokyo）
   - [ ] recipesテーブル作成（SQL実行）
   - [ ] API情報取得（URL、anon key、service role key）

2. **Discord Bot作成**
   - [ ] Discord Developer Portalでアプリ作成
   - [ ] Bot作成、トークン取得
   - [ ] MESSAGE CONTENT INTENT有効化
   - [ ] サーバーに招待

### Phase 2: フロントエンド構築（2-3日目）
1. **Next.jsプロジェクト初期化**
   - [ ] `npx create-next-app@latest`
   - [ ] Tailwind CSS設定
   - [ ] Supabaseクライアント設定

2. **基本UI実装**
   - [ ] レシピ一覧ページ（投稿日時降順）
   - [ ] リスト表示コンポーネント（**モバイルファースト**）
   - [ ] デフォルト画像の準備（OGP画像なし時用）

3. **認証実装**
   - [ ] パスワード認証画面
   - [ ] Cookie-based セッション管理（有効期限: 1週間）

4. **デプロイ**
   - [ ] Vercelへデプロイ
   - [ ] 環境変数設定

### Phase 3: データ収集スクリプト（4-5日目）※Claude Code使用
1. **環境構築**
   - [ ] venv作成
   - [ ] requirements.txt作成
   - [ ] .env設定

2. **基本構造**
   - [ ] Discord API連携（特定1チャンネル）
   - [ ] メッセージ取得（初回: 全件、2回目以降: 差分）
   - [ ] URL抽出（URL形式のみ）

3. **スクレイピング実装**
   - [ ] URL情報取得（タイトル、OGP画像、説明）
   - [ ] エラーハンドリング（**失敗時はスキップ**）
   - [ ] 主要サイト対応確認（クックパッド、DELISH KITCHEN）

4. **AI分類実装**
   - [ ] Claude API連携
   - [ ] プロンプト設計（素材、ジャンル、カテゴリ抽出）
   - [ ] レスポンスパース

5. **DB登録**
   - [ ] Supabase連携
   - [ ] データ登録処理
   - [ ] 重複チェック

6. **実行履歴管理**
   - [ ] 最終実行日時の記録・読み込み
   - [ ] ログ出力

7. **テスト実行**
   - [ ] 小規模データでテスト
   - [ ] 本番データ投入

### Phase 4: 動作確認・調整（6日目）
- [ ] 全体の動作確認
- [ ] UI調整
- [ ] エラー対応
- [ ] ドキュメント整備

---

## 🔍 Discord データ取得詳細

### Bot設定手順

1. **Discord Developer Portal**
   - https://discord.com/developers/applications
   - New Application作成

2. **Bot設定**
   - Botタブ → Add Bot
   - Token取得（`.env`で管理）
   - Privileged Gateway Intents → MESSAGE CONTENT INTENT 有効化

3. **権限設定**
   - `Read Messages/View Channels`
   - `Read Message History`

4. **招待URL生成**
   - OAuth2 → URL Generator
   - SCOPES: `bot`
   - PERMISSIONS: Read Messages, Read Message History

### チャンネルID取得
1. Discord設定 → 詳細設定 → 開発者モード ON
2. 対象チャンネル右クリック → IDをコピー
3. **監視対象は1チャンネルのみ**

### 環境変数

**Pythonスクリプト用（`scripts/.env`）**

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

**Next.jsフロントエンド用（`frontend/.env.local`）**

```env
# Supabase（読み取り専用）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# 認証
NEXT_PUBLIC_APP_PASSWORD=your_password_here
```

---

## 🤖 AI分類プロンプト設計

### Claude APIプロンプト例

```python
CLASSIFICATION_PROMPT = """
以下のレシピ情報から、素材・ジャンル・カテゴリを抽出してください。

【レシピ情報】
タイトル: {title}
説明: {description}
URL: {url}

【抽出ルール】
1. 素材（ingredients）: レシピで使われている主要な食材を配列で返す（最大5つ）
   例: ["鶏肉", "トマト", "玉ねぎ", "にんにく", "バジル"]

2. ジャンル（cuisine_type）: 料理のジャンルを1つ選択
   選択肢: "和食", "洋食", "中華", "イタリアン", "フレンチ", "エスニック", "その他"

3. カテゴリ（category）: 料理の種類を1つ選択
   選択肢: "主菜", "副菜", "汁物", "ご飯・麺", "デザート", "その他"

【出力形式】
必ずJSON形式で返してください。他の説明文は不要です。

{{
  "ingredients": ["素材1", "素材2", "素材3"],
  "cuisine_type": "ジャンル",
  "category": "カテゴリ"
}}
"""
```

### レスポンスパース例

```python
import json
import anthropic

def classify_recipe(title: str, description: str, url: str) -> dict:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    prompt = CLASSIFICATION_PROMPT.format(
        title=title,
        description=description or "説明なし",
        url=url
    )
    
    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    # レスポンスからJSONを抽出
    response_text = message.content[0].text
    
    # JSONブロックを抽出（```json ... ```の場合に対応）
    if "```json" in response_text:
        json_text = response_text.split("```json")[1].split("```")[0].strip()
    elif "```" in response_text:
        json_text = response_text.split("```")[1].split("```")[0].strip()
    else:
        json_text = response_text.strip()
    
    result = json.loads(json_text)
    
    return {
        "ingredients": result.get("ingredients", []),
        "cuisine_type": result.get("cuisine_type", "その他"),
        "category": result.get("category", "その他")
    }
```

---

## 📊 実装詳細

### 実行履歴管理

**保存形式（`scripts/last_run.json`）**

```json
{
  "last_run_at": "2025-10-05T15:30:00+09:00",
  "processed_count": 15,
  "success_count": 12,
  "failed_count": 3,
  "failed_urls": [
    "https://example.com/recipe1",
    "https://example.com/recipe2"
  ]
}
```

**実装例**

```python
import json
from datetime import datetime
from pathlib import Path

LAST_RUN_FILE = Path(__file__).parent / "last_run.json"

def load_last_run() -> datetime | None:
    """最終実行日時を読み込む"""
    if not LAST_RUN_FILE.exists():
        return None
    
    with open(LAST_RUN_FILE, "r") as f:
        data = json.load(f)
        return datetime.fromisoformat(data["last_run_at"])

def save_last_run(stats: dict):
    """実行結果を保存"""
    data = {
        "last_run_at": datetime.now().isoformat(),
        "processed_count": stats["processed"],
        "success_count": stats["success"],
        "failed_count": stats["failed"],
        "failed_urls": stats["failed_urls"]
    }
    
    with open(LAST_RUN_FILE, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
```

### ログ出力

**形式**
- ファイル名: `logs/collector_YYYYMMDD_HHMMSS.log`
- レベル: INFO, WARNING, ERROR
- 標準出力にも同時出力

**実装例**

```python
import logging
from datetime import datetime
from pathlib import Path

def setup_logger():
    """ロガーのセットアップ"""
    log_dir = Path(__file__).parent / "logs"
    log_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = log_dir / f"collector_{timestamp}.log"
    
    # ロガー設定
    logger = logging.getLogger("recipe_collector")
    logger.setLevel(logging.INFO)
    
    # ファイルハンドラ
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setLevel(logging.INFO)
    
    # コンソールハンドラ
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # フォーマット
    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

# 使用例
logger = setup_logger()
logger.info("データ収集を開始します")
logger.warning("スクレイピング失敗: https://example.com")
logger.error("Claude API エラー: Rate limit exceeded")
```

### デフォルト画像

**仕様**
- ファイル名: `frontend/public/default-recipe.png`
- サイズ: 1200x630px（OGP標準サイズ）
- デザイン: シンプルな料理アイコン + 背景色
- 代替案: Unsplash APIで料理の汎用画像を使用

**実装での使用**

```tsx
// RecipeCard.tsx
const imageUrl = recipe.image_url || '/default-recipe.png';

<img 
  src={imageUrl} 
  alt={recipe.title}
  className="w-full h-48 object-cover"
  onError={(e) => {
    e.currentTarget.src = '/default-recipe.png';
  }}
/>
```

### UIでの表示項目

**表示する項目**
- タイトル（title）
- サムネイル画像（image_url）
- ジャンル（cuisine_type）
- カテゴリ（category）
- 投稿日時（posted_at）
- 素材タグ（ingredients）※将来的にフィルタリング用

**表示しない項目**
- ❌ 投稿者名（posted_by）- プライバシー保護のため非表示
  - DBには保存するが、UIには表示しない
  - フロントエンドのSELECTクエリから除外

```typescript
// フロントエンドでのデータ取得例
const { data: recipes } = await supabase
  .from('recipes')
  .select('id, url, title, image_url, description, ingredients, cuisine_type, category, posted_at, created_at')
  // posted_by は取得しない
  .order('posted_at', { ascending: false })
```

### エラーハンドリング

**スクレイピング失敗時の処理**

```python
def scrape_url(url: str) -> dict | None:
    """URLから情報を取得（失敗時はNoneを返す）"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "html.parser")
        
        # タイトル取得
        title = None
        og_title = soup.find("meta", property="og:title")
        if og_title:
            title = og_title.get("content")
        else:
            title_tag = soup.find("title")
            title = title_tag.string if title_tag else None
        
        if not title:
            logger.warning(f"タイトル取得失敗: {url}")
            return None
        
        # OGP画像
        image_url = None
        og_image = soup.find("meta", property="og:image")
        if og_image:
            image_url = og_image.get("content")
        
        # 説明文
        description = None
        og_desc = soup.find("meta", property="og:description")
        if og_desc:
            description = og_desc.get("content")
        else:
            meta_desc = soup.find("meta", attrs={"name": "description"})
            if meta_desc:
                description = meta_desc.get("content")
        
        return {
            "title": title,
            "image_url": image_url,
            "description": description
        }
        
    except requests.exceptions.Timeout:
        logger.warning(f"タイムアウト: {url}")
        return None
    except requests.exceptions.RequestException as e:
        logger.warning(f"リクエストエラー: {url} - {e}")
        return None
    except Exception as e:
        logger.error(f"予期しないエラー: {url} - {e}")
        return None
```

---

## 📚 参考資料・ドキュメント

### 公式ドキュメント
- [Discord.py Documentation](https://discordpy.readthedocs.io/)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Claude API Documentation](https://docs.anthropic.com/)
- [Vercel Documentation](https://vercel.com/docs)

### 技術記事・参考
- Discord Bot作成ガイド
- Supabase + Next.js統合
- BeautifulSoupスクレイピング
- Claude API活用例

---

## 🚀 成功基準

### MVP完成の定義
- [ ] Discordから手動でデータ取得できる（月1回実行想定）
- [ ] レシピが自動分類されてDBに保存される
- [ ] Webサイトでレシピ一覧が見られる（投稿日時降順）
- [ ] パスワード認証で保護されている（セッション1週間）
- [ ] Vercelで公開されている
- [ ] **スマホで快適に閲覧できる**

### 品質基準
- レスポンスタイム: 3秒以内
- **モバイルファースト**: スマホでの閲覧を最優先
- エラーハンドリング: 適切なエラーメッセージ表示
- スクレイピング失敗時: スキップして次へ

---

## 📝 メモ・備考

### 技術的な判断
- Next.js App Routerを採用（最新の推奨）
- Claude Codeを活用してPython実装を効率化
- MVPは最小限、拡張性を考慮した設計
- **モバイルファースト設計**（主な閲覧環境がスマホ）
- Python実行環境: ローカルPC + venv

### 運用方針
- データ収集: **月1回手動実行**
- 対象チャンネル: **1チャンネルのみ**
- AI分類: **完全自動**（手動確認なし）
- スクレイピング失敗: **スキップ**（DBに登録しない）

### リスク・懸念事項
- Claude API利用料が想定より高くなる可能性
  → 月1回実行なので影響は限定的
- スクレイピングが失敗するサイトがある可能性
  → スキップして次へ、エラーログで確認
- OGP画像がないサイト
  → デフォルト画像で対応

### その他
- README.mdに開発環境セットアップ手順を記載
- `.env.example`でテンプレート提供
- requirements.txtでPython依存関係管理

---

## 🔒 セキュリティとGit管理

### Publicリポジトリにする場合の注意事項

**このプロジェクトはPublicリポジトリで公開可能**ですが、以下の対策が必須です。

### .gitignore設定（必須）

リポジトリルートに `.gitignore` を作成：

```gitignore
# 環境変数（絶対にコミットしない）
.env
.env.local
.env*.local
*.env

# Python
scripts/.env
scripts/venv/
scripts/__pycache__/
scripts/*.pyc
scripts/logs/
scripts/last_run.json

# Next.js
frontend/.next/
frontend/node_modules/
frontend/.env.local
frontend/out/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
```

### 絶対にコミットしてはいけないファイル

- ❌ `scripts/.env` - Discord Token、Supabase Service Key、Claude API Key
- ❌ `frontend/.env.local` - Supabase Keys、パスワード
- ❌ `scripts/logs/` - 実行ログ（URLや投稿者名が含まれる）
- ❌ `scripts/last_run.json` - 実行履歴

### コミット前チェックリスト

```bash
# 1. .gitignoreが正しく設定されているか確認
cat .gitignore

# 2. git statusで機密ファイルが含まれていないか確認
git status

# 3. 以下が表示されたら絶対にコミットしない
# - scripts/.env
# - frontend/.env.local
# - scripts/logs/
```

### 誤ってコミットしてしまった場合

```bash
# ファイルを履歴から削除
git rm --cached scripts/.env
git commit -m "Remove sensitive files"

# ⚠️ 重要: 以下を必ず実施
# 1. Discord Bot Token を再発行
# 2. Supabase Service Key を再発行
# 3. Claude API Key を再発行
# 4. パスワードを変更
```

### Publicリポジトリにするメリット

1. **ポートフォリオとして活用**
   - 技術スタックの実装例を見せられる
   - Next.js + Supabase + Claude APIの統合事例

2. **オープンソース化**
   - 他の人が参考にできる
   - フィードバックをもらえる

3. **プライバシー保護済み**
   - レシピURLは公開情報
   - 投稿者名はUIに表示しない（DB内部のみ保存）
   - 個人情報は含まれない

---

## 📦 依存関係

### Python（`scripts/requirements.txt`）

```txt
# Discord API
discord.py==2.3.2

# スクレイピング
requests==2.31.0
beautifulsoup4==4.12.2
lxml==4.9.3

# AI分類
anthropic==0.25.0

# データベース
supabase==2.4.0

# 環境変数
python-dotenv==1.0.0
```

### Next.js（`frontend/package.json`）

```json
{
  "name": "recipe-manager-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.42.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5"
  }
}
```

---

## 🚀 セットアップ手順（README.md用）

### 前提条件
- Node.js 18以上
- Python 3.11以上
- Supabaseアカウント
- Discord Developer アカウント
- Anthropic APIキー

### 1. リポジトリのクローン

```bash
git clone https://github.com/yourusername/recipe-manager.git
cd recipe-manager
```

### 2. Supabaseセットアップ

1. [Supabase](https://supabase.com)でプロジェクト作成（リージョン: Tokyo）
2. SQL Editorで`docs/requirements.md`内のSQLを実行
3. Settings → API から以下を取得：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`（フロントエンド用）
   - `SUPABASE_SERVICE_KEY`（Python用）

### 3. Discord Botセットアップ

1. [Discord Developer Portal](https://discord.com/developers/applications)でアプリ作成
2. Bot作成、トークン取得
3. MESSAGE CONTENT INTENT 有効化
4. サーバーに招待（権限: Read Messages, Read Message History）
5. チャンネルIDを取得（開発者モードON → 右クリック → IDをコピー）

### 4. Pythonスクリプトセットアップ

```bash
cd scripts

# 仮想環境作成
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係インストール
pip install -r requirements.txt

# 環境変数設定
cp .env.example .env
# .envを編集して各種キーを設定
```

### 5. フロントエンドセットアップ

```bash
cd frontend

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.localを編集

# 開発サーバー起動
npm run dev
```

### 6. データ収集実行

```bash
cd scripts
source venv/bin/activate
python collector.py
```

### 7. Vercelデプロイ

```bash
cd frontend

# Vercel CLIインストール（初回のみ）
npm install -g vercel

# デプロイ
vercel

# 環境変数を設定
# Vercel Dashboard → Settings → Environment Variables
```
