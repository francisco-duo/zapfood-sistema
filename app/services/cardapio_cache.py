import logging

from app.core.redis import get_redis
from app.schemas.produto import CardapioResponse

logger = logging.getLogger("services.cardapio_cache")

CARDAPIO_CACHE_KEY = "cardapio:ativo"
# Rede de segurança: mesmo que uma invalidação seja perdida por algum motivo,
# o cache nunca fica desatualizado por mais do que esse tempo.
CARDAPIO_CACHE_TTL_SEGUNDOS = 300


async def obter_cardapio_cache() -> str | None:
    try:
        client = get_redis()
        return await client.get(CARDAPIO_CACHE_KEY)
    except Exception:
        logger.exception("Falha ao ler cache do cardápio; seguindo direto para o banco.")
        return None


async def salvar_cardapio_cache(payload: CardapioResponse) -> None:
    try:
        client = get_redis()
        await client.set(CARDAPIO_CACHE_KEY, payload.model_dump_json(), ex=CARDAPIO_CACHE_TTL_SEGUNDOS)
    except Exception:
        logger.exception("Falha ao gravar cache do cardápio.")


async def invalidar_cardapio_cache() -> None:
    try:
        client = get_redis()
        await client.delete(CARDAPIO_CACHE_KEY)
    except Exception:
        logger.exception("Falha ao invalidar cache do cardápio.")
