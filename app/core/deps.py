import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import JWTError, decodificar_access_token
from app.db.session import get_db
from app.models.usuario import PerfilUsuario, Usuario

_security_scheme = HTTPBearer(auto_error=True)

_CREDENCIAIS_INVALIDAS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Credenciais inválidas ou expiradas.",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_usuario(
    credenciais: HTTPAuthorizationCredentials = Depends(_security_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    try:
        payload = decodificar_access_token(credenciais.credentials)
        usuario_id = payload.get("sub")
        if usuario_id is None:
            raise _CREDENCIAIS_INVALIDAS
    except JWTError:
        raise _CREDENCIAIS_INVALIDAS

    usuario = await db.get(Usuario, uuid.UUID(usuario_id))
    if usuario is None:
        raise _CREDENCIAIS_INVALIDAS
    return usuario


def requer_perfil(*perfis_permitidos: PerfilUsuario):
    """Factory de dependência para RBAC: só libera a rota para os perfis informados."""

    async def _checagem(usuario: Usuario = Depends(get_current_usuario)) -> Usuario:
        if usuario.perfil not in perfis_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para executar esta ação.",
            )
        return usuario

    return _checagem
