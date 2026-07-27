import uuid
from decimal import Decimal

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_usuario, requer_perfil
from app.db.session import get_db
from app.messaging.kds_manager import kds_manager
from app.messaging.publisher import publicar_evento_pedido
from app.messaging.routing_keys import RoutingKeyPedido
from app.models.item_pedido import ItemPedido
from app.models.pedido import OrigemPedido, Pedido, StatusPedido, TipoEntrega
from app.models.usuario import PerfilUsuario, Usuario
from app.schemas.pedido import PedidoCreate, PedidoRead

router = APIRouter()

_GESTAO = (PerfilUsuario.admin, PerfilUsuario.funcionario_balcao)


async def _notificar_kds_novo_pedido(pedido_payload: dict) -> None:
    """RF011: empurra o pedido para a tela da cozinha assim que entra em preparo.

    Recebe o payload já serializado (não o objeto ORM): a task roda depois da
    resposta HTTP ser enviada, quando a sessão do banco já pode ter sido fechada.
    """
    await kds_manager.transmitir({"tipo": "pedido_em_preparo", "pedido": pedido_payload})


async def _notificar_kds_saida(pedido_id: uuid.UUID) -> None:
    """Remove o card da tela da cozinha quando o pedido sai da fila de preparo."""
    await kds_manager.transmitir({"tipo": "pedido_removido", "pedido_id": str(pedido_id)})


@router.get("", response_model=list[PedidoRead], dependencies=[Depends(requer_perfil(*_GESTAO))])
async def listar_pedidos(
    status_pedido: StatusPedido | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[Pedido]:
    query = select(Pedido).options(selectinload(Pedido.itens)).order_by(Pedido.criado_em.desc())
    if status_pedido is not None:
        query = query.where(Pedido.status == status_pedido)
    resultado = await db.execute(query)
    return list(resultado.scalars().all())


async def _carregar_pedido(pedido_id: uuid.UUID, db: AsyncSession) -> Pedido:
    resultado = await db.execute(
        select(Pedido).options(selectinload(Pedido.itens)).where(Pedido.id == pedido_id)
    )
    pedido = resultado.scalar_one_or_none()
    if pedido is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido não encontrado.")
    return pedido


@router.post("", response_model=PedidoRead, status_code=status.HTTP_201_CREATED)
async def criar_pedido(
    dados: PedidoCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
) -> Pedido:
    if dados.origem == OrigemPedido.balcao:
        if usuario.perfil not in _GESTAO:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Somente administradores ou balcão podem lançar vendas de balcão.",
            )
        usuario_id_pedido = None
    else:
        # RF004: um pedido online sempre pertence a quem está autenticado —
        # nunca confia em um usuario_id vindo do corpo da requisição.
        if usuario.perfil == PerfilUsuario.cliente and not usuario.email_verificado:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Confirme seu e-mail antes de finalizar pedidos.",
            )
        usuario_id_pedido = usuario.id

    valor_total = sum(
        (Decimal(str(item.preco_unitario_cobrado)) * item.quantidade for item in dados.itens),
        Decimal("0"),
    )

    # RF010: vendas de balcão pulam a aprovação manual e vão direto para a cozinha.
    status_inicial = (
        StatusPedido.em_preparo if dados.origem == OrigemPedido.balcao else StatusPedido.aguardando_aprovacao
    )

    pedido = Pedido(
        usuario_id=usuario_id_pedido,
        origem=dados.origem,
        tipo_entrega=dados.tipo_entrega,
        status=status_inicial,
        forma_pagamento=dados.forma_pagamento,
        endereco_entrega=dados.endereco_entrega,
        valor_total=valor_total,
    )
    pedido.itens = [
        ItemPedido(
            produto_id=item.produto_id,
            quantidade=item.quantidade,
            preco_unitario_cobrado=item.preco_unitario_cobrado,
            observacao=item.observacao,
        )
        for item in dados.itens
    ]

    db.add(pedido)
    await db.commit()

    if status_inicial == StatusPedido.em_preparo:
        background_tasks.add_task(
            publicar_evento_pedido,
            RoutingKeyPedido.EM_PREPARO,
            pedido.id,
            {"status": pedido.status.value, "origem": pedido.origem.value},
        )
        background_tasks.add_task(
            _notificar_kds_novo_pedido, PedidoRead.model_validate(pedido).model_dump(mode="json")
        )

    return pedido


