"""
AI分類モジュール
ローカルのClaude Code (claude -p) を使用してレシピを自動分類
"""

import os
import json
import logging
import subprocess
from typing import Dict, List

logger = logging.getLogger("recipe_collector")


# 分類プロンプト
CLASSIFICATION_PROMPT = """以下のレシピ情報から、素材・ジャンル・カテゴリを抽出してください。

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

{{
  "ingredients": ["素材1", "素材2", "素材3"],
  "cuisine_type": "ジャンル",
  "category": "カテゴリ"
}}"""


class RecipeClassifier:
    """ローカルのClaude Code (claude -p) を使用してレシピを分類するクラス"""
    
    def __init__(self):
        """
        ローカルのclaude -pコマンドを使用
        """
        pass
    
    def classify(
        self,
        title: str,
        description: str = None,
        url: str = None
    ) -> Dict[str, any]:
        """
        レシピを分類
        
        Args:
            title: レシピタイトル
            description: レシピ説明文
            url: レシピURL
        
        Returns:
            {
                "ingredients": ["素材1", "素材2", ...],
                "cuisine_type": "ジャンル",
                "category": "カテゴリ"
            }
        """
        try:
            logger.info(f"AI分類開始: {title}")
            
            # プロンプト生成
            prompt = CLASSIFICATION_PROMPT.format(
                title=title,
                description=description or "説明なし",
                url=url or "URLなし"
            )
            
            # claude -p コマンドを実行
            result = subprocess.run(
                ["claude", "-p", prompt],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode != 0:
                logger.error(f"claude -p コマンドエラー: {result.stderr}")
                return self._get_default_classification()
            
            # レスポンス取得
            response_text = result.stdout
            
            # JSONパース
            parsed_result = self._parse_response(response_text)
            
            logger.info(f"AI分類成功: {parsed_result['cuisine_type']} / {parsed_result['category']}")
            
            return parsed_result
            
        except subprocess.TimeoutExpired:
            logger.error("claude -p コマンドがタイムアウトしました")
            return self._get_default_classification()
        except FileNotFoundError:
            logger.error("claude コマンドが見つかりません。claude codeがインストールされているか確認してください")
            return self._get_default_classification()
        except Exception as e:
            logger.error(f"分類エラー: {e}")
            return self._get_default_classification()
    
    def _parse_response(self, response_text: str) -> Dict:
        """
        Claude APIのレスポンスをパース
        
        Args:
            response_text: APIレスポンステキスト
        
        Returns:
            分類結果
        """
        try:
            # JSONブロックを抽出（```json ... ```の場合に対応）
            if "```json" in response_text:
                json_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_text = response_text.split("```")[1].split("```")[0].strip()
            else:
                json_text = response_text.strip()
            
            # JSON解析
            result = json.loads(json_text)
            
            # バリデーション
            ingredients = result.get("ingredients", [])
            cuisine_type = result.get("cuisine_type", "その他")
            category = result.get("category", "その他")
            
            # 素材は最大5つまで
            if len(ingredients) > 5:
                ingredients = ingredients[:5]
            
            return {
                "ingredients": ingredients,
                "cuisine_type": cuisine_type,
                "category": category
            }
            
        except json.JSONDecodeError as e:
            logger.warning(f"JSONパースエラー: {e}")
            logger.warning(f"レスポンス: {response_text}")
            return self._get_default_classification()
        except Exception as e:
            logger.warning(f"レスポンスパースエラー: {e}")
            return self._get_default_classification()
    
    @staticmethod
    def _get_default_classification() -> Dict:
        """
        デフォルト分類（エラー時）
        
        Returns:
            デフォルト値
        """
        return {
            "ingredients": [],
            "cuisine_type": "その他",
            "category": "その他"
        }


def classify_recipe(
    title: str,
    description: str = None,
    url: str = None
) -> Dict:
    """
    レシピを分類する便利関数
    
    Args:
        title: レシピタイトル
        description: レシピ説明文
        url: レシピURL
    
    Returns:
        分類結果
    """
    classifier = RecipeClassifier()
    return classifier.classify(title=title, description=description, url=url)


# テスト用
if __name__ == "__main__":
    # ロガー設定
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s"
    )
    
    # テストデータ
    test_recipes = [
        {
            "title": "トマトとバジルのパスタ",
            "description": "新鮮なトマトとバジルを使ったシンプルなパスタです",
            "url": "https://example.com/pasta"
        },
        {
            "title": "鶏の唐揚げ",
            "description": "カリッとジューシーな定番の唐揚げレシピ",
            "url": "https://example.com/karaage"
        },
        {
            "title": "ガトーショコラ",
            "description": "濃厚なチョコレートケーキ",
            "url": "https://example.com/gateau"
        }
    ]
    
    logger.info("AI分類テスト開始\n")
    
    for recipe in test_recipes:
        logger.info(f"=== テスト: {recipe['title']} ===")
        result = classify_recipe(
            title=recipe["title"],
            description=recipe["description"],
            url=recipe["url"]
        )
        
        logger.info(f"素材: {', '.join(result['ingredients'])}")
        logger.info(f"ジャンル: {result['cuisine_type']}")
        logger.info(f"カテゴリ: {result['category']}")
        logger.info("")
