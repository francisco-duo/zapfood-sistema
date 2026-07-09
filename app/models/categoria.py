import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Categoria(Base):
    __tablename__ = "categorias"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    ativa: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    produtos: Mapped[list["Produto"]] = relationship(back_populates="categoria")
