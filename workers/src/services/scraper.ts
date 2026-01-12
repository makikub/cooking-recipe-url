import type { ScrapedData } from '../types';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * URLから情報をスクレイピング（OGP優先）
 */
export async function scrapeUrl(url: string): Promise<ScrapedData | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error(`HTTP error: ${response.status} for ${url}`);
      return null;
    }

    const html = await response.text();

    // タイトル取得
    const title = getTitle(html);
    if (!title) {
      console.warn(`Title not found: ${url}`);
      return null;
    }

    // 画像URL取得
    const imageUrl = getImageUrl(html, url);

    // 説明文取得
    const description = getDescription(html);

    return {
      title,
      imageUrl,
      description,
    };
  } catch (error) {
    console.error(`Scraping error for ${url}:`, error);
    return null;
  }
}

/**
 * タイトルを取得（OGP → Twitterカード → titleタグの優先順）
 */
function getTitle(html: string): string | null {
  // OGPタイトル
  const ogTitle = extractMetaContent(html, 'og:title', 'property');
  if (ogTitle) return ogTitle;

  // Twitterカード
  const twitterTitle = extractMetaContent(html, 'twitter:title', 'name');
  if (twitterTitle) return twitterTitle;

  // titleタグ
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return decodeHtmlEntities(titleMatch[1].trim());
  }

  return null;
}

/**
 * 画像URLを取得（OGP → Twitterカードの優先順）
 */
function getImageUrl(html: string, baseUrl: string): string | null {
  // OGP画像
  const ogImage = extractMetaContent(html, 'og:image', 'property');
  if (ogImage) return resolveUrl(ogImage, baseUrl);

  // Twitterカード
  const twitterImage = extractMetaContent(html, 'twitter:image', 'name');
  if (twitterImage) return resolveUrl(twitterImage, baseUrl);

  return null;
}

/**
 * 説明文を取得（OGP → meta descriptionの優先順）
 */
function getDescription(html: string): string | null {
  // OGP説明
  const ogDesc = extractMetaContent(html, 'og:description', 'property');
  if (ogDesc) return ogDesc;

  // meta description
  const metaDesc = extractMetaContent(html, 'description', 'name');
  if (metaDesc) return metaDesc;

  return null;
}

/**
 * metaタグのcontent属性を抽出
 */
function extractMetaContent(
  html: string,
  value: string,
  attribute: 'property' | 'name'
): string | null {
  // property="og:title" content="..." または name="description" content="..."
  const patterns = [
    // property/name が content より前にあるパターン
    new RegExp(
      `<meta[^>]*${attribute}=["']${escapeRegex(value)}["'][^>]*content=["']([^"']+)["']`,
      'i'
    ),
    // content が property/name より前にあるパターン
    new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*${attribute}=["']${escapeRegex(value)}["']`,
      'i'
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return decodeHtmlEntities(match[1].trim());
    }
  }

  return null;
}

/**
 * 正規表現のエスケープ
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * HTMLエンティティをデコード
 */
function decodeHtmlEntities(str: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&nbsp;': ' ',
  };

  return str.replace(
    /&(?:amp|lt|gt|quot|#39|apos|#x27|#x2F|nbsp);/gi,
    (match) => entities[match.toLowerCase()] || match
  );
}

/**
 * 相対URLを絶対URLに変換
 */
function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}
