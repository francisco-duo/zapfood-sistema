from unittest.mock import AsyncMock, patch

from app.core.health import verificar_banco, verificar_rabbitmq, verificar_redis
from app.messaging import rabbitmq


async def test_verificar_banco_true_quando_conecta_com_sucesso():
    assert await verificar_banco() is True


async def test_verificar_banco_false_quando_sessao_levanta_excecao():
    with patch("app.core.health.AsyncSessionLocal", side_effect=ConnectionError("banco fora do ar")):
        assert await verificar_banco() is False


async def test_verificar_redis_true_quando_ping_responde():
    cliente_falso = AsyncMock()
    cliente_falso.ping.return_value = True
    with patch("app.core.health.get_redis", return_value=cliente_falso):
        assert await verificar_redis() is True


async def test_verificar_redis_false_quando_ping_falha():
    cliente_falso = AsyncMock()
    cliente_falso.ping.side_effect = ConnectionError("redis fora do ar")
    with patch("app.core.health.get_redis", return_value=cliente_falso):
        assert await verificar_redis() is False


async def test_verificar_rabbitmq_false_sem_conexao(monkeypatch):
    monkeypatch.setattr(rabbitmq, "_connection", None)
    assert await verificar_rabbitmq() is False


async def test_verificar_rabbitmq_true_com_conexao_aberta(monkeypatch):
    from types import SimpleNamespace

    monkeypatch.setattr(rabbitmq, "_connection", SimpleNamespace(is_closed=False))
    assert await verificar_rabbitmq() is True
