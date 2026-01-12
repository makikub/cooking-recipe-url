import OpenAI from 'openai';
import type { Classification } from '../types';

const CLASSIFICATION_PROMPT = `以下のレシピ情報から、素材・ジャンル・カテゴリを抽出してください。

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

{
  "ingredients": ["素材1", "素材2", "素材3"],
  "cuisine_type": "ジャンル",
  "category": "カテゴリ"
}`;

/**
 * レシピをAI（OpenAI GPT 5.2）で分類
 */
export async function classifyRecipe(
  apiKey: string,
  title: string,
  description: string | null,
  url: string
): Promise<Classification> {
  try {
    const openai = new OpenAI({ apiKey });

    const prompt = CLASSIFICATION_PROMPT.replace('{title}', title)
      .replace('{description}', description || '説明なし')
      .replace('{url}', url);

    const response = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 256,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('Empty response from OpenAI');
      return getDefaultClassification();
    }

    return parseResponse(content);
  } catch (error) {
    console.error('Classification error:', error);
    return getDefaultClassification();
  }
}

/**
 * OpenAIのレスポンスをパース
 */
function parseResponse(responseText: string): Classification {
  try {
    // JSONブロックを抽出（```json ... ```の場合に対応）
    let jsonText = responseText;

    if (responseText.includes('```json')) {
      jsonText = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      jsonText = responseText.split('```')[1].split('```')[0].trim();
    }

    const result = JSON.parse(jsonText);

    // バリデーション
    let ingredients: string[] = result.ingredients || [];
    const cuisineType: string = result.cuisine_type || 'その他';
    const category: string = result.category || 'その他';

    // 素材は最大5つまで
    if (ingredients.length > 5) {
      ingredients = ingredients.slice(0, 5);
    }

    return {
      ingredients,
      cuisineType,
      category,
    };
  } catch (error) {
    console.warn('JSON parse error:', error);
    console.warn('Response:', responseText);
    return getDefaultClassification();
  }
}

/**
 * デフォルト分類（エラー時）
 */
function getDefaultClassification(): Classification {
  return {
    ingredients: [],
    cuisineType: 'その他',
    category: 'その他',
  };
}
