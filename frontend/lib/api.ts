// APIレスポンスの型定義（D1からのデータ）
export type RecipeRaw = {
  id: string;
  url: string;
  title: string;
  image_url: string | null;
  description: string | null;
  ingredients: string; // JSON文字列
  cuisine_type: string;
  category: string;
  posted_at: string;
  created_at: string;
  updated_at: string;
};

// パース後のレシピ型（フロントエンド用）
export type Recipe = {
  id: string;
  url: string;
  title: string;
  image_url: string | null;
  description: string | null;
  ingredients: string[]; // パース済み配列
  cuisine_type: string;
  category: string;
  posted_at: string;
  created_at: string;
  updated_at: string;
};

// API エンドポイント（環境変数から取得、デフォルトは相対パス）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * 全レシピを取得
 */
export async function getRecipes(): Promise<Recipe[]> {
  const response = await fetch(`${API_BASE_URL}/api/recipes`, {
    cache: 'no-store', // SSRで常に最新データを取得
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch recipes: ${response.status}`);
  }

  const data: RecipeRaw[] = await response.json();

  // ingredientsをJSON文字列から配列にパース
  return data.map(parseRecipe);
}

/**
 * レシピIDで取得
 */
export async function getRecipeById(id: string): Promise<Recipe | null> {
  const response = await fetch(`${API_BASE_URL}/api/recipes/${id}`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch recipe: ${response.status}`);
  }

  const data: RecipeRaw = await response.json();
  return parseRecipe(data);
}

/**
 * ヘルスチェック
 */
export async function healthCheck(): Promise<{ status: string; recipeCount: number }> {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }

  return response.json();
}

/**
 * 手動収集トリガー
 */
export async function triggerCollection(): Promise<{
  processed: number;
  success: number;
  failed: number;
  skipped: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/collect`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Collection failed: ${response.status}`);
  }

  return response.json();
}

/**
 * RecipeRawをRecipeに変換（ingredientsをパース）
 */
function parseRecipe(raw: RecipeRaw): Recipe {
  let ingredients: string[] = [];

  try {
    if (raw.ingredients) {
      ingredients = JSON.parse(raw.ingredients);
    }
  } catch {
    console.warn(`Failed to parse ingredients for recipe ${raw.id}`);
  }

  return {
    ...raw,
    ingredients,
  };
}
