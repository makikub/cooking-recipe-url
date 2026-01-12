import type { Env, CollectorMetadata, NewRecipe } from './types';
import { RecipeRepository } from './repositories/recipe';
import { fetchDiscordMessages } from './services/discord';
import { scrapeUrl } from './services/scraper';
import { classifyRecipe } from './services/classifier';

const KV_METADATA_KEY = 'collector_metadata';

export default {
  /**
   * HTTPリクエストハンドラー（APIエンドポイント）
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS対応
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const repo = new RecipeRepository(env.DB);

    try {
      // GET /api/recipes - 全レシピ取得
      if (path === '/api/recipes' && request.method === 'GET') {
        const recipes = await repo.findAll();
        return Response.json(recipes, { headers: corsHeaders });
      }

      // GET /api/recipes/:id - レシピ詳細取得
      const recipeMatch = path.match(/^\/api\/recipes\/([^/]+)$/);
      if (recipeMatch && request.method === 'GET') {
        const recipe = await repo.findById(recipeMatch[1]);
        if (!recipe) {
          return Response.json(
            { error: 'Recipe not found' },
            { status: 404, headers: corsHeaders }
          );
        }
        return Response.json(recipe, { headers: corsHeaders });
      }

      // GET /api/health - ヘルスチェック
      if (path === '/api/health') {
        const count = await repo.count();
        return Response.json(
          { status: 'ok', recipeCount: count },
          { headers: corsHeaders }
        );
      }

      // POST /api/collect - 手動収集トリガー
      if (path === '/api/collect' && request.method === 'POST') {
        const result = await runCollector(env);
        return Response.json(result, { headers: corsHeaders });
      }

      return Response.json(
        { error: 'Not Found' },
        { status: 404, headers: corsHeaders }
      );
    } catch (error) {
      console.error('API error:', error);
      return Response.json(
        { error: 'Internal Server Error' },
        { status: 500, headers: corsHeaders }
      );
    }
  },

  /**
   * Cronトリガー（定期実行）
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log('Scheduled collector started');
    ctx.waitUntil(runCollector(env));
  },
};

/**
 * レシピ収集メイン処理
 */
async function runCollector(env: Env): Promise<{
  processed: number;
  success: number;
  failed: number;
  skipped: number;
}> {
  const stats = {
    processed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
  };

  const repo = new RecipeRepository(env.DB);

  try {
    // 前回の実行メタデータを取得
    const metadataJson = await env.KV.get(KV_METADATA_KEY);
    const metadata: CollectorMetadata | null = metadataJson
      ? JSON.parse(metadataJson)
      : null;

    console.log(
      `Last run: ${metadata?.lastRunAt || 'never'}, Last message ID: ${metadata?.lastMessageId || 'none'}`
    );

    // Discordからメッセージ取得
    const messages = await fetchDiscordMessages(
      env.DISCORD_TOKEN,
      env.DISCORD_CHANNEL_ID,
      metadata?.lastMessageId
    );

    console.log(`Fetched ${messages.length} messages with URLs`);

    if (messages.length === 0) {
      console.log('No new messages');
      return stats;
    }

    // 各メッセージを処理
    let lastMessageId: string | null = metadata?.lastMessageId || null;

    for (const message of messages) {
      for (const url of message.urls) {
        stats.processed++;

        try {
          // 重複チェック
          const exists = await repo.existsByUrl(url);
          if (exists) {
            console.log(`Skipped (duplicate): ${url}`);
            stats.skipped++;
            continue;
          }

          // スクレイピング
          const scraped = await scrapeUrl(url);
          if (!scraped) {
            console.log(`Failed to scrape: ${url}`);
            stats.failed++;
            continue;
          }

          // AI分類
          const classification = await classifyRecipe(
            env.OPENAI_API_KEY,
            scraped.title,
            scraped.description,
            url
          );

          // DB登録
          const newRecipe: NewRecipe = {
            url,
            title: scraped.title,
            image_url: scraped.imageUrl,
            description: scraped.description,
            ingredients: classification.ingredients,
            cuisine_type: classification.cuisineType,
            category: classification.category,
            posted_by: message.author,
            posted_at: message.timestamp,
          };

          await repo.create(newRecipe);
          console.log(`Saved: ${scraped.title}`);
          stats.success++;
        } catch (error) {
          console.error(`Error processing ${url}:`, error);
          stats.failed++;
        }
      }

      // 最新のメッセージIDを更新
      lastMessageId = message.id;
    }

    // メタデータを保存
    const newMetadata: CollectorMetadata = {
      lastMessageId,
      lastRunAt: new Date().toISOString(),
      processedCount: stats.processed,
      successCount: stats.success,
      failedCount: stats.failed,
    };
    await env.KV.put(KV_METADATA_KEY, JSON.stringify(newMetadata));

    console.log(
      `Collector completed: processed=${stats.processed}, success=${stats.success}, failed=${stats.failed}, skipped=${stats.skipped}`
    );

    return stats;
  } catch (error) {
    console.error('Collector error:', error);
    throw error;
  }
}
