from sqlalchemy import select

from app.models.usuario_token import TipoTokenUsuario, UsuarioToken
from app.services.tokens import criar_token
from tests import factories
from tests.conftest import auth_headers

PREFIXO = "/api/v1/auth"


async def _token_de(db_session, usuario_id, tipo: TipoTokenUsuario) -> UsuarioToken:
    resultado = await db_session.execute(
        select(UsuarioToken)
        .where(UsuarioToken.usuario_id == usuario_id, UsuarioToken.tipo == tipo)
        .order_by(UsuarioToken.criado_em.desc())
    )
    return resultado.scalars().first()


# --- registrar ---------------------------------------------------------


async def test_registrar_cliente_cria_conta_nao_verificada(client, db_session):
    resposta = await client.post(
        f"{PREFIXO}/registrar",
        json={"nome": "Ana Souza", "email": "ana@example.com", "senha": "senha12345"},
    )

    assert resposta.status_code == 201
    corpo = resposta.json()
    assert corpo["usuario"]["email"] == "ana@example.com"
    assert corpo["usuario"]["perfil"] == "cliente"
    assert corpo["usuario"]["email_verificado"] is False
    assert "access_token" in corpo


async def test_registrar_cliente_gera_token_de_verificacao(client, db_session):
    resposta = await client.post(
        f"{PREFIXO}/registrar",
        json={"nome": "Ana Souza", "email": "ana2@example.com", "senha": "senha12345"},
    )
    usuario_id = resposta.json()["usuario"]["id"]

    token = await _token_de(db_session, usuario_id, TipoTokenUsuario.verificacao_email)
    assert token is not None
    assert token.usado_em is None


async def test_registrar_cliente_com_email_duplicado_retorna_409(client, db_session):
    await factories.criar_usuario(db_session, email="duplicado@example.com")

    resposta = await client.post(
        f"{PREFIXO}/registrar",
        json={"nome": "Outro", "email": "duplicado@example.com", "senha": "senha12345"},
    )

    assert resposta.status_code == 409


async def test_registrar_cliente_com_senha_curta_retorna_422(client):
    resposta = await client.post(
        f"{PREFIXO}/registrar",
        json={"nome": "Ana", "email": "curta@example.com", "senha": "123"},
    )
    assert resposta.status_code == 422


# --- login ---------------------------------------------------------


async def test_login_com_credenciais_validas(client, db_session):
    await factories.criar_usuario(db_session, email="login@example.com", senha="senhaCerta1")

    resposta = await client.post(
        f"{PREFIXO}/login", json={"email": "login@example.com", "senha": "senhaCerta1"}
    )

    assert resposta.status_code == 200
    assert "access_token" in resposta.json()


async def test_login_com_senha_errada_retorna_401(client, db_session):
    await factories.criar_usuario(db_session, email="login2@example.com", senha="senhaCerta1")

    resposta = await client.post(
        f"{PREFIXO}/login", json={"email": "login2@example.com", "senha": "senhaErrada"}
    )
    assert resposta.status_code == 401


async def test_login_com_email_inexistente_retorna_401(client):
    resposta = await client.post(
        f"{PREFIXO}/login", json={"email": "nao-existe@example.com", "senha": "qualquer123"}
    )
    assert resposta.status_code == 401


# --- me ---------------------------------------------------------


async def test_me_com_token_valido_retorna_usuario_autenticado(client, usuario_cliente):
    resposta = await client.get(f"{PREFIXO}/me", headers=auth_headers(usuario_cliente))
    assert resposta.status_code == 200
    assert resposta.json()["email"] == usuario_cliente.email


async def test_me_sem_token_retorna_403(client):
    # HTTPBearer(auto_error=True) do FastAPI responde 403 quando o header
    # Authorization nem chega a existir (o 401 da app é só pra token presente
    # mas inválido/expirado — ver test_me_com_token_invalido_retorna_401).
    resposta = await client.get(f"{PREFIXO}/me")
    assert resposta.status_code == 403


async def test_me_com_token_invalido_retorna_401(client):
    resposta = await client.get(
        f"{PREFIXO}/me", headers={"Authorization": "Bearer token-invalido"}
    )
    assert resposta.status_code == 401


# --- verificar-email ---------------------------------------------------------


async def test_verificar_email_com_token_valido_ativa_a_conta(
    client, db_session, usuario_cliente_nao_verificado
):
    token = await criar_token(
        db_session, usuario_cliente_nao_verificado.id, TipoTokenUsuario.verificacao_email, 60
    )

    resposta = await client.post(f"{PREFIXO}/verificar-email", json={"token": token.token})

    assert resposta.status_code == 200
    await db_session.refresh(usuario_cliente_nao_verificado)
    assert usuario_cliente_nao_verificado.email_verificado is True


async def test_verificar_email_com_token_invalido_retorna_400(client):
    resposta = await client.post(f"{PREFIXO}/verificar-email", json={"token": "token-invalido"})
    assert resposta.status_code == 400


async def test_verificar_email_com_token_ja_usado_retorna_400(
    client, db_session, usuario_cliente_nao_verificado
):
    token = await criar_token(
        db_session, usuario_cliente_nao_verificado.id, TipoTokenUsuario.verificacao_email, 60
    )
    await client.post(f"{PREFIXO}/verificar-email", json={"token": token.token})

    resposta = await client.post(f"{PREFIXO}/verificar-email", json={"token": token.token})
    assert resposta.status_code == 400


