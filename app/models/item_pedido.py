import uuid

from sqlalchemy import ForeignKey, Integer, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ItemPedido(Base):
    __tablename__ = "itens_pedido"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    pedido_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pedidos.id"), nullable=False
    )
    produto_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False)
    preco_unitario_cobrado: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)

    pedido: Mapped["Pedido"] = relationship(back_populates="itens")
