from unittest.mock import AsyncMock, patch

from app.schemas.produto import CardapioResponse
from app.services.cardapio_cache import (
    CARDAPIO_CACHE_KEY,
    CARDAPIO_CACHE_TTL_SEGUNDOS,
    invalidar_cardapio_cache,
    obter_cardapio_cache,
    salvar_cardapio_cache,
)


async def test_obter_cardapio_cache_retorna_valor_do_redis():
    cliente_falso = AsyncMock()
    cliente_falso.get.return_value = '{"categorias": [], "produtos": []}'

    with patch("app.services.cardapio_cache.get_redis", return_value=cliente_falso):
        resultado = await obter_cardapio_cache()

    assert resultado == '{"categorias": [], "produtos": []}'
    cliente_falso.get.assert_awaited_once_with(CARDAPIO_CACHE_KEY)


async def test_obter_cardapio_cache_retorna_none_quando_redis_falha():
    cliente_falso = AsyncMock()
    cliente_falso.get.side_effect = ConnectionError("redis fora do ar")

    with patch("app.services.cardapio_cache.get_redis", return_value=cliente_falso):
        resultado = await obter_cardapio_cache()

    assert resultado is None


async def test_salvar_cardapio_cache_grava_com_ttl():
    cliente_falso = AsyncMock()
    payload = CardapioResponse(categorias=[], produtos=[])

    with patch("app.services.cardapio_cache.get_redis", return_value=cliente_falso):
        await salvar_cardapio_cache(payload)

    cliente_falso.set.assert_awaited_once_with(
        CARDAPIO_CACHE_KEY, payload.model_dump_json(), ex=CARDAPIO_CACHE_TTL_SEGUNDOS
    )


async def test_salvar_cardapio_cache_nao_propaga_erro_do_redis():
    cliente_falso = AsyncMock()
    cliente_falso.set.side_effect = ConnectionError("redis fora do ar")
    payload = CardapioResponse(categorias=[], produtos=[])

    with patch("app.services.cardapio_cache.get_redis", return_value=cliente_falso):
        await salvar_cardapio_cache(payload)  # não deve levantar


async def test_invalidar_cardapio_cache_remove_a_chave():
    cliente_falso = AsyncMock()

    with patch("app.services.cardapio_cache.get_redis", return_value=cliente_falso):
        await invalidar_cardapio_cache()

    cliente_falso.delete.assert_awaited_once_with(CARDAPIO_CACHE_KEY)


async def test_invalidar_cardapio_cache_nao_propaga_erro_do_redis():
    cliente_falso = AsyncMock()
    cliente_falso.delete.side_effect = ConnectionError("redis fora do ar")

    with patch("app.services.cardapio_cache.get_redis", return_value=cliente_falso):
        await invalidar_cardapio_cache()  # não deve levantar
