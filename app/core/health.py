"""Checagens de dependências externas para o endpoint de readiness.

Separado do endpoint /health (liveness, sempre rápido e sem I/O) porque
readiness pode — e deve — falhar de propósito quando um serviço externo
está fora do ar, para tirar essa réplica da rotação de um load balancer.
"""

import asyncio
import logging

from sqlalchemy import text

from app.core.redis import get_redis
from app.db.session import AsyncSessionLocal
from app.messaging.rabbitmq import conexao_esta_saudavel

logger = logging.getLogger("core.health")

_TIMEOUT_SEGUNDOS = 3.0


async def verificar_banco() -> bool:
    try:
        async with asyncio.timeout(_TIMEOUT_SEGUNDOS):
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
        return True
    except Exception:
        logger.exception("Readiness: banco de dados indisponível.")
        return False


async def verificar_redis() -> bool:
    try:
        async with asyncio.timeout(_TIMEOUT_SEGUNDOS):
            await get_redis().ping()
        return True
    except Exception:
        logger.exception("Readiness: Redis indisponível.")
        return False


async def verificar_rabbitmq() -> bool:
    # Só reporta o estado da conexão já estabelecida no lifespan — não tenta
    # reconectar aqui, isso é responsabilidade do aio_pika (connect_robust).
    return conexao_esta_saudavel()
