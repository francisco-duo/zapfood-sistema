from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.messaging.kds_manager import kds_manager
from app.models.pedido import Pedido, StatusPedido
from app.schemas.pedido import PedidoRead

router = APIRouter()


@router.get("/api/v1/kds/fila", response_model=list[PedidoRead])
async def obter_fila_kds(db: AsyncSession = Depends(get_db)) -> list[Pedido]:
    """Hidratação inicial da tela da cozinha ao conectar/reconectar.

    Depois da carga inicial, novas entradas e saídas da fila chegam via
    WebSocket em /ws/kds — não há polling.
    """
    resultado = await db.execute(
        select(Pedido)
        .options(selectinload(Pedido.itens))
        .where(Pedido.status == StatusPedido.em_preparo)
        .order_by(Pedido.criado_em)
    )
    return list(resultado.scalars().all())


@router.websocket("/ws/kds")
async def websocket_kds(websocket: WebSocket) -> None:
    await kds_manager.conectar(websocket)
    try:
        while True:
            # A tela da cozinha não precisa enviar nada; apenas mantemos a conexão viva.
            await websocket.receive_text()
    except WebSocketDisconnect:
        kds_manager.desconectar(websocket)
