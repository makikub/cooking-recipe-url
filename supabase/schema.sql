-- 料理レシピURL管理システム - データベーススキーマ
-- 作成日: 2025-10-05

-- recipesテーブル作成
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

-- コメント追加（ドキュメント化）
COMMENT ON TABLE recipes IS '料理レシピ情報を管理するテーブル';
COMMENT ON COLUMN recipes.id IS 'レシピID（UUID）';
COMMENT ON COLUMN recipes.url IS 'レシピURL（重複不可）';
COMMENT ON COLUMN recipes.title IS 'レシピタイトル';
COMMENT ON COLUMN recipes.image_url IS 'OGP画像URL（なければデフォルト画像使用）';
COMMENT ON COLUMN recipes.description IS 'レシピ説明文';
COMMENT ON COLUMN recipes.ingredients IS '素材タグの配列（例: ["鶏肉", "トマト", "バジル"]）';
COMMENT ON COLUMN recipes.cuisine_type IS 'ジャンル（例: "イタリアン", "和食", "中華"）';
COMMENT ON COLUMN recipes.category IS 'カテゴリ（例: "主菜", "副菜", "デザート"）';
COMMENT ON COLUMN recipes.posted_by IS 'Discord投稿者名（UIには非表示、DB内部のみ保存）';
COMMENT ON COLUMN recipes.posted_at IS 'Discord投稿日時';
COMMENT ON COLUMN recipes.created_at IS 'レコード作成日時';
COMMENT ON COLUMN recipes.updated_at IS 'レコード更新日時';
