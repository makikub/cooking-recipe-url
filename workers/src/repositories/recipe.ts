import type { Recipe, NewRecipe } from '../types';

export class RecipeRepository {
  constructor(private db: D1Database) {}

  /**
   * 全レシピ取得（投稿日時の降順）
   */
  async findAll(): Promise<Recipe[]> {
    const result = await this.db
      .prepare(
        `SELECT * FROM recipes ORDER BY posted_at DESC`
      )
      .all<Recipe>();
    return result.results;
  }

  /**
   * IDでレシピ取得
   */
  async findById(id: string): Promise<Recipe | null> {
    const result = await this.db
      .prepare(`SELECT * FROM recipes WHERE id = ?`)
      .bind(id)
      .first<Recipe>();
    return result;
  }

  /**
   * URLでレシピ取得（重複チェック用）
   */
  async findByUrl(url: string): Promise<Recipe | null> {
    const result = await this.db
      .prepare(`SELECT * FROM recipes WHERE url = ?`)
      .bind(url)
      .first<Recipe>();
    return result;
  }

  /**
   * URLが既に存在するかチェック
   */
  async existsByUrl(url: string): Promise<boolean> {
    const result = await this.db
      .prepare(`SELECT id FROM recipes WHERE url = ?`)
      .bind(url)
      .first<{ id: string }>();
    return result !== null;
  }

  /**
   * 新規レシピ登録
   */
  async create(recipe: NewRecipe): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO recipes (id, url, title, image_url, description, ingredients, cuisine_type, category, posted_by, posted_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        recipe.url,
        recipe.title,
        recipe.image_url ?? null,
        recipe.description ?? null,
        JSON.stringify(recipe.ingredients),
        recipe.cuisine_type,
        recipe.category,
        recipe.posted_by ?? null,
        recipe.posted_at ?? null,
        now,
        now
      )
      .run();

    return id;
  }

  /**
   * レシピ更新
   */
  async update(id: string, recipe: Partial<NewRecipe>): Promise<void> {
    const now = new Date().toISOString();
    const fields: string[] = ['updated_at = ?'];
    const values: (string | null)[] = [now];

    if (recipe.title !== undefined) {
      fields.push('title = ?');
      values.push(recipe.title);
    }
    if (recipe.image_url !== undefined) {
      fields.push('image_url = ?');
      values.push(recipe.image_url ?? null);
    }
    if (recipe.description !== undefined) {
      fields.push('description = ?');
      values.push(recipe.description ?? null);
    }
    if (recipe.ingredients !== undefined) {
      fields.push('ingredients = ?');
      values.push(JSON.stringify(recipe.ingredients));
    }
    if (recipe.cuisine_type !== undefined) {
      fields.push('cuisine_type = ?');
      values.push(recipe.cuisine_type);
    }
    if (recipe.category !== undefined) {
      fields.push('category = ?');
      values.push(recipe.category);
    }

    values.push(id);

    await this.db
      .prepare(`UPDATE recipes SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  /**
   * レシピ削除
   */
  async delete(id: string): Promise<void> {
    await this.db
      .prepare(`DELETE FROM recipes WHERE id = ?`)
      .bind(id)
      .run();
  }

  /**
   * レシピ数取得
   */
  async count(): Promise<number> {
    const result = await this.db
      .prepare(`SELECT COUNT(*) as count FROM recipes`)
      .first<{ count: number }>();
    return result?.count ?? 0;
  }

  /**
   * ジャンル別にフィルタリング
   */
  async findByCuisineType(cuisineType: string): Promise<Recipe[]> {
    const result = await this.db
      .prepare(
        `SELECT * FROM recipes WHERE cuisine_type = ? ORDER BY posted_at DESC`
      )
      .bind(cuisineType)
      .all<Recipe>();
    return result.results;
  }

  /**
   * カテゴリ別にフィルタリング
   */
  async findByCategory(category: string): Promise<Recipe[]> {
    const result = await this.db
      .prepare(
        `SELECT * FROM recipes WHERE category = ? ORDER BY posted_at DESC`
      )
      .bind(category)
      .all<Recipe>();
    return result.results;
  }
}