@router.get("/{pedido_id}", response_model=PedidoRead)
async def obter_pedido(
    pedido_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
) -> Pedido:
    pedido = await _carregar_pedido(pedido_id, db)
    eh_dono = usuario.perfil == PerfilUsuario.cliente and pedido.usuario_id == usuario.id
    if usuario.perfil not in _GESTAO and not eh_dono:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para ver este pedido.",
        )
    return pedido


@router.post(
    "/{pedido_id}/aprovar",
    response_model=PedidoRead,
    dependencies=[Depends(requer_perfil(*_GESTAO))],
)
async def aprovar_pedido(
    pedido_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> Pedido:
    """RF009: o admin/balcão aceita o pedido no painel, que segue direto para a fila da cozinha."""
    pedido = await _carregar_pedido(pedido_id, db)
    if pedido.status != StatusPedido.aguardando_aprovacao:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Pedido não está aguardando aprovação.",
        )

    pedido.status = StatusPedido.em_preparo
    await db.commit()

    dados_evento = {"status": pedido.status.value}
    background_tasks.add_task(
        publicar_evento_pedido, RoutingKeyPedido.APROVADO, pedido.id, dados_evento
    )
    background_tasks.add_task(
        publicar_evento_pedido, RoutingKeyPedido.EM_PREPARO, pedido.id, dados_evento
    )
    background_tasks.add_task(
        _notificar_kds_novo_pedido, PedidoRead.model_validate(pedido).model_dump(mode="json")
    )
    return pedido


@router.post(
    "/{pedido_id}/cancelar",
    response_model=PedidoRead,
    dependencies=[Depends(requer_perfil(*_GESTAO))],
)
async def cancelar_pedido(
    pedido_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> Pedido:
    pedido = await _carregar_pedido(pedido_id, db)
    if pedido.status in (StatusPedido.finalizado, StatusPedido.cancelado):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Pedido já foi finalizado ou cancelado.",
        )

    estava_em_preparo = pedido.status == StatusPedido.em_preparo
    pedido.status = StatusPedido.cancelado
    await db.commit()

    if estava_em_preparo:
        background_tasks.add_task(_notificar_kds_saida, pedido.id)

    return pedido


@router.post(
    "/{pedido_id}/pronto",
    response_model=PedidoRead,
    dependencies=[Depends(requer_perfil(PerfilUsuario.admin, PerfilUsuario.cozinha))],
)
async def marcar_pronto(
    pedido_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> Pedido:
    """RF012: a cozinha conclui o preparo do pedido."""
    pedido = await _carregar_pedido(pedido_id, db)
    if pedido.status != StatusPedido.em_preparo:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Pedido não está em preparo."
        )

    pedido.status = (
        StatusPedido.pronto_entrega
        if pedido.tipo_entrega == TipoEntrega.delivery
        else StatusPedido.pronto_retirada
    )
    await db.commit()

    background_tasks.add_task(
        publicar_evento_pedido, RoutingKeyPedido.PRONTO, pedido.id, {"status": pedido.status.value}
    )
    background_tasks.add_task(_notificar_kds_saida, pedido.id)
    return pedido


@router.post(
    "/{pedido_id}/saiu-para-entrega",
    response_model=PedidoRead,
    dependencies=[Depends(requer_perfil(*_GESTAO))],
)
async def marcar_saiu_para_entrega(
    pedido_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> Pedido:
    """Disparado quando o motoboy coleta o pedido para delivery."""
    pedido = await _carregar_pedido(pedido_id, db)
    if pedido.tipo_entrega != TipoEntrega.delivery:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Somente pedidos de delivery saem para entrega.",
        )
    if pedido.status != StatusPedido.pronto_entrega:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Pedido ainda não está pronto para entrega.",
        )

    background_tasks.add_task(
        publicar_evento_pedido,
        RoutingKeyPedido.SAIU_ENTREGA,
        pedido.id,
        {"status": pedido.status.value},
    )
    return pedido


@router.post(
    "/{pedido_id}/finalizar",
    response_model=PedidoRead,
    dependencies=[Depends(requer_perfil(*_GESTAO))],
)
async def finalizar_pedido(pedido_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Pedido:
    pedido = await _carregar_pedido(pedido_id, db)
    if pedido.status not in (StatusPedido.pronto_entrega, StatusPedido.pronto_retirada):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Pedido ainda não está pronto."
        )

    pedido.status = StatusPedido.finalizado
    await db.commit()
    return pedido
