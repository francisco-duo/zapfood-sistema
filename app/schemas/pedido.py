import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.pedido import OrigemPedido, StatusPedido, TipoEntrega
from app.schemas.item_pedido import ItemPedidoCreate, ItemPedidoRead


class PedidoBase(BaseModel):
    origem: OrigemPedido
    tipo_entrega: TipoEntrega
    forma_pagamento: str = Field(max_length=50)
    endereco_entrega: str | None = None


class PedidoCreate(PedidoBase):
    usuario_id: uuid.UUID | None = None
    itens: list[ItemPedidoCreate] = Field(min_length=1)


class PedidoUpdateStatus(BaseModel):
    status: StatusPedido


class PedidoRead(PedidoBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    usuario_id: uuid.UUID | None
    status: StatusPedido
    valor_total: float
    criado_em: datetime
    itens: list[ItemPedidoRead] = []
