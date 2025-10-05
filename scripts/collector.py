"""
レシピ収集メインスクリプト
Discord → スクレイピング → AI分類 → Supabase登録
"""

import os
import json
import logging
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from dotenv import load_dotenv
from supabase import create_client, Client

from discord_client import fetch_discord_messages
from scraper import scrape_url
from classifier import classify_recipe


# ログ設定
def setup_logger() -> logging.Logger:
    """ロガーのセットアップ"""
    log_dir = Path(__file__).parent / "logs"
    log_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = log_dir / f"collector_{timestamp}.log"
    
    # ロガー設定
    logger = logging.getLogger("recipe_collector")
    logger.setLevel(logging.INFO)
    
    # 既存のハンドラをクリア
    logger.handlers.clear()
    
    # ファイルハンドラ
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setLevel(logging.INFO)
    
    # コンソールハンドラ
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # フォーマット
    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger


# 実行履歴管理
LAST_RUN_FILE = Path(__file__).parent / "last_run.json"


def load_last_run() -> Optional[datetime]:
    """最終実行日時を読み込む"""
    if not LAST_RUN_FILE.exists():
        return None
    
    try:
        with open(LAST_RUN_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return datetime.fromisoformat(data["last_run_at"])
    except Exception as e:
        logger.warning(f"実行履歴の読み込みエラー: {e}")
        return None


def save_last_run(stats: Dict):
    """実行結果を保存"""
    data = {
        "last_run_at": datetime.now().isoformat(),
        "processed_count": stats["processed"],
        "success_count": stats["success"],
        "failed_count": stats["failed"],
        "skipped_count": stats["skipped"],
        "failed_urls": stats["failed_urls"]
    }
    
    try:
        with open(LAST_RUN_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        logger.info(f"実行履歴を保存しました: {LAST_RUN_FILE}")
    except Exception as e:
        logger.error(f"実行履歴の保存エラー: {e}")


# メイン処理
class RecipeCollector:
    """レシピ収集クラス"""
    
    def __init__(
        self,
        discord_token: str,
        discord_channel_id: int,
        supabase_url: str,
        supabase_key: str
    ):
        self.discord_token = discord_token
        self.discord_channel_id = discord_channel_id
        self.supabase: Client = create_client(supabase_url, supabase_key)
        
        # 統計情報
        self.stats = {
            "processed": 0,
            "success": 0,
            "failed": 0,
            "skipped": 0,
            "failed_urls": []
        }
    
    async def run(self):
        """メイン処理"""
        logger.info("=" * 60)
        logger.info("レシピ収集を開始します")
        logger.info("=" * 60)
        
        # 1. 最終実行日時を取得
        last_run = load_last_run()
        if last_run:
            logger.info(f"前回実行日時: {last_run}")
            logger.info("差分のみ取得します")
        else:
            logger.info("初回実行: 全メッセージを取得します")
        
        # 2. Discordからメッセージ取得
        logger.info("\n--- Discord連携 ---")
        messages = await fetch_discord_messages(
            token=self.discord_token,
            channel_id=self.discord_channel_id,
            after=last_run
        )
        
        if not messages:
            logger.info("新しいメッセージはありません")
            return
        
        logger.info(f"取得メッセージ数: {len(messages)}件")
        
        # 3. 各メッセージを処理
        logger.info("\n--- データ処理 ---")
        for i, message in enumerate(messages, 1):
            logger.info(f"\n[{i}/{len(messages)}] 処理開始")
            
            # URLごとに処理
            for url in message["urls"]:
                await self._process_url(
                    url=url,
                    posted_by=message["author"],
                    posted_at=message["posted_at"]
                )
        
        # 4. 結果表示
        logger.info("\n" + "=" * 60)
        logger.info("処理完了")
        logger.info("=" * 60)
        logger.info(f"処理数: {self.stats['processed']}件")
        logger.info(f"成功: {self.stats['success']}件")
        logger.info(f"失敗: {self.stats['failed']}件")
        logger.info(f"スキップ（重複）: {self.stats['skipped']}件")
        
        if self.stats["failed_urls"]:
            logger.info("\n失敗したURL:")
            for url in self.stats["failed_urls"]:
                logger.info(f"  - {url}")
        
        # 5. 実行履歴を保存
        save_last_run(self.stats)
    
    async def _process_url(self, url: str, posted_by: str, posted_at: datetime):
        """URLを処理してDBに登録"""
        self.stats["processed"] += 1
        
        logger.info(f"URL: {url}")
        
        # 1. 重複チェック
        if self._is_duplicate(url):
            logger.info("⏭️  スキップ（既に登録済み）")
            self.stats["skipped"] += 1
            return
        
        # 2. スクレイピング
        scraped_data = scrape_url(url)
        if not scraped_data:
            logger.warning("❌ スクレイピング失敗")
            self.stats["failed"] += 1
            self.stats["failed_urls"].append(url)
            return
        
        # 3. AI分類
        classification = classify_recipe(
            title=scraped_data["title"],
            description=scraped_data["description"],
            url=url
        )
        
        # 4. DB登録
        success = self._save_to_db(
            url=url,
            title=scraped_data["title"],
            image_url=scraped_data["image_url"],
            description=scraped_data["description"],
            ingredients=classification["ingredients"],
            cuisine_type=classification["cuisine_type"],
            category=classification["category"],
            posted_by=posted_by,
            posted_at=posted_at
        )
        
        if success:
            logger.info("✅ DB登録成功")
            self.stats["success"] += 1
        else:
            logger.warning("❌ DB登録失敗")
            self.stats["failed"] += 1
            self.stats["failed_urls"].append(url)
    
    def _is_duplicate(self, url: str) -> bool:
        """URLが既に登録されているかチェック"""
        try:
            result = self.supabase.table("recipes").select("id").eq("url", url).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.warning(f"重複チェックエラー: {e}")
            return False
    
    def _save_to_db(
        self,
        url: str,
        title: str,
        image_url: Optional[str],
        description: Optional[str],
        ingredients: List[str],
        cuisine_type: str,
        category: str,
        posted_by: str,
        posted_at: datetime
    ) -> bool:
        """Supabaseにデータを登録"""
        try:
            data = {
                "url": url,
                "title": title,
                "image_url": image_url,
                "description": description,
                "ingredients": ingredients,
                "cuisine_type": cuisine_type,
                "category": category,
                "posted_by": posted_by,
                "posted_at": posted_at.isoformat()
            }
            
            self.supabase.table("recipes").insert(data).execute()
            return True
            
        except Exception as e:
            logger.error(f"DB登録エラー: {e}")
            return False


# エントリーポイント
async def main():
    """メイン関数"""
    # 環境変数読み込み
    load_dotenv()
    
    # 必須環境変数チェック
    required_vars = [
        "DISCORD_TOKEN",
        "DISCORD_CHANNEL_ID",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_KEY"
    ]
    
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        logger.error(f"環境変数が設定されていません: {', '.join(missing_vars)}")
        logger.error(".env ファイルを確認してください")
        return
    
    # 収集実行
    collector = RecipeCollector(
        discord_token=os.getenv("DISCORD_TOKEN"),
        discord_channel_id=int(os.getenv("DISCORD_CHANNEL_ID")),
        supabase_url=os.getenv("SUPABASE_URL"),
        supabase_key=os.getenv("SUPABASE_SERVICE_KEY")
    )
    
    await collector.run()


if __name__ == "__main__":
    # ロガー初期化
    logger = setup_logger()
    
    # 実行
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n処理を中断しました")
    except Exception as e:
        logger.error(f"予期しないエラー: {e}", exc_info=True)
