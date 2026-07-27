from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    future=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT_SEGUNDOS,
    pool_recycle=settings.DB_POOL_RECYCLE_SEGUNDOS,
    # Testa a conexão antes de emprestá-la do pool: sem isso, uma conexão
    # derrubada pelo Postgres/proxy enquanto ociosa só falha na hora do uso,
    # como erro pro cliente, em vez de ser descartada e reaberta silenciosamente.
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
