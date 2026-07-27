from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_usuario, requer_perfil
from app.core.security import criar_access_token, hash_senha, verificar_senha
from app.db.session import get_db
from app.models.usuario import PerfilUsuario, Usuario
from app.models.usuario_token import TipoTokenUsuario
from app.schemas.auth import (
    EsqueciSenhaRequest,
    LoginRequest,
    MensagemResponse,
    RedefinirSenhaRequest,
    RegistroClienteRequest,
    TokenResponse,
    VerificarEmailRequest,
)
from app.schemas.usuario import UsuarioCreate, UsuarioRead
from app.services.email_service import enviar_email
from app.services.email_templates import template_redefinicao_senha, template_verificacao_email
from app.services.tokens import consumir_token, criar_token

router = APIRouter()

# Mensagem genérica para não revelar se o token era inválido, expirado ou já usado.
_TOKEN_INVALIDO_DETALHE = "Este link é inválido ou já expirou. Solicite um novo."


def _base_url_frontend(request: Request) -> str:
    """A origem do fetch (enviada automaticamente pelo navegador em requisições
    cross-origin) diz de qual dos 3 apps veio o pedido — sem isso, o link do
    e-mail sempre apontaria para uma URL fixa, errada para os outros apps."""
    return request.headers.get("origin") or settings.FRONTEND_URL_FALLBACK


def _gerar_token_resposta(usuario: Usuario) -> TokenResponse:
    token = criar_access_token(usuario_id=str(usuario.id), perfil=usuario.perfil.value)
    return TokenResponse(access_token=token, usuario=UsuarioRead.model_validate(usuario))


async def _enviar_email_verificacao(
    db: AsyncSession, usuario: Usuario, background_tasks: BackgroundTasks, base_url: str
) -> None:
    token = await criar_token(
        db, usuario.id, TipoTokenUsuario.verificacao_email, settings.EMAIL_VERIFICATION_EXPIRE_MINUTES
    )
    link = f"{base_url}/verificar-email?token={token.token}"
    background_tasks.add_task(
        enviar_email,
        usuario.email,
        "Confirme seu e-mail — zapFood",
        template_verificacao_email(usuario.nome, link),
    )


@router.post("/login", response_model=TokenResponse)
async def login(dados: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    resultado = await db.execute(select(Usuario).where(Usuario.email == dados.email))
    usuario = resultado.scalar_one_or_none()

    if usuario is None or not verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha inválidos."
        )

    return _gerar_token_resposta(usuario)


@router.post("/registrar", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def registrar_cliente(
    dados: RegistroClienteRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Cadastro público do Portal do Cliente — perfil sempre 'cliente' (RF004).

    A conta nasce com email_verificado=False; o frontend bloqueia o acesso ao
    app até a confirmação chegar (link enviado por e-mail via Resend).
    """
    ja_existe = (
        await db.execute(select(Usuario).where(Usuario.email == dados.email))
    ).scalar_one_or_none()
    if ja_existe is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Este e-mail já está cadastrado."
        )

    usuario = Usuario(
        nome=dados.nome,
        email=dados.email,
        telefone=dados.telefone,
        perfil=PerfilUsuario.cliente,
        senha_hash=hash_senha(dados.senha),
        email_verificado=False,
    )
    db.add(usuario)
    await db.commit()

    await _enviar_email_verificacao(db, usuario, background_tasks, _base_url_frontend(request))

    return _gerar_token_resposta(usuario)


@router.post("/verificar-email", response_model=MensagemResponse)
async def verificar_email(
    dados: VerificarEmailRequest, db: AsyncSession = Depends(get_db)
) -> MensagemResponse:
    token = await consumir_token(db, dados.token, TipoTokenUsuario.verificacao_email)
    if token is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=_TOKEN_INVALIDO_DETALHE)

    usuario = await db.get(Usuario, token.usuario_id)
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=_TOKEN_INVALIDO_DETALHE)

    usuario.email_verificado = True
    await db.commit()
    return MensagemResponse(mensagem="E-mail confirmado com sucesso!")


@router.post("/reenviar-verificacao", response_model=MensagemResponse)
async def reenviar_verificacao(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    usuario: Usuario = Depends(get_current_usuario),
) -> MensagemResponse:
    if usuario.email_verificado:
        return MensagemResponse(mensagem="Este e-mail já está confirmado.")

    await _enviar_email_verificacao(db, usuario, background_tasks, _base_url_frontend(request))
    return MensagemResponse(mensagem="E-mail de confirmação reenviado.")


@router.post("/esqueci-senha", response_model=MensagemResponse)
async def esqueci_senha(
    dados: EsqueciSenhaRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> MensagemResponse:
    usuario = (
        await db.execute(select(Usuario).where(Usuario.email == dados.email))
    ).scalar_one_or_none()
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Este e-mail ainda não foi cadastrado.",
        )

    token = await criar_token(
        db, usuario.id, TipoTokenUsuario.redefinicao_senha, settings.PASSWORD_RESET_EXPIRE_MINUTES
    )
    link = f"{_base_url_frontend(request)}/redefinir-senha?token={token.token}"
    background_tasks.add_task(
        enviar_email,
        usuario.email,
        "Redefinir sua senha — zapFood",
        template_redefinicao_senha(usuario.nome, link),
    )
    return MensagemResponse(mensagem="Enviamos um e-mail com as instruções para redefinir sua senha.")


@router.post("/redefinir-senha", response_model=MensagemResponse)
async def redefinir_senha(
    dados: RedefinirSenhaRequest, db: AsyncSession = Depends(get_db)
) -> MensagemResponse:
    token = await consumir_token(db, dados.token, TipoTokenUsuario.redefinicao_senha)
    if token is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=_TOKEN_INVALIDO_DETALHE)

    usuario = await db.get(Usuario, token.usuario_id)
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=_TOKEN_INVALIDO_DETALHE)

    usuario.senha_hash = hash_senha(dados.senha_nova)
    await db.commit()
    return MensagemResponse(mensagem="Senha redefinida com sucesso. Você já pode entrar.")


@router.get("/me", response_model=UsuarioRead)
async def obter_usuario_atual(usuario: Usuario = Depends(get_current_usuario)) -> Usuario:
    return usuario


@router.get(
    "/usuarios",
    response_model=list[UsuarioRead],
    dependencies=[Depends(requer_perfil(PerfilUsuario.admin))],
)
async def listar_usuarios(db: AsyncSession = Depends(get_db)) -> list[Usuario]:
    resultado = await db.execute(select(Usuario).order_by(Usuario.criado_em.desc()))
    return list(resultado.scalars().all())


@router.post(
    "/usuarios",
    response_model=UsuarioRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requer_perfil(PerfilUsuario.admin))],
)
async def criar_usuario_staff(dados: UsuarioCreate, db: AsyncSession = Depends(get_db)) -> Usuario:
    """RF: administrador cria contas de staff (balcão, cozinha ou outro admin)."""
    ja_existe = (
        await db.execute(select(Usuario).where(Usuario.email == dados.email))
    ).scalar_one_or_none()
    if ja_existe is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Este e-mail já está cadastrado."
        )

    usuario = Usuario(
        nome=dados.nome,
        email=dados.email,
        telefone=dados.telefone,
        perfil=dados.perfil,
        senha_hash=hash_senha(dados.senha),
    )
    db.add(usuario)
    await db.commit()
    return usuario
