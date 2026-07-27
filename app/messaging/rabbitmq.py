import aio_pika
from aio_pika import ExchangeType
from aio_pika.abc import (
    AbstractChannel,
    AbstractExchange,
    AbstractQueue,
    AbstractRobustConnection,
)

from app.core.config import settings

EXCHANGE_NAME = "pedidos_exchange"
NOTIFICATIONS_QUEUE = "fila_notificacoes_cliente"
NOTIFICATIONS_BINDING_KEY = "pedido.status.*"

_connection: AbstractRobustConnection | None = None
_channel: AbstractChannel | None = None
_exchange: AbstractExchange | None = None
_fila_notificacoes: AbstractQueue | None = None


async def obter_canal() -> AbstractChannel:
    global _connection, _channel
    if _connection is None or _connection.is_closed:
        _connection = await aio_pika.connect_robust(
            settings.RABBITMQ_URL, heartbeat=settings.RABBITMQ_HEARTBEAT_SEGUNDOS
        )
    if _channel is None or _channel.is_closed:
        _channel = await _connection.channel()
    return _channel


def conexao_esta_saudavel() -> bool:
    """Usado pelo endpoint de readiness — nunca abre conexão nova, só reporta o estado atual."""
    return _connection is not None and not _connection.is_closed


async def declarar_topologia() -> tuple[AbstractExchange, AbstractQueue]:
    """Declara a exchange de pedidos e a fila de notificações do cliente, e as vincula.

    Idempotente: seguro para ser chamado tanto pela API quanto pelo worker.
    """
    global _exchange, _fila_notificacoes
    channel = await obter_canal()
    exchange = await channel.declare_exchange(EXCHANGE_NAME, ExchangeType.TOPIC, durable=True)
    fila = await channel.declare_queue(NOTIFICATIONS_QUEUE, durable=True)
    await fila.bind(exchange, routing_key=NOTIFICATIONS_BINDING_KEY)
    _exchange = exchange
    _fila_notificacoes = fila
    return exchange, fila


async def get_exchange() -> AbstractExchange:
    if _exchange is None:
        exchange, _ = await declarar_topologia()
        return exchange
    return _exchange


async def fechar_conexao() -> None:
    global _connection
    if _connection is not None and not _connection.is_closed:
        await _connection.close()
