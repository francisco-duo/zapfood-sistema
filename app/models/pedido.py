import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ENUM as PgEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OrigemPedido(str, Enum):
    online = "online"
    balcao = "balcao"


class TipoEntrega(str, Enum):
    delivery = "delivery"
    retirada = "retirada"
    consumo_local = "consumo_local"


class StatusPedido(str, Enum):
    aguardando_aprovacao = "aguardando_aprovacao"
    em_preparo = "em_preparo"
    pronto_entrega = "pronto_entrega"
    pronto_retirada = "pronto_retirada"
    finalizado = "finalizado"
    cancelado = "cancelado"


class Pedido(Base):
    __tablename__ = "pedidos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True, index=True
    )
    origem: Mapped[OrigemPedido] = mapped_column(
        PgEnum(OrigemPedido, name="origem_pedido_enum"), nullable=False
    )
    tipo_entrega: Mapped[TipoEntrega] = mapped_column(
        PgEnum(TipoEntrega, name="tipo_entrega_enum"), nullable=False
    )
    status: Mapped[StatusPedido] = mapped_column(
        PgEnum(StatusPedido, name="status_pedido_enum"),
        nullable=False,
        default=StatusPedido.aguardando_aprovacao,
        index=True,
    )
    forma_pagamento: Mapped[str] = mapped_column(String(50), nullable=False)
    endereco_entrega: Mapped[str | None] = mapped_column(Text, nullable=True)
    valor_total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    # Toda listagem de pedidos ordena por este campo (fila de gestão, KDS, PDV).
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True
    )

    usuario: Mapped["Usuario"] = relationship(back_populates="pedidos")
    itens: Mapped[list["ItemPedido"]] = relationship(
        back_populates="pedido", cascade="all, delete-orphan"
    )
