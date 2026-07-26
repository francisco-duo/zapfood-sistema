"""Cria os usuários de staff padrão (admin, balcão, cozinha). Idempotente por e-mail."""
import asyncio

from sqlalchemy import select

from app.core.security import hash_senha
from app.db.session import AsyncSessionLocal
from app.models.usuario import PerfilUsuario, Usuario

USUARIOS = [
    dict(
        nome="Administrador (proprietário)",
        email="admin@zapfood.com",
        senha="admin123",
        perfil=PerfilUsuario.admin,
    ),
    dict(
        nome="Funcionário de balcão",
        email="balcao@zapfood.com",
        senha="balcao123",
        perfil=PerfilUsuario.funcionario_balcao,
    ),
    dict(
        nome="Cozinha",
        email="cozinha@zapfood.com",
        senha="cozinha123",
        perfil=PerfilUsuario.cozinha,
    ),
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        for dados in USUARIOS:
            existente = (
                await db.execute(select(Usuario).where(Usuario.email == dados["email"]))
            ).scalar_one_or_none()
            if existente is not None:
                print(f"Já existe: {dados['email']}")
                continue

            usuario = Usuario(
                nome=dados["nome"],
                email=dados["email"],
                perfil=dados["perfil"],
                senha_hash=hash_senha(dados["senha"]),
            )
            db.add(usuario)
            print(f"Criado: {dados['email']} ({dados['perfil'].value})")

        await db.commit()
    print("Seed de usuários concluído.")


if __name__ == "__main__":
    asyncio.run(seed())
