import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# RNF002: hashing unidirecional com Argon2id (via passlib/argon2-cffi).
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def _aplicar_pepper(senha_plana: str) -> str:
    """Pré-hash da senha com HMAC-SHA256 usando um pepper mantido só em env.

    O pepper nunca é persistido no banco (diferente do salt, que o Argon2
    já embute no próprio hash) — mesmo um dump completo do banco não é
    suficiente para atacar as senhas offline sem also vazar o pepper.
    """
    return hmac.new(
        settings.PEPPER_SENHA.encode("utf-8"), senha_plana.encode("utf-8"), hashlib.sha256
    ).hexdigest()


def hash_senha(senha_plana: str) -> str:
    return pwd_context.hash(_aplicar_pepper(senha_plana))


def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    return pwd_context.verify(_aplicar_pepper(senha_plana), senha_hash)


def criar_access_token(*, usuario_id: str, perfil: str) -> str:
    agora = datetime.now(timezone.utc)
    payload = {
        "sub": usuario_id,
        "perfil": perfil,
        "iat": agora,
        "exp": agora + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decodificar_access_token(token: str) -> dict[str, Any]:
    """Levanta jose.JWTError se o token for inválido, expirado ou adulterado."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


__all__ = [
    "hash_senha",
    "verificar_senha",
    "criar_access_token",
    "decodificar_access_token",
    "JWTError",
]
