from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.pedidos import router as pedidos_router
from app.core.config import settings
from app.messaging.rabbitmq import declarar_topologia, fechar_conexao


@asynccontextmanager
async def lifespan(app: FastAPI):
    await declarar_topologia()
    yield
    await fechar_conexao()


app = FastAPI(title="zapFood API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",  # Portal do Cliente
        "http://localhost:5175",  # Backoffice
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pedidos_router, prefix="/api/v1/pedidos", tags=["pedidos"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}
