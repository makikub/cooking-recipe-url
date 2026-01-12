/**
 * Supabase → D1 データ移行スクリプト
 *
 * 使用方法:
 * 1. 環境変数を設定
 *    export SUPABASE_URL=https://xxxxx.supabase.co
 *    export SUPABASE_SERVICE_KEY=your_service_key
 *
 * 2. 実行
 *    npx ts-node scripts/migrate-from-supabase.ts > migration.sql
 *
 * 3. D1に適用
 *    wrangler d1 execute recipe-db --file=./migration.sql
 */

import { createClient } from '@supabase/supabase-js';

interface SupabaseRecipe {
  id: string;
  url: string;
  title: string;
  image_url: string | null;
  description: string | null;
  ingredients: string[]; // PostgreSQLのTEXT[]
  cuisine_type: string;
  category: string;
  posted_by: string | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // SQL出力（stdoutへ）
  const output = (line: string) => process.stdout.write(line + '\n');

  output('-- Supabase → D1 Migration SQL');
  output(`-- Generated at: ${new Date().toISOString()}`);
  output('');

  // 全レシピを取得
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching recipes:', error);
    process.exit(1);
  }

  if (!recipes || recipes.length === 0) {
    output('-- No recipes to migrate');
    process.exit(0);
  }

  output(`-- Total recipes: ${recipes.length}`);
  output('');

  // INSERT文を生成
  for (const recipe of recipes as SupabaseRecipe[]) {
    const sql = generateInsertSql(recipe);
    output(sql);
  }

  output('');
  output('-- Migration completed');
}

function generateInsertSql(recipe: SupabaseRecipe): string {
  // SQLエスケープ（シングルクォートと改行を処理）
  const escape = (value: string | null): string => {
    if (value === null) return 'NULL';
    return `'${value.replace(/'/g, "''").replace(/\n/g, ' ').replace(/\r/g, '')}'`;
  };

  // ingredients配列をJSON文字列に変換
  const ingredients = JSON.stringify(recipe.ingredients || []);

  // 日時をISO8601形式に変換
  const postedAt = recipe.posted_at
    ? escape(new Date(recipe.posted_at).toISOString())
    : 'NULL';
  const createdAt = escape(new Date(recipe.created_at).toISOString());
  const updatedAt = escape(new Date(recipe.updated_at).toISOString());

  return `INSERT INTO recipes (id, url, title, image_url, description, ingredients, cuisine_type, category, posted_by, posted_at, created_at, updated_at) VALUES (${escape(recipe.id)}, ${escape(recipe.url)}, ${escape(recipe.title)}, ${escape(recipe.image_url)}, ${escape(recipe.description)}, ${escape(ingredients)}, ${escape(recipe.cuisine_type)}, ${escape(recipe.category)}, ${escape(recipe.posted_by)}, ${postedAt}, ${createdAt}, ${updatedAt});`;
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
