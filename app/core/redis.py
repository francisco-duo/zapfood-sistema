import redis.asyncio as redis

from app.core.config import settings

_redis_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            max_connections=settings.REDIS_MAX_CONNECTIONS,
            socket_timeout=settings.REDIS_SOCKET_TIMEOUT_SEGUNDOS,
            socket_connect_timeout=settings.REDIS_SOCKET_CONNECT_TIMEOUT_SEGUNDOS,
            # Detecta conexões mortas do pool antes de reusá-las (mesmo racional
            # do pool_pre_ping do banco).
            health_check_interval=30,
            retry_on_timeout=True,
        )
    return _redis_client


async def fechar_redis() -> None:
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
