import uuid

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Produto(Base):
    __tablename__ = "produtos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    categoria_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categorias.id"), nullable=False
    )
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    descricao: Mapped[str] = mapped_column(Text, nullable=False)
    preco: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    preco_promocional: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    imagem_url: Mapped[str] = mapped_column(String(500), nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    categoria: Mapped["Categoria"] = relationship(back_populates="produtos")
