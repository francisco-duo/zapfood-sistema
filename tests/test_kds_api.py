from app.core.security import criar_access_token
from app.main import app
from app.models.pedido import StatusPedido
from tests import factories
from tests.conftest import auth_headers

PREFIXO = "/api/v1/kds"


async def test_obter_fila_kds_retorna_apenas_pedidos_em_preparo(client, db_session, usuario_cozinha):
    await factories.criar_pedido(db_session, status=StatusPedido.em_preparo)
    await factories.criar_pedido(db_session, status=StatusPedido.finalizado)

    resposta = await client.get(f"{PREFIXO}/fila", headers=auth_headers(usuario_cozinha))
    assert resposta.status_code == 200
    assert len(resposta.json()) == 1
    assert resposta.json()[0]["status"] == "em_preparo"


async def test_obter_fila_kds_como_cliente_retorna_403(client, usuario_cliente):
    resposta = await client.get(f"{PREFIXO}/fila", headers=auth_headers(usuario_cliente))
    assert resposta.status_code == 403


async def test_obter_fila_kds_como_balcao_retorna_403(client, usuario_balcao):
    resposta = await client.get(f"{PREFIXO}/fila", headers=auth_headers(usuario_balcao))
    assert resposta.status_code == 403


def test_websocket_kds_recusa_token_invalido():
    from fastapi.testclient import TestClient

    with TestClient(app) as tc:
        try:
            with tc.websocket_connect("/ws/kds?token=token-invalido"):
                pass
        except Exception as exc:
            # starlette levanta WebSocketDisconnect com o code que o servidor enviou
            assert getattr(exc, "code", None) == 4401


def test_websocket_kds_recusa_perfil_sem_permissao():
    from fastapi.testclient import TestClient

    token = criar_access_token(usuario_id="00000000-0000-0000-0000-000000000000", perfil="cliente")

    with TestClient(app) as tc:
        try:
            with tc.websocket_connect(f"/ws/kds?token={token}"):
                pass
        except Exception as exc:
            assert getattr(exc, "code", None) == 4403


def test_websocket_kds_aceita_perfil_cozinha():
    from fastapi.testclient import TestClient

    token = criar_access_token(usuario_id="00000000-0000-0000-0000-000000000000", perfil="cozinha")

    with TestClient(app) as tc:
        with tc.websocket_connect(f"/ws/kds?token={token}") as ws:
            ws.close()
