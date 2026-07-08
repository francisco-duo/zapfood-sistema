import asyncio
import json
import logging

import aio_pika

from app.core.config import settings
from app.messaging.notifiers import enviar_email, enviar_push, enviar_whatsapp, mensagem_para
from app.messaging.rabbitmq import NOTIFICATIONS_QUEUE, declarar_topologia, obter_canal

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("messaging.consumer")


async def processar_mensagem(mensagem: aio_pika.abc.AbstractIncomingMessage) -> None:
    async with mensagem.process():
        payload = json.loads(mensagem.body)
        routing_key = mensagem.routing_key or payload.get("routing_key", "")
        pedido_id = payload.get("pedido_id", "desconhecido")
        texto = mensagem_para(routing_key)

        logger.info("Notificação recebida: pedido=%s routing_key=%s", pedido_id, routing_key)

        # Cada canal roda isolado: falha em um serviço externo não deve derrubar os demais
        # nem re-enfileirar a mensagem inteira (ack já ocorre ao sair do bloco `process`).
        for canal in (enviar_push, enviar_whatsapp, enviar_email):
            try:
                await canal(pedido_id, texto)
            except Exception:
                logger.exception("Falha ao notificar pedido %s via %s", pedido_id, canal.__name__)


async def main() -> None:
    _, fila = await declarar_topologia()
    channel = await obter_canal()
    await channel.set_qos(prefetch_count=10)

    logger.info(
        "Worker de notificações ouvindo a fila '%s' em %s", NOTIFICATIONS_QUEUE, settings.RABBITMQ_URL
    )
    await fila.consume(processar_mensagem)

    await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
