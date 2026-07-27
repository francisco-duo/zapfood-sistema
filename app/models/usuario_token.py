import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import ENUM as PgEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TipoTokenUsuario(str, Enum):
    verificacao_email = "verificacao_email"
    redefinicao_senha = "redefinicao_senha"


class UsuarioToken(Base):
    """Token opaco e de uso único para fluxos sensíveis por e-mail.

    Deliberadamente não é um JWT: precisa poder ser invalidado (usado ou
    substituído por um mais novo) antes do prazo de expiração, o que um JWT
    autocontido não permite sem uma blocklist à parte.
    """

    __tablename__ = "usuario_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False, index=True
    )
    tipo: Mapped[TipoTokenUsuario] = mapped_column(
        PgEnum(TipoTokenUsuario, name="tipo_token_usuario_enum"), nullable=False
    )
    token: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    expira_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    usado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    usuario: Mapped["Usuario"] = relationship(back_populates="tokens")
