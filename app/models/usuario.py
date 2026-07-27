import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import ENUM as PgEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PerfilUsuario(str, Enum):
    cliente = "cliente"
    admin = "admin"
    funcionario_balcao = "funcionario_balcao"
    cozinha = "cozinha"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    telefone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    perfil: Mapped[PerfilUsuario] = mapped_column(
        PgEnum(PerfilUsuario, name="perfil_usuario_enum"), nullable=False
    )
    # Contas de staff (criadas pelo admin) e contas já existentes antes desta
    # coluna nascem verificadas; só o autocadastro público de cliente exige
    # confirmação de e-mail explícita (RF004 + verificação via Resend).
    email_verificado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    pedidos: Mapped[list["Pedido"]] = relationship(back_populates="usuario")
    tokens: Mapped[list["UsuarioToken"]] = relationship(back_populates="usuario", cascade="all, delete-orphan")
