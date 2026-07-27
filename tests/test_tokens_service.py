from app.models.usuario_token import TipoTokenUsuario
from app.services.tokens import consumir_token, criar_token
from tests import factories


async def test_criar_token_gera_token_com_expiracao_correta(db_session):
    usuario = await factories.criar_usuario(db_session)

    token = await criar_token(db_session, usuario.id, TipoTokenUsuario.verificacao_email, 60)

    assert token.usuario_id == usuario.id
    assert token.tipo == TipoTokenUsuario.verificacao_email
    assert token.usado_em is None
    assert len(token.token) > 20


async def test_criar_token_invalida_tokens_anteriores_do_mesmo_tipo(db_session):
    usuario = await factories.criar_usuario(db_session)

    primeiro = await criar_token(db_session, usuario.id, TipoTokenUsuario.verificacao_email, 60)
    segundo = await criar_token(db_session, usuario.id, TipoTokenUsuario.verificacao_email, 60)

    await db_session.refresh(primeiro)
    assert primeiro.usado_em is not None
    assert segundo.usado_em is None
    assert primeiro.token != segundo.token


async def test_consumir_token_valido_marca_como_usado_e_retorna(db_session):
    usuario = await factories.criar_usuario(db_session)
    token = await criar_token(db_session, usuario.id, TipoTokenUsuario.verificacao_email, 60)

    resultado = await consumir_token(db_session, token.token, TipoTokenUsuario.verificacao_email)

    assert resultado is not None
    assert resultado.id == token.id
    assert resultado.usado_em is not None


async def test_consumir_token_ja_usado_retorna_none(db_session):
    usuario = await factories.criar_usuario(db_session)
    token = await criar_token(db_session, usuario.id, TipoTokenUsuario.verificacao_email, 60)

    primeira_vez = await consumir_token(db_session, token.token, TipoTokenUsuario.verificacao_email)
    segunda_vez = await consumir_token(db_session, token.token, TipoTokenUsuario.verificacao_email)

    assert primeira_vez is not None
    assert segunda_vez is None


async def test_consumir_token_inexistente_retorna_none(db_session):
    resultado = await consumir_token(db_session, "token-que-nao-existe", TipoTokenUsuario.verificacao_email)
    assert resultado is None


async def test_consumir_token_expirado_retorna_none(db_session):
    usuario = await factories.criar_usuario(db_session)
    # expira_em_minutos negativo já nasce no passado.
    token = await criar_token(db_session, usuario.id, TipoTokenUsuario.verificacao_email, -1)

    resultado = await consumir_token(db_session, token.token, TipoTokenUsuario.verificacao_email)
    assert resultado is None


async def test_consumir_token_com_tipo_errado_retorna_none(db_session):
    usuario = await factories.criar_usuario(db_session)
    token = await criar_token(db_session, usuario.id, TipoTokenUsuario.verificacao_email, 60)

    resultado = await consumir_token(db_session, token.token, TipoTokenUsuario.redefinicao_senha)
    assert resultado is None
