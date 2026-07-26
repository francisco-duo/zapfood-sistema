from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import requer_perfil
from app.core.security import JWTError, decodificar_access_token
from app.db.session import get_db
from app.messaging.kds_manager import kds_manager
from app.models.pedido import Pedido, StatusPedido
from app.models.usuario import PerfilUsuario
from app.schemas.pedido import PedidoRead

router = APIRouter()

_PERFIS_COZINHA = (PerfilUsuario.admin, PerfilUsuario.cozinha)


@router.get(
    "/api/v1/kds/fila",
    response_model=list[PedidoRead],
    dependencies=[Depends(requer_perfil(*_PERFIS_COZINHA))],
)
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
async def websocket_kds(websocket: WebSocket, token: str) -> None:
    # WebSocket nativo do navegador não envia cabeçalhos customizados, então
    # o token de acesso viaja via query string (?token=...) nesta conexão.
    try:
        payload = decodificar_access_token(token)
        if payload.get("perfil") not in (p.value for p in _PERFIS_COZINHA):
            await websocket.close(code=4403)
            return
    except JWTError:
        await websocket.close(code=4401)
        return

    await kds_manager.conectar(websocket)
    try:
        while True:
            # A tela da cozinha não precisa enviar nada; apenas mantemos a conexão viva.
            await websocket.receive_text()
    except WebSocketDisconnect:
        kds_manager.desconectar(websocket)
