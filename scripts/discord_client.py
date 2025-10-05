"""
Discord連携モジュール
指定したチャンネルからメッセージを取得し、URL含むメッセージを抽出する
"""

import os
import re
import logging
from datetime import datetime
from typing import List, Dict, Optional
import discord
from discord.ext import commands

logger = logging.getLogger("recipe_collector")


class DiscordMessageFetcher:
    """Discordからメッセージを取得するクラス"""
    
    def __init__(self, token: str, channel_id: int):
        """
        Args:
            token: Discord Bot Token
            channel_id: 監視対象のチャンネルID
        """
        self.token = token
        self.channel_id = channel_id
        
        # Intentsの設定（MESSAGE CONTENT INTENTが必要）
        intents = discord.Intents.default()
        intents.message_content = True
        intents.messages = True
        
        self.client = discord.Client(intents=intents)
    
    async def fetch_messages(
        self, 
        after: Optional[datetime] = None,
        limit: Optional[int] = None
    ) -> List[Dict]:
        """
        指定したチャンネルからメッセージを取得
        
        Args:
            after: この日時以降のメッセージのみ取得（Noneの場合は全件）
            limit: 取得するメッセージ数の上限（Noneの場合は全件）
        
        Returns:
            メッセージ情報のリスト
            [
                {
                    "content": "メッセージ本文",
                    "author": "投稿者名",
                    "posted_at": datetime,
                    "urls": ["https://...", ...]
                },
                ...
            ]
        """
        messages_data = []
        
        @self.client.event
        async def on_ready():
            """Bot起動時の処理"""
            logger.info(f"Discord Bot ログイン成功: {self.client.user}")
            
            try:
                # チャンネル取得
                channel = self.client.get_channel(self.channel_id)
                if not channel:
                    logger.error(f"チャンネルが見つかりません: {self.channel_id}")
                    await self.client.close()
                    return
                
                logger.info(f"チャンネル取得成功: {channel.name}")
                
                # メッセージ取得
                message_count = 0
                async for message in channel.history(
                    limit=limit,
                    after=after,
                    oldest_first=False
                ):
                    # Bot自身のメッセージはスキップ
                    if message.author.bot:
                        continue
                    
                    # URLを含むメッセージのみ処理
                    urls = self._extract_urls(message.content)
                    if not urls:
                        continue
                    
                    messages_data.append({
                        "content": message.content,
                        "author": str(message.author),
                        "posted_at": message.created_at,
                        "urls": urls
                    })
                    message_count += 1
                
                logger.info(f"メッセージ取得完了: {message_count}件（URL含むもの）")
                
            except discord.errors.Forbidden:
                logger.error("権限エラー: チャンネルへのアクセス権限がありません")
            except Exception as e:
                logger.error(f"メッセージ取得エラー: {e}")
            finally:
                await self.client.close()
        
        # Bot実行
        try:
            await self.client.start(self.token)
        except discord.errors.LoginFailure:
            logger.error("Discord Bot Token が無効です")
        except Exception as e:
            logger.error(f"Discord接続エラー: {e}")
        
        return messages_data
    
    @staticmethod
    def _extract_urls(text: str) -> List[str]:
        """
        テキストからURLを抽出
        
        Args:
            text: メッセージ本文
        
        Returns:
            URLのリスト
        """
        # URLパターン（http/https）
        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        urls = re.findall(url_pattern, text)
        
        # 重複を除去
        return list(set(urls))


async def fetch_discord_messages(
    token: str,
    channel_id: int,
    after: Optional[datetime] = None,
    limit: Optional[int] = None
) -> List[Dict]:
    """
    Discordからメッセージを取得する便利関数
    
    Args:
        token: Discord Bot Token
        channel_id: チャンネルID
        after: この日時以降のメッセージのみ取得
        limit: 取得するメッセージ数の上限
    
    Returns:
        メッセージ情報のリスト
    """
    fetcher = DiscordMessageFetcher(token, channel_id)
    return await fetcher.fetch_messages(after=after, limit=limit)


# テスト用
if __name__ == "__main__":
    import asyncio
    from dotenv import load_dotenv
    
    # ロガー設定
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s"
    )
    
    # 環境変数読み込み
    load_dotenv()
    
    token = os.getenv("DISCORD_TOKEN")
    channel_id = int(os.getenv("DISCORD_CHANNEL_ID"))
    
    if not token or not channel_id:
        logger.error("環境変数が設定されていません")
        exit(1)
    
    # メッセージ取得テスト
    async def test():
        logger.info("Discord連携テスト開始")
        messages = await fetch_discord_messages(
            token=token,
            channel_id=channel_id,
            limit=10  # テストなので最新10件のみ
        )
        
        logger.info(f"\n取得したメッセージ: {len(messages)}件")
        for i, msg in enumerate(messages, 1):
            logger.info(f"\n--- メッセージ {i} ---")
            logger.info(f"投稿者: {msg['author']}")
            logger.info(f"投稿日時: {msg['posted_at']}")
            logger.info(f"URL数: {len(msg['urls'])}")
            for url in msg['urls']:
                logger.info(f"  - {url}")
    
    asyncio.run(test())
