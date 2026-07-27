import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.usuario_token import TipoTokenUsuario, UsuarioToken


async def criar_token(
    db: AsyncSession, usuario_id: uuid.UUID, tipo: TipoTokenUsuario, expira_em_minutos: int
) -> UsuarioToken:
    """Invalida quaisquer tokens do mesmo tipo ainda válidos antes de emitir um novo.

    Assim, só o link mais recente enviado por e-mail funciona — pedir a
    redefinição de senha duas vezes não deixa o link antigo utilizável.
    """
    tokens_antigos = (
        await db.execute(
            select(UsuarioToken).where(
                UsuarioToken.usuario_id == usuario_id,
                UsuarioToken.tipo == tipo,
                UsuarioToken.usado_em.is_(None),
            )
        )
    ).scalars().all()
    agora = datetime.now(timezone.utc)
    for antigo in tokens_antigos:
        antigo.usado_em = agora

    novo = UsuarioToken(
        usuario_id=usuario_id,
        tipo=tipo,
        token=secrets.token_urlsafe(32),
        expira_em=agora + timedelta(minutes=expira_em_minutos),
    )
    db.add(novo)
    await db.commit()
    await db.refresh(novo)
    return novo


async def consumir_token(
    db: AsyncSession, token_str: str, tipo: TipoTokenUsuario
) -> UsuarioToken | None:
    """Retorna o token se válido (existe, não usado, não expirado) e já o marca como usado."""
    token = (
        await db.execute(
            select(UsuarioToken).where(UsuarioToken.token == token_str, UsuarioToken.tipo == tipo)
        )
    ).scalar_one_or_none()

    if token is None or token.usado_em is not None:
        return None
    if token.expira_em < datetime.now(timezone.utc):
        return None

    token.usado_em = datetime.now(timezone.utc)
    await db.commit()
    return token
