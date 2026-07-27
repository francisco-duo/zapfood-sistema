import uuid

from app.models.pedido import StatusPedido, TipoEntrega
from tests import factories
from tests.conftest import auth_headers

PREFIXO = "/api/v1/pedidos"


def _payload_pedido_online(**overrides) -> dict:
    payload = {
        "origem": "online",
        "tipo_entrega": "retirada",
        "forma_pagamento": "Pix",
        "itens": [
            {"produto_id": str(uuid.uuid4()), "quantidade": 2, "preco_unitario_cobrado": 25.9}
        ],
    }
    payload.update(overrides)
    return payload


def _payload_pedido_balcao(**overrides) -> dict:
    payload = {
        "origem": "balcao",
        "tipo_entrega": "consumo_local",
        "forma_pagamento": "Dinheiro",
        "itens": [
            {"produto_id": str(uuid.uuid4()), "quantidade": 1, "preco_unitario_cobrado": 10.0}
        ],
    }
    payload.update(overrides)
    return payload


# --- criar pedido ---------------------------------------------------------


async def test_criar_pedido_online_como_cliente_verificado(client, usuario_cliente):
    resposta = await client.post(
        PREFIXO, headers=auth_headers(usuario_cliente), json=_payload_pedido_online()
    )
    assert resposta.status_code == 201
    corpo = resposta.json()
    assert corpo["status"] == "aguardando_aprovacao"
    assert corpo["usuario_id"] == str(usuario_cliente.id)
    assert corpo["valor_total"] == 51.8


async def test_criar_pedido_online_ignora_usuario_id_do_corpo_da_requisicao(
    client, db_session, usuario_cliente
):
    outro = await factories.criar_usuario(db_session)
    resposta = await client.post(
        PREFIXO,
        headers=auth_headers(usuario_cliente),
        json=_payload_pedido_online(usuario_id=str(outro.id)),
    )
    assert resposta.json()["usuario_id"] == str(usuario_cliente.id)


async def test_criar_pedido_online_como_cliente_nao_verificado_retorna_403(
    client, usuario_cliente_nao_verificado
):
    resposta = await client.post(
        PREFIXO, headers=auth_headers(usuario_cliente_nao_verificado), json=_payload_pedido_online()
    )
    assert resposta.status_code == 403
    assert "Confirme seu e-mail" in resposta.json()["detail"]


async def test_criar_pedido_balcao_como_admin_vai_direto_pra_preparo(client, usuario_admin):
    resposta = await client.post(
        PREFIXO, headers=auth_headers(usuario_admin), json=_payload_pedido_balcao()
    )
    assert resposta.status_code == 201
    assert resposta.json()["status"] == "em_preparo"
    assert resposta.json()["usuario_id"] is None


async def test_criar_pedido_balcao_como_cliente_retorna_403(client, usuario_cliente):
    resposta = await client.post(
        PREFIXO, headers=auth_headers(usuario_cliente), json=_payload_pedido_balcao()
    )
    assert resposta.status_code == 403


async def test_criar_pedido_sem_itens_retorna_422(client, usuario_cliente):
    resposta = await client.post(
        PREFIXO, headers=auth_headers(usuario_cliente), json=_payload_pedido_online(itens=[])
    )
    assert resposta.status_code == 422


# --- listar pedidos (gestão) ---------------------------------------------------------


async def test_listar_pedidos_como_admin(client, db_session, usuario_admin):
    await factories.criar_pedido(db_session, status=StatusPedido.em_preparo)
    await factories.criar_pedido(db_session, status=StatusPedido.finalizado)

    resposta = await client.get(PREFIXO, headers=auth_headers(usuario_admin))
    assert resposta.status_code == 200
    assert len(resposta.json()) == 2


