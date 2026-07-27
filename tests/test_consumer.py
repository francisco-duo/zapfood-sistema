import json
from unittest.mock import AsyncMock, patch

from app.messaging import consumer


class _MensagemFalsa:
    """Substitui aio_pika.abc.AbstractIncomingMessage: só precisamos de
    `.process()` (async context manager) e dos atributos lidos pelo consumer."""

    def __init__(self, body: dict, routing_key: str):
        self.body = json.dumps(body).encode("utf-8")
        self.routing_key = routing_key

    def process(self):
        return self

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc_info):
        return False


async def test_processar_mensagem_chama_todos_os_canais_de_notificacao():
    mensagem = _MensagemFalsa(
        {"pedido_id": "pedido-123", "routing_key": "pedido.status.aprovado"},
        routing_key="pedido.status.aprovado",
    )

    with (
        patch.object(consumer, "enviar_push", new=AsyncMock()) as push_falso,
        patch.object(consumer, "enviar_whatsapp", new=AsyncMock()) as whatsapp_falso,
        patch.object(consumer, "enviar_email", new=AsyncMock()) as email_falso,
    ):
        await consumer.processar_mensagem(mensagem)

    for canal_falso in (push_falso, whatsapp_falso, email_falso):
        canal_falso.assert_awaited_once_with(
            "pedido-123", "Seu pedido foi aprovado e já seguiu para a cozinha!"
        )


async def test_processar_mensagem_isola_falha_de_um_canal_dos_demais():
    mensagem = _MensagemFalsa(
        {"pedido_id": "pedido-123", "routing_key": "pedido.status.pronto"},
        routing_key="pedido.status.pronto",
    )

    with (
        patch.object(consumer, "enviar_push", new=AsyncMock(side_effect=RuntimeError("falhou"))),
        patch.object(consumer, "enviar_whatsapp", new=AsyncMock()) as whatsapp_falso,
        patch.object(consumer, "enviar_email", new=AsyncMock()) as email_falso,
    ):
        await consumer.processar_mensagem(mensagem)  # não deve levantar

    whatsapp_falso.assert_awaited_once()
    email_falso.assert_awaited_once()


async def test_processar_mensagem_usa_routing_key_do_payload_quando_ausente_na_mensagem():
    mensagem = _MensagemFalsa(
        {"pedido_id": "pedido-9", "routing_key": "pedido.status.em_preparo"}, routing_key=""
    )

    with (
        patch.object(consumer, "enviar_push", new=AsyncMock()) as push_falso,
        patch.object(consumer, "enviar_whatsapp", new=AsyncMock()),
        patch.object(consumer, "enviar_email", new=AsyncMock()),
    ):
        await consumer.processar_mensagem(mensagem)

    push_falso.assert_awaited_once_with("pedido-9", "Seu pedido está em preparo.")
