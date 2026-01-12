-- Cloudflare D1 スキーマ (SQLite)
-- PostgreSQLからの変換: UUID→TEXT, TEXT[]→TEXT(JSON), TIMESTAMP→TEXT(ISO8601)

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  ingredients TEXT,  -- JSON配列文字列 例: ["鶏肉","トマト","玉ねぎ"]
  cuisine_type TEXT,
  category TEXT,
  posted_by TEXT,
  posted_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- パフォーマンス最適化インデックス
CREATE INDEX IF NOT EXISTS idx_recipes_posted_at ON recipes(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine_type ON recipes(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