async def test_listar_pedidos_filtra_por_status(client, db_session, usuario_admin):
    await factories.criar_pedido(db_session, status=StatusPedido.em_preparo)
    await factories.criar_pedido(db_session, status=StatusPedido.finalizado)

    resposta = await client.get(
        PREFIXO, headers=auth_headers(usuario_admin), params={"status_pedido": "em_preparo"}
    )
    assert resposta.status_code == 200
    assert len(resposta.json()) == 1
    assert resposta.json()[0]["status"] == "em_preparo"


async def test_listar_pedidos_como_cliente_retorna_403(client, usuario_cliente):
    resposta = await client.get(PREFIXO, headers=auth_headers(usuario_cliente))
    assert resposta.status_code == 403


# --- obter pedido por id ---------------------------------------------------------


async def test_obter_pedido_como_dono(client, db_session, usuario_cliente):
    pedido = await factories.criar_pedido(db_session, usuario=usuario_cliente)
    resposta = await client.get(f"{PREFIXO}/{pedido.id}", headers=auth_headers(usuario_cliente))
    assert resposta.status_code == 200


async def test_obter_pedido_de_outro_cliente_retorna_403(client, db_session, usuario_cliente):
    dono = await factories.criar_usuario(db_session)
    pedido = await factories.criar_pedido(db_session, usuario=dono)

    resposta = await client.get(f"{PREFIXO}/{pedido.id}", headers=auth_headers(usuario_cliente))
    assert resposta.status_code == 403


async def test_obter_pedido_como_gestao_ve_qualquer_pedido(client, db_session, usuario_admin):
    pedido = await factories.criar_pedido(db_session)
    resposta = await client.get(f"{PREFIXO}/{pedido.id}", headers=auth_headers(usuario_admin))
    assert resposta.status_code == 200


async def test_obter_pedido_inexistente_retorna_404(client, usuario_admin):
    resposta = await client.get(f"{PREFIXO}/{uuid.uuid4()}", headers=auth_headers(usuario_admin))
    assert resposta.status_code == 404


# --- aprovar ---------------------------------------------------------


async def test_aprovar_pedido_muda_status_para_em_preparo(client, db_session, usuario_admin):
    pedido = await factories.criar_pedido(db_session, status=StatusPedido.aguardando_aprovacao)
    resposta = await client.post(
        f"{PREFIXO}/{pedido.id}/aprovar", headers=auth_headers(usuario_admin)
    )
    assert resposta.status_code == 200
    assert resposta.json()["status"] == "em_preparo"


async def test_aprovar_pedido_que_nao_esta_aguardando_retorna_409(client, db_session, usuario_admin):
    pedido = await factories.criar_pedido(db_session, status=StatusPedido.em_preparo)
    resposta = await client.post(
        f"{PREFIXO}/{pedido.id}/aprovar", headers=auth_headers(usuario_admin)
    )
    assert resposta.status_code == 409


async def test_aprovar_pedido_como_cozinha_retorna_403(client, db_session, usuario_cozinha):
    pedido = await factories.criar_pedido(db_session, status=StatusPedido.aguardando_aprovacao)
    resposta = await client.post(
        f"{PREFIXO}/{pedido.id}/aprovar", headers=auth_headers(usuario_cozinha)
    )
    assert resposta.status_code == 403


# --- cancelar ---------------------------------------------------------


async def test_cancelar_pedido(client, db_session, usuario_admin):
    pedido = await factories.criar_pedido(db_session, status=StatusPedido.aguardando_aprovacao)
    resposta = await client.post(
        f"{PREFIXO}/{pedido.id}/cancelar", headers=auth_headers(usuario_admin)
    )
    assert resposta.status_code == 200
    assert resposta.json()["status"] == "cancelado"


async def test_cancelar_pedido_ja_finalizado_retorna_409(client, db_session, usuario_admin):
    pedido = await factories.criar_pedido(db_session, status=StatusPedido.finalizado)
    resposta = await client.post(
        f"{PREFIXO}/{pedido.id}/cancelar", headers=auth_headers(usuario_admin)
    )
    assert resposta.status_code == 409


# --- pronto ---------------------------------------------------------


