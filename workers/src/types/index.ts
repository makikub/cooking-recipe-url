// D1テーブルの型定義
export interface Recipe {
  id: string;
  url: string;
  title: string;
  image_url: string | null;
  description: string | null;
  ingredients: string; // JSON配列文字列
  cuisine_type: string;
  category: string;
  posted_by: string | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
}

// 新規レシピ登録用
export interface NewRecipe {
  url: string;
  title: string;
  image_url?: string | null;
  description?: string | null;
  ingredients: string[];
  cuisine_type: string;
  category: string;
  posted_by?: string | null;
  posted_at?: string | null;
}

// スクレイピング結果
export interface ScrapedData {
  title: string;
  imageUrl: string | null;
  description: string | null;
}

// AI分類結果
export interface Classification {
  ingredients: string[];
  cuisineType: string;
  category: string;
}

// Discordメッセージ
export interface DiscordMessage {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  urls: string[];
}

// Cloudflare Workers環境変数
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  DISCORD_TOKEN: string;
  DISCORD_CHANNEL_ID: string;
  OPENAI_API_KEY: string;
  ENVIRONMENT: string;
}

// KVに保存するメタデータ
export interface CollectorMetadata {
  lastMessageId: string | null;
  lastRunAt: string;
  processedCount: number;
  successCount: number;
  failedCount: number;
}
