from jose import jwt as jose_jwt

from app.core.config import settings
from tests.conftest import auth_headers

PREFIXO = "/api/v1/auth"


async def test_me_com_token_sem_sub_retorna_401(client):
    token_sem_sub = jose_jwt.encode({"perfil": "cliente"}, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    resposta = await client.get(f"{PREFIXO}/me", headers={"Authorization": f"Bearer {token_sem_sub}"})
    assert resposta.status_code == 401


async def test_me_com_usuario_inexistente_retorna_401(client, usuario_cliente, db_session):
    headers = auth_headers(usuario_cliente)
    await db_session.delete(usuario_cliente)
    await db_session.commit()

    resposta = await client.get(f"{PREFIXO}/me", headers=headers)
    assert resposta.status_code == 401
