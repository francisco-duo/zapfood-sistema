import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.api.v1.cardapio import router as cardapio_router
from app.api.v1.kds import router as kds_router
from app.api.v1.pedidos import router as pedidos_router
from app.core.config import settings
from app.core.redis import fechar_redis
from app.messaging.rabbitmq import declarar_topologia, fechar_conexao

logger = logging.getLogger("app.startup")

TENTATIVAS_CONEXAO_RABBITMQ = 5
ESPERA_ENTRE_TENTATIVAS_SEGUNDOS = 3


async def _declarar_topologia_com_retry() -> None:
    """RabbitMQ pode reportar 'healthy' no healthcheck do Docker antes do
    listener AMQP aceitar conexões de fato — sem retry, a API cai de vez
    nesse cold start e não se recupera sozinha (uvicorn --reload não relança
    o processo que falhou no lifespan)."""
    for tentativa in range(1, TENTATIVAS_CONEXAO_RABBITMQ + 1):
        try:
            await declarar_topologia()
            return
        except Exception:
            if tentativa == TENTATIVAS_CONEXAO_RABBITMQ:
                raise
            logger.warning(
                "Falha ao conectar no RabbitMQ (tentativa %s/%s); tentando novamente em %ss...",
                tentativa,
                TENTATIVAS_CONEXAO_RABBITMQ,
                ESPERA_ENTRE_TENTATIVAS_SEGUNDOS,
            )
            await asyncio.sleep(ESPERA_ENTRE_TENTATIVAS_SEGUNDOS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await _declarar_topologia_com_retry()
    yield
    await fechar_conexao()
    await fechar_redis()


app = FastAPI(title="zapFood API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(pedidos_router, prefix="/api/v1/pedidos", tags=["pedidos"])
app.include_router(cardapio_router, prefix="/api/v1", tags=["cardapio"])
app.include_router(kds_router, tags=["kds"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}
