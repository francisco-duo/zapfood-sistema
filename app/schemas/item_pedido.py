import uuid

from pydantic import BaseModel, ConfigDict, Field


class ItemPedidoBase(BaseModel):
    produto_id: uuid.UUID
    quantidade: int = Field(gt=0)
    preco_unitario_cobrado: float = Field(ge=0)
    observacao: str | None = None


class ItemPedidoCreate(ItemPedidoBase):
    pass


class ItemPedidoRead(ItemPedidoBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    pedido_id: uuid.UUID
