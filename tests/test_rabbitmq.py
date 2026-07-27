from types import SimpleNamespace

import pytest

from app.messaging import rabbitmq


@pytest.fixture(autouse=True)
def _resetar_estado_global_do_modulo():
    """Cada teste roda no seu próprio event loop (padrão do pytest-asyncio),
    mas _connection/_channel/_exchange são globais do módulo — sem resetar
    isso, um teste reaproveitaria uma conexão presa ao loop (já fechado) do
    teste anterior."""
    rabbitmq._connection = None
    rabbitmq._channel = None
    rabbitmq._exchange = None
    rabbitmq._fila_notificacoes = None
    yield


def test_conexao_esta_saudavel_false_quando_nunca_conectou(monkeypatch):
    monkeypatch.setattr(rabbitmq, "_connection", None)
    assert rabbitmq.conexao_esta_saudavel() is False


def test_conexao_esta_saudavel_false_quando_conexao_fechada(monkeypatch):
    monkeypatch.setattr(rabbitmq, "_connection", SimpleNamespace(is_closed=True))
    assert rabbitmq.conexao_esta_saudavel() is False


def test_conexao_esta_saudavel_true_quando_conexao_aberta(monkeypatch):
    monkeypatch.setattr(rabbitmq, "_connection", SimpleNamespace(is_closed=False))
    assert rabbitmq.conexao_esta_saudavel() is True


async def test_declarar_topologia_e_idempotente_e_expoe_conexao_saudavel():
    # Integração real: usa o RabbitMQ configurado em RABBITMQ_URL (docker-compose).
    exchange1, fila1 = await rabbitmq.declarar_topologia()
    exchange2, fila2 = await rabbitmq.declarar_topologia()

    assert exchange1.name == exchange2.name == rabbitmq.EXCHANGE_NAME
    assert fila1.name == fila2.name == rabbitmq.NOTIFICATIONS_QUEUE
    assert rabbitmq.conexao_esta_saudavel() is True


async def test_get_exchange_declara_topologia_sob_demanda():
    exchange = await rabbitmq.get_exchange()
    assert exchange.name == rabbitmq.EXCHANGE_NAME