async def test_marcar_pronto_retirada(client, db_session, usuario_cozinha):
    pedido = await factories.criar_pedido(
        db_session, status=StatusPedido.em_preparo, tipo_entrega=TipoEntrega.retirada
    )
    resposta = await client.post(
        f"{PREFIXO}/{pedido.id}/pronto", headers=auth_headers(usuario_cozinha)
    )
    assert resposta.status_code == 200
    assert resposta.json()["status"] == "pronto_retirada"


async def test_marcar_pronto_delivery(client, db_session, usuario_cozinha):
    pedido = await factories.criar_pedido(
        db_session, status=StatusPedido.em_preparo, tipo_entrega=TipoEntrega.delivery
    )
    resposta = await client.post(
        f"{PREFIXO}/{pedido.id}/pronto", headers=auth_headers(usuario_cozinha)
    )
    assert resposta.json()["status"] == "pronto_entrega"


async def test_marcar_pronto_pedido_que_nao_esta_em_preparo_retorna_409(
    client, db_session, usuario_cozinha
):
    pedido = await factories.criar_pedido(db_session, status=StatusPedido.aguardando_aprovacao)
    resposta = await client.post(
        f"{PREFIXO}/{pedido.id}/pronto", headers=auth_headers(usuario_cozinha)
    )
    assert resposta.status_code == 409


async def test_marcar_pronto_como_balcao_retorna_403(client, db_session, usuario_balcao):
    pedido = await factories.criar_pedido(db_session, status=StatusPedido.em_preparo)
    resposta = await client.post(
        f"{PREFIXO}/{pedido.id}/pronto", headers=auth_headers(usuario_balcao)
    )
    assert resposta.status_code == 403


# --- saiu para entrega ---------------------------------------------------------


async def test_marcar_saiu_para_entrega(client, db_session, usuario_admin):
    pedido = await factories.criar_pedido(
        db_session, status=StatusPedido.pronto_entrega, tipo_entrega=TipoEntrega.delivery
    )
    resposta = await client.post(
        f"{PREFIXO}/{pedido.id}/saiu-para-entrega", headers=auth_headers(usuario_admin)
    )
    assert resposta.status_code == 200


async def test_marcar_saiu_para_entrega_em_pedido_de_retirada_retorna_409(
    client, db_session, usuario_admin
):
    pedido = await factories.criar_pedido(
        db_session, status=StatusPedido.pronto_retirada, tipo_entrega=TipoEntrega.retirada
    )
    resposta = await client.post(
        f"{PREFIXO}/{pedido.id}/saiu-para-entrega", headers=auth_headers(usuario_admin)
    )
    assert resposta.status_code == 409


async def test_marcar_saiu_para_entrega_pedido_nao_pronto_retorna_409(
    client, db_session, usuario_admin
):
    pedido = await factories.criar_pedido(
        db_session, status=StatusPedido.em_preparo, tipo_entrega=TipoEntrega.delivery
    )
    resposta = await client.post(
        f"{PREFIXO}/{pedido.id}/saiu-para-entrega", headers=auth_headers(usuario_admin)
    )
    assert resposta.status_code == 409


# --- finalizar ---------------------------------------------------------


async def test_finalizar_pedido(client, db_session, usuario_admin):
    pedido = await factories.criar_pedido(db_session, status=StatusPedido.pronto_retirada)
    resposta = await client.post(
        f"{PREFIXO}/{pedido.id}/finalizar", headers=auth_headers(usuario_admin)
    )
    assert resposta.status_code == 200
    assert resposta.json()["status"] == "finalizado"


async def test_finalizar_pedido_que_nao_esta_pronto_retorna_409(client, db_session, usuario_admin):
    pedido = await factories.criar_pedido(db_session, status=StatusPedido.em_preparo)
    resposta = await client.post(
        f"{PREFIXO}/{pedido.id}/finalizar", headers=auth_headers(usuario_admin)
    )
    assert resposta.status_code == 409
