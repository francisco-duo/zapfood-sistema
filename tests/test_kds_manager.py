from unittest.mock import AsyncMock

from app.messaging.kds_manager import KdsConnectionManager


async def test_conectar_aceita_e_registra_a_conexao():
    manager = KdsConnectionManager()
    ws = AsyncMock()

    await manager.conectar(ws)

    ws.accept.assert_awaited_once()
    assert ws in manager._conexoes


async def test_desconectar_remove_a_conexao():
    manager = KdsConnectionManager()
    ws = AsyncMock()
    await manager.conectar(ws)

    manager.desconectar(ws)

    assert ws not in manager._conexoes


def test_desconectar_e_idempotente_pra_conexao_nao_registrada():
    manager = KdsConnectionManager()
    ws = AsyncMock()
    manager.desconectar(ws)  # não deve levantar


async def test_transmitir_envia_para_todas_as_conexoes_abertas():
    manager = KdsConnectionManager()
    ws1, ws2 = AsyncMock(), AsyncMock()
    await manager.conectar(ws1)
    await manager.conectar(ws2)

    await manager.transmitir({"tipo": "pedido_em_preparo", "pedido_id": "abc"})

    ws1.send_text.assert_awaited_once()
    ws2.send_text.assert_awaited_once()
    assert '"tipo": "pedido_em_preparo"' in ws1.send_text.call_args[0][0]


async def test_transmitir_remove_conexoes_mortas_sem_afetar_as_demais():
    manager = KdsConnectionManager()
    ws_morta, ws_viva = AsyncMock(), AsyncMock()
    ws_morta.send_text.side_effect = RuntimeError("conexão fechada")
    await manager.conectar(ws_morta)
    await manager.conectar(ws_viva)

    await manager.transmitir({"tipo": "pedido_removido"})

    ws_viva.send_text.assert_awaited_once()
    assert ws_morta not in manager._conexoes
    assert ws_viva in manager._conexoes
