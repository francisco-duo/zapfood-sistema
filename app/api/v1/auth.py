from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_usuario, requer_perfil
from app.core.security import criar_access_token, hash_senha, verificar_senha
from app.db.session import get_db
from app.models.usuario import PerfilUsuario, Usuario
from app.schemas.auth import LoginRequest, RegistroClienteRequest, TokenResponse
from app.schemas.usuario import UsuarioCreate, UsuarioRead

router = APIRouter()


def _gerar_token_resposta(usuario: Usuario) -> TokenResponse:
    token = criar_access_token(usuario_id=str(usuario.id), perfil=usuario.perfil.value)
    return TokenResponse(access_token=token, usuario=UsuarioRead.model_validate(usuario))


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
    dados: RegistroClienteRequest, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    """Cadastro público do Portal do Cliente — perfil sempre 'cliente' (RF004)."""
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
    )
    db.add(usuario)
    await db.commit()

    return _gerar_token_resposta(usuario)


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
