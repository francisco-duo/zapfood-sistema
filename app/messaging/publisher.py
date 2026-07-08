import json
import logging
import uuid
from datetime import datetime, timezone

import aio_pika

from app.messaging.rabbitmq import get_exchange
from app.messaging.routing_keys import RoutingKeyPedido

logger = logging.getLogger("messaging.publisher")


async def publicar_evento_pedido(
    routing_key: RoutingKeyPedido, pedido_id: uuid.UUID, dados: dict
) -> None:
    """Publica um evento de mudança de estado do pedido na pedidos_exchange.

    Roda como BackgroundTask após a resposta HTTP já ter sido enviada (RNF004):
    uma falha ou lentidão do broker nunca bloqueia ou derruba a requisição principal,
    por isso qualquer exceção aqui é apenas logada, nunca propagada.
    """
    payload = {
        "pedido_id": str(pedido_id),
        "routing_key": routing_key.value,
        "emitido_em": datetime.now(timezone.utc).isoformat(),
        **dados,
    }
    try:
        exchange = await get_exchange()
        mensagem = aio_pika.Message(
            body=json.dumps(payload).encode("utf-8"),
            content_type="application/json",
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        )
        await exchange.publish(mensagem, routing_key=routing_key.value)
        logger.info("Evento publicado: %s (pedido=%s)", routing_key.value, pedido_id)
    except Exception:
        logger.exception(
            "Falha ao publicar evento %s para o pedido %s", routing_key.value, pedido_id
        )
