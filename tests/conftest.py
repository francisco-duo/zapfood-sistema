import os

# Precisa vir ANTES de qualquer "import app.*": Settings() é montado uma vez,
# no import do módulo, e lê essas variáveis de ambiente naquele instante.
# Os defaults abaixo apontam pro Postgres/Redis/RabbitMQ do docker-compose.yml
# de desenvolvimento (localhost, mesmas portas publicadas) — em CI, o
# workflow exporta as suas próprias URLs antes de rodar o pytest, então
# setdefault não sobrescreve nada lá.
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://zapfood:zapfood_dev_password@localhost:5433/zapfood_test",
)
os.environ.setdefault(
    "SYNC_DATABASE_URL",
    "postgresql+psycopg2://zapfood:zapfood_dev_password@localhost:5433/zapfood_test",
)
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/1")
os.environ.setdefault("RABBITMQ_URL", "amqp://zapfood:zapfood_dev_password@localhost:5673/")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("PEPPER_SENHA", "test-pepper-not-for-production")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("RESEND_API_KEY", "")

import psycopg2  # noqa: E402
import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from asgi_lifespan import LifespanManager  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.engine import make_url  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import NullPool  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.security import criar_access_token  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import engine as db_engine_global  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.usuario import PerfilUsuario, Usuario  # noqa: E402

from tests import factories  # noqa: E402


@pytest_asyncio.fixture(autouse=True)
async def _descartar_pool_do_engine_global_de_producao():
    """app.db.session.engine é o singleton usado pelo app de verdade (fora
    de testes, roda a vida inteira no mesmo event loop — correto lá). Aqui
    cada teste tem seu próprio loop, então qualquer teste que use esse
    engine global direto (ex.: get_db(), verificar_banco()) precisa de um
    pool "fresco", ou o asyncpg quebra tentando reusar uma conexão presa ao
    loop (já fechado) de um teste anterior."""
    yield
    await db_engine_global.dispose()


@pytest.fixture(scope="session", autouse=True)
def _preparar_schema_de_teste():
    """Cria o banco de teste (se preciso) e a schema, tudo síncrono — sem
    asyncio aqui, então nenhum recurso fica preso ao event loop de um teste
    específico. Roda uma única vez pra sessão inteira."""
    url = make_url(settings.SYNC_DATABASE_URL)

    conexao_admin = psycopg2.connect(
        user=url.username, password=url.password, host=url.host, port=url.port or 5432, dbname="postgres"
    )
    conexao_admin.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    try:
        with conexao_admin.cursor() as cursor:
            cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (url.database,))
            if cursor.fetchone() is None:
                cursor.execute(f'CREATE DATABASE "{url.database}"')
    finally:
        conexao_admin.close()

    engine_sincrono = create_engine(settings.SYNC_DATABASE_URL)
    Base.metadata.drop_all(engine_sincrono)
    Base.metadata.create_all(engine_sincrono)
    engine_sincrono.dispose()


@pytest_asyncio.fixture
async def db_session():
    """Motor async novo por teste (barato com NullPool) — evita qualquer
    recurso asyncio atravessando o event loop de um teste pro outro, que é
    a causa mais comum de "Future attached to a different loop" com asyncpg.
    A transação é sempre revertida no final: isolamento total entre testes."""
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
    connection = await engine.connect()
    transaction = await connection.begin()
    session_factory = async_sessionmaker(
        bind=connection,
        expire_on_commit=False,
        autoflush=False,
        join_transaction_mode="create_savepoint",
    )
    session = session_factory()
    try:
        yield session
    finally:
        await session.close()
        await transaction.rollback()
        await connection.close()
        await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session):
    """Cliente HTTP assíncrono contra a app real (lifespan incluso), com o
    get_db trocado pela sessão transacional do teste."""

    async def _sobrescrever_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _sobrescrever_get_db
    async with LifespanManager(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
    app.dependency_overrides.pop(get_db, None)


def auth_headers(usuario: Usuario) -> dict[str, str]:
    token = criar_access_token(usuario_id=str(usuario.id), perfil=usuario.perfil.value)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def usuario_cliente(db_session) -> Usuario:
    return await factories.criar_usuario(db_session, perfil=PerfilUsuario.cliente)


@pytest_asyncio.fixture
async def usuario_cliente_nao_verificado(db_session) -> Usuario:
    return await factories.criar_usuario(
        db_session, perfil=PerfilUsuario.cliente, email_verificado=False
    )


@pytest_asyncio.fixture
async def usuario_admin(db_session) -> Usuario:
    return await factories.criar_usuario(db_session, perfil=PerfilUsuario.admin)


@pytest_asyncio.fixture
async def usuario_balcao(db_session) -> Usuario:
    return await factories.criar_usuario(db_session, perfil=PerfilUsuario.funcionario_balcao)


@pytest_asyncio.fixture
async def usuario_cozinha(db_session) -> Usuario:
    return await factories.criar_usuario(db_session, perfil=PerfilUsuario.cozinha)
