import logging

logger = logging.getLogger("messaging.notifiers")

MENSAGENS_POR_ROUTING_KEY = {
    "pedido.status.aprovado": "Seu pedido foi aprovado e já seguiu para a cozinha!",
    "pedido.status.em_preparo": "Seu pedido está em preparo.",
    "pedido.status.pronto": "Seu pedido ficou pronto!",
    "pedido.status.saiu_entrega": "Seu pedido saiu para entrega!",
}


def mensagem_para(routing_key: str) -> str:
    return MENSAGENS_POR_ROUTING_KEY.get(routing_key, "Atualização do seu pedido.")


async def enviar_push(pedido_id: str, mensagem: str) -> None:
    logger.info("[Firebase Push] pedido=%s -> %s", pedido_id, mensagem)


async def enviar_whatsapp(pedido_id: str, mensagem: str) -> None:
    logger.info("[WhatsApp] pedido=%s -> %s", pedido_id, mensagem)


async def enviar_email(pedido_id: str, mensagem: str) -> None:
    logger.info("[E-mail] pedido=%s -> %s", pedido_id, mensagem)