# --- reenviar-verificacao ---------------------------------------------------------


async def test_reenviar_verificacao_para_usuario_nao_verificado_gera_novo_token(
    client, db_session, usuario_cliente_nao_verificado
):
    token_antigo = await criar_token(
        db_session, usuario_cliente_nao_verificado.id, TipoTokenUsuario.verificacao_email, 60
    )

    resposta = await client.post(
        f"{PREFIXO}/reenviar-verificacao", headers=auth_headers(usuario_cliente_nao_verificado)
    )

    assert resposta.status_code == 200
    await db_session.refresh(token_antigo)
    assert token_antigo.usado_em is not None  # invalidado pelo criar_token do reenvio


async def test_reenviar_verificacao_para_usuario_ja_verificado_nao_cria_token(
    client, db_session, usuario_cliente
):
    resposta = await client.post(
        f"{PREFIXO}/reenviar-verificacao", headers=auth_headers(usuario_cliente)
    )

    assert resposta.status_code == 200
    assert "já está confirmado" in resposta.json()["mensagem"]
    token = await _token_de(db_session, usuario_cliente.id, TipoTokenUsuario.verificacao_email)
    assert token is None


# --- esqueci-senha / redefinir-senha ---------------------------------------------------------


async def test_esqueci_senha_com_email_cadastrado_cria_token(client, db_session, usuario_cliente):
    resposta = await client.post(f"{PREFIXO}/esqueci-senha", json={"email": usuario_cliente.email})

    assert resposta.status_code == 200
    token = await _token_de(db_session, usuario_cliente.id, TipoTokenUsuario.redefinicao_senha)
    assert token is not None


async def test_esqueci_senha_com_email_nao_cadastrado_retorna_404(client):
    resposta = await client.post(
        f"{PREFIXO}/esqueci-senha", json={"email": "fantasma@example.com"}
    )
    assert resposta.status_code == 404


async def test_redefinir_senha_com_token_valido_troca_a_senha_e_permite_login(
    client, db_session, usuario_cliente
):
    token = await criar_token(
        db_session, usuario_cliente.id, TipoTokenUsuario.redefinicao_senha, 60
    )

    resposta = await client.post(
        f"{PREFIXO}/redefinir-senha", json={"token": token.token, "senha_nova": "novaSenha999"}
    )
    assert resposta.status_code == 200

    login = await client.post(
        f"{PREFIXO}/login", json={"email": usuario_cliente.email, "senha": "novaSenha999"}
    )
    assert login.status_code == 200


async def test_redefinir_senha_com_token_invalido_retorna_400(client):
    resposta = await client.post(
        f"{PREFIXO}/redefinir-senha", json={"token": "invalido", "senha_nova": "novaSenha999"}
    )
    assert resposta.status_code == 400


async def test_redefinir_senha_com_senha_curta_retorna_422(client, db_session, usuario_cliente):
    token = await criar_token(
        db_session, usuario_cliente.id, TipoTokenUsuario.redefinicao_senha, 60
    )
    resposta = await client.post(
        f"{PREFIXO}/redefinir-senha", json={"token": token.token, "senha_nova": "123"}
    )
    assert resposta.status_code == 422


# --- usuarios (gestão, admin only) ---------------------------------------------------------


async def test_listar_usuarios_como_admin(client, db_session, usuario_admin):
    await factories.criar_usuario(db_session)
    resposta = await client.get(f"{PREFIXO}/usuarios", headers=auth_headers(usuario_admin))
    assert resposta.status_code == 200
    assert len(resposta.json()) >= 2


async def test_listar_usuarios_como_cliente_retorna_403(client, usuario_cliente):
    resposta = await client.get(f"{PREFIXO}/usuarios", headers=auth_headers(usuario_cliente))
    assert resposta.status_code == 403


async def test_criar_usuario_staff_como_admin(client, usuario_admin):
    resposta = await client.post(
        f"{PREFIXO}/usuarios",
        headers=auth_headers(usuario_admin),
        json={
            "nome": "Funcionário Balcão",
            "email": "balcao.novo@example.com",
            "senha": "senha12345",
            "perfil": "funcionario_balcao",
        },
    )
    assert resposta.status_code == 201
    assert resposta.json()["perfil"] == "funcionario_balcao"


async def test_criar_usuario_staff_com_email_duplicado_retorna_409(
    client, db_session, usuario_admin
):
    existente = await factories.criar_usuario(db_session)
    resposta = await client.post(
        f"{PREFIXO}/usuarios",
        headers=auth_headers(usuario_admin),
        json={
            "nome": "Outro",
            "email": existente.email,
            "senha": "senha12345",
            "perfil": "cozinha",
        },
    )
    assert resposta.status_code == 409


async def test_criar_usuario_staff_como_cliente_retorna_403(client, usuario_cliente):
    resposta = await client.post(
        f"{PREFIXO}/usuarios",
        headers=auth_headers(usuario_cliente),
        json={
            "nome": "Outro",
            "email": "novo@example.com",
            "senha": "senha12345",
            "perfil": "cozinha",
        },
    )
    assert resposta.status_code == 403
