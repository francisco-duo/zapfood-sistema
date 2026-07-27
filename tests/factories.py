"""Factories leves para criar registros de teste com dados realistas (Faker).

Não usamos factory-boy: seu suporte a SQLAlchemy async exige workarounds e as
funções abaixo já cobrem bem o caso de uso (criar + persistir + devolver o
objeto pronto pra usar no teste).
"""

import uuid

from faker import Faker
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_senha
from app.models.categoria import Categoria
from app.models.item_pedido import ItemPedido
from app.models.pedido import OrigemPedido, Pedido, StatusPedido, TipoEntrega
from app.models.produto import Produto
from app.models.usuario import PerfilUsuario, Usuario

fake = Faker("pt_BR")


async def criar_usuario(
    db: AsyncSession,
    *,
    perfil: PerfilUsuario = PerfilUsuario.cliente,
    senha: str = "senha12345",
    email_verificado: bool = True,
    nome: str | None = None,
    email: str | None = None,
    telefone: str | None = None,
) -> Usuario:
    usuario = Usuario(
        nome=nome or fake.name(),
        email=email or fake.unique.email(),
        senha_hash=hash_senha(senha),
        telefone=telefone,
        perfil=perfil,
        email_verificado=email_verificado,
    )
    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)
    return usuario


async def criar_categoria(
    db: AsyncSession, *, nome: str | None = None, ativa: bool = True
) -> Categoria:
    categoria = Categoria(nome=nome or fake.unique.word().capitalize(), ativa=ativa)
    db.add(categoria)
    await db.commit()
    await db.refresh(categoria)
    return categoria


async def criar_produto(
    db: AsyncSession,
    categoria: Categoria,
    *,
    nome: str | None = None,
    preco: float = 25.9,
    preco_promocional: float | None = None,
    ativo: bool = True,
) -> Produto:
    produto = Produto(
        categoria_id=categoria.id,
        nome=nome or fake.unique.word().capitalize(),
        descricao=fake.sentence(),
        preco=preco,
        preco_promocional=preco_promocional,
        imagem_url="https://picsum.photos/200",
        ativo=ativo,
    )
    db.add(produto)
    await db.commit()
    await db.refresh(produto)
    return produto


async def criar_pedido(
    db: AsyncSession,
    *,
    usuario: Usuario | None = None,
    origem: OrigemPedido = OrigemPedido.online,
    tipo_entrega: TipoEntrega = TipoEntrega.retirada,
    status: StatusPedido = StatusPedido.aguardando_aprovacao,
    forma_pagamento: str = "Pix",
    endereco_entrega: str | None = None,
    itens: list[dict] | None = None,
) -> Pedido:
    itens = itens or [
        {"produto_id": uuid.uuid4(), "quantidade": 2, "preco_unitario_cobrado": 25.9}
    ]
    valor_total = sum(item["quantidade"] * item["preco_unitario_cobrado"] for item in itens)

    pedido = Pedido(
        usuario_id=usuario.id if usuario else None,
        origem=origem,
        tipo_entrega=tipo_entrega,
        status=status,
        forma_pagamento=forma_pagamento,
        endereco_entrega=endereco_entrega,
        valor_total=valor_total,
    )
    pedido.itens = [ItemPedido(**item) for item in itens]
    db.add(pedido)
    await db.commit()
    await db.refresh(pedido, attribute_names=["itens"])
    return pedido
