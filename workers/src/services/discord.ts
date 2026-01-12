import type { DiscordMessage } from '../types';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

interface DiscordApiMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    discriminator: string;
    bot?: boolean;
  };
  timestamp: string;
}

/**
 * Discord REST APIでチャンネルからメッセージを取得
 */
export async function fetchDiscordMessages(
  token: string,
  channelId: string,
  afterMessageId?: string | null,
  limit: number = 100
): Promise<DiscordMessage[]> {
  const url = new URL(`${DISCORD_API_BASE}/channels/${channelId}/messages`);
  url.searchParams.set('limit', String(Math.min(limit, 100)));

  if (afterMessageId) {
    url.searchParams.set('after', afterMessageId);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord API error: ${response.status} - ${errorText}`);
  }

  const messages: DiscordApiMessage[] = await response.json();

  // Botのメッセージを除外し、URLを含むメッセージのみ抽出
  const result: DiscordMessage[] = [];

  for (const msg of messages) {
    // Botのメッセージをスキップ
    if (msg.author.bot) {
      continue;
    }

    // URLを抽出
    const urls = extractUrls(msg.content);
    if (urls.length === 0) {
      continue;
    }

    result.push({
      id: msg.id,
      content: msg.content,
      author: msg.author.username,
      timestamp: msg.timestamp,
      urls,
    });
  }

  // Discord APIは新しい順で返すので、古い順に並び替え
  return result.reverse();
}

/**
 * テキストからURLを抽出
 */
function extractUrls(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const matches = text.match(urlPattern);

  if (!matches) {
    return [];
  }

  // 重複を除去
  return [...new Set(matches)];
}

/**
 * 最新メッセージIDを取得（差分取得用）
 */
export async function getLatestMessageId(
  token: string,
  channelId: string
): Promise<string | null> {
  const messages = await fetchDiscordMessages(token, channelId, null, 1);
  return messages.length > 0 ? messages[messages.length - 1].id : null;
}
