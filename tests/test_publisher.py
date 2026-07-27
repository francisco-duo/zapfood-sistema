import uuid
from unittest.mock import AsyncMock, patch

from app.messaging.publisher import publicar_evento_pedido
from app.messaging.routing_keys import RoutingKeyPedido


async def test_publicar_evento_pedido_publica_na_exchange_correta():
    exchange_falsa = AsyncMock()
    pedido_id = uuid.uuid4()

    with patch("app.messaging.publisher.get_exchange", return_value=exchange_falsa):
        await publicar_evento_pedido(RoutingKeyPedido.APROVADO, pedido_id, {"status": "em_preparo"})

    exchange_falsa.publish.assert_awaited_once()
    _, kwargs = exchange_falsa.publish.call_args
    assert kwargs["routing_key"] == RoutingKeyPedido.APROVADO.value

    mensagem_enviada = exchange_falsa.publish.call_args[0][0]
    assert mensagem_enviada.content_type == "application/json"
    assert str(pedido_id).encode() in mensagem_enviada.body


async def test_publicar_evento_pedido_nao_propaga_erro_do_broker():
    with patch("app.messaging.publisher.get_exchange", side_effect=ConnectionError("broker fora do ar")):
        await publicar_evento_pedido(
            RoutingKeyPedido.EM_PREPARO, uuid.uuid4(), {"status": "em_preparo"}
        )  # não deve levantar
