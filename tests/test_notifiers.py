import pytest

from app.messaging.notifiers import enviar_email, enviar_push, enviar_whatsapp, mensagem_para


@pytest.mark.parametrize(
    "routing_key,esperado",
    [
        ("pedido.status.aprovado", "Seu pedido foi aprovado e já seguiu para a cozinha!"),
        ("pedido.status.em_preparo", "Seu pedido está em preparo."),
        ("pedido.status.pronto", "Seu pedido ficou pronto!"),
        ("pedido.status.saiu_entrega", "Seu pedido saiu para entrega!"),
    ],
)
def test_mensagem_para_routing_keys_conhecidas(routing_key, esperado):
    assert mensagem_para(routing_key) == esperado


def test_mensagem_para_routing_key_desconhecida_usa_fallback():
    assert mensagem_para("routing.key.inventada") == "Atualização do seu pedido."


async def test_canais_de_notificacao_nao_levantam_excecao():
    await enviar_push("pedido-1", "texto")
    await enviar_whatsapp("pedido-1", "texto")
    await enviar_email("pedido-1", "texto")
