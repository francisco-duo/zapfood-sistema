import json
import logging

from fastapi import WebSocket

logger = logging.getLogger("kds.manager")


class KdsConnectionManager:
    """Canal em processo para push em tempo real ao KDS (RNF001/RF011).

    Broadcast direto via WebSocket, sem broker no meio: é o caminho de menor
    latência para a tela da cozinha. Independe da fila RabbitMQ, que serve a
    um propósito diferente (notificações assíncronas ao cliente final).
    """

    def __init__(self) -> None:
        self._conexoes: set[WebSocket] = set()

    async def conectar(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._conexoes.add(websocket)

    def desconectar(self, websocket: WebSocket) -> None:
        self._conexoes.discard(websocket)

    async def transmitir(self, mensagem: dict) -> None:
        payload = json.dumps(mensagem, default=str)
        conexoes_mortas: list[WebSocket] = []
        for conexao in list(self._conexoes):
            try:
                await conexao.send_text(payload)
            except Exception:
                conexoes_mortas.append(conexao)
        for conexao in conexoes_mortas:
            self._conexoes.discard(conexao)


kds_manager = KdsConnectionManager()
