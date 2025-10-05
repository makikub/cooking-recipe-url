"""
スクレイピングモジュール
URLから情報を取得（タイトル、OGP画像、説明文）
"""

import logging
from typing import Dict, Optional
import requests
from bs4 import BeautifulSoup

logger = logging.getLogger("recipe_collector")


class RecipeScraper:
    """レシピURLから情報を取得するクラス"""
    
    def __init__(self, timeout: int = 10):
        """
        Args:
            timeout: リクエストタイムアウト（秒）
        """
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    
    def scrape(self, url: str) -> Optional[Dict]:
        """
        URLから情報を取得
        
        Args:
            url: レシピURL
        
        Returns:
            {
                "title": "レシピタイトル",
                "image_url": "画像URL",
                "description": "説明文"
            }
            取得失敗時はNone
        """
        try:
            logger.info(f"スクレイピング開始: {url}")
            
            # HTTPリクエスト
            response = requests.get(
                url,
                headers=self.headers,
                timeout=self.timeout,
                allow_redirects=True
            )
            response.raise_for_status()
            
            # HTMLパース
            soup = BeautifulSoup(response.content, "html.parser")
            
            # タイトル取得
            title = self._get_title(soup)
            if not title:
                logger.warning(f"タイトル取得失敗: {url}")
                return None
            
            # OGP画像取得
            image_url = self._get_image(soup, url)
            
            # 説明文取得
            description = self._get_description(soup)
            
            logger.info(f"スクレイピング成功: {title}")
            
            return {
                "title": title,
                "image_url": image_url,
                "description": description
            }
            
        except requests.exceptions.Timeout:
            logger.warning(f"タイムアウト: {url}")
            return None
        except requests.exceptions.HTTPError as e:
            logger.warning(f"HTTPエラー ({e.response.status_code}): {url}")
            return None
        except requests.exceptions.RequestException as e:
            logger.warning(f"リクエストエラー: {url} - {e}")
            return None
        except Exception as e:
            logger.error(f"予期しないエラー: {url} - {e}")
            return None
    
    def _get_title(self, soup: BeautifulSoup) -> Optional[str]:
        """
        タイトルを取得（OGP優先）
        
        Args:
            soup: BeautifulSoupオブジェクト
        
        Returns:
            タイトル文字列（取得失敗時はNone）
        """
        # OGPタイトル
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            return og_title.get("content").strip()
        
        # Twitterカード
        twitter_title = soup.find("meta", attrs={"name": "twitter:title"})
        if twitter_title and twitter_title.get("content"):
            return twitter_title.get("content").strip()
        
        # titleタグ
        title_tag = soup.find("title")
        if title_tag and title_tag.string:
            return title_tag.string.strip()
        
        return None
    
    def _get_image(self, soup: BeautifulSoup, base_url: str) -> Optional[str]:
        """
        画像URLを取得（OGP優先）
        
        Args:
            soup: BeautifulSoupオブジェクト
            base_url: ベースURL（相対パス解決用）
        
        Returns:
            画像URL（取得失敗時はNone）
        """
        # OGP画像
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            image_url = og_image.get("content").strip()
            return self._resolve_url(image_url, base_url)
        
        # Twitterカード
        twitter_image = soup.find("meta", attrs={"name": "twitter:image"})
        if twitter_image and twitter_image.get("content"):
            image_url = twitter_image.get("content").strip()
            return self._resolve_url(image_url, base_url)
        
        return None
    
    def _get_description(self, soup: BeautifulSoup) -> Optional[str]:
        """
        説明文を取得（OGP優先）
        
        Args:
            soup: BeautifulSoupオブジェクト
        
        Returns:
            説明文（取得失敗時はNone）
        """
        # OGP説明
        og_desc = soup.find("meta", property="og:description")
        if og_desc and og_desc.get("content"):
            return og_desc.get("content").strip()
        
        # meta description
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content"):
            return meta_desc.get("content").strip()
        
        return None
    
    @staticmethod
    def _resolve_url(url: str, base_url: str) -> str:
        """
        相対URLを絶対URLに変換
        
        Args:
            url: 変換対象URL
            base_url: ベースURL
        
        Returns:
            絶対URL
        """
        from urllib.parse import urljoin
        return urljoin(base_url, url)


def scrape_url(url: str, timeout: int = 10) -> Optional[Dict]:
    """
    URLから情報を取得する便利関数
    
    Args:
        url: レシピURL
        timeout: タイムアウト（秒）
    
    Returns:
        スクレイピング結果（失敗時はNone）
    """
    scraper = RecipeScraper(timeout=timeout)
    return scraper.scrape(url)


# テスト用
if __name__ == "__main__":
    # ロガー設定
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s"
    )
    
    # テストURL
    test_urls = [
        "https://cookpad.com/recipe/7658913",  # クックパッド
        "https://delishkitchen.tv/recipes/123456789",  # DELISH KITCHEN
        "https://www.kurashiru.com/recipes/12345678-90ab-cdef-1234-567890abcdef",  # クラシル
        "https://example.com/invalid-url",  # 無効なURL
    ]
    
    logger.info("スクレイピングテスト開始\n")
    
    for url in test_urls:
        logger.info(f"=== テスト: {url} ===")
        result = scrape_url(url)
        
        if result:
            logger.info(f"✅ 成功")
            logger.info(f"  タイトル: {result['title']}")
            logger.info(f"  画像URL: {result['image_url']}")
            logger.info(f"  説明: {result['description'][:100] if result['description'] else 'なし'}...")
        else:
            logger.warning(f"❌ 失敗")
        
        logger.info("")
