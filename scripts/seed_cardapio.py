"""Popula categorias e produtos de exemplo. Idempotente: não duplica se já existir por nome."""
import asyncio

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.categoria import Categoria
from app.models.produto import Produto

CATEGORIAS = ["Lanches", "Porções", "Bebidas", "Sobremesas"]

PRODUTOS = [
    dict(
        categoria="Lanches",
        nome="Zap Burger Clássico",
        descricao="Pão brioche, blend 160g, queijo cheddar, alface, tomate e maionese da casa.",
        preco=28.90,
        preco_promocional=22.90,
        imagem_url="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
    ),
    dict(
        categoria="Lanches",
        nome="Duplo Bacon",
        descricao="Dois blends 120g, bacon crocante, queijo prato e barbecue.",
        preco=34.90,
        preco_promocional=None,
        imagem_url="https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80",
    ),
    dict(
        categoria="Lanches",
        nome="Veggie Grelhado",
        descricao="Hambúrguer de grão-de-bico, rúcula, tomate seco e cream cheese.",
        preco=26.90,
        preco_promocional=None,
        imagem_url="https://images.unsplash.com/photo-1520072959219-c595dc870360?w=600&q=80",
    ),
    dict(
        categoria="Porções",
        nome="Batata Frita Grande",
        descricao="Porção generosa de batatas crocantes com sal e orégano.",
        preco=24.90,
        preco_promocional=18.90,
        imagem_url="https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80",
    ),
    dict(
        categoria="Porções",
        nome="Onion Rings",
        descricao="Anéis de cebola empanados e fritos, acompanha molho especial.",
        preco=22.90,
        preco_promocional=None,
        imagem_url="https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&q=80",
    ),
    dict(
        categoria="Bebidas",
        nome="Refrigerante Lata",
        descricao="350ml, gelado. Diversos sabores disponíveis.",
        preco=6.50,
        preco_promocional=None,
        imagem_url="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80",
    ),
    dict(
        categoria="Bebidas",
        nome="Suco Natural 500ml",
        descricao="Feito na hora, sem adição de açúcar.",
        preco=12.90,
        preco_promocional=9.90,
        imagem_url="https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80",
    ),
    dict(
        categoria="Sobremesas",
        nome="Brownie com Sorvete",
        descricao="Brownie de chocolate meio amargo com bola de sorvete de creme.",
        preco=18.90,
        preco_promocional=None,
        imagem_url="https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80",
    ),
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        categorias_por_nome: dict[str, Categoria] = {}
        for nome in CATEGORIAS:
            existente = (
                await db.execute(select(Categoria).where(Categoria.nome == nome))
            ).scalar_one_or_none()
            if existente is None:
                existente = Categoria(nome=nome, ativa=True)
                db.add(existente)
                await db.flush()
                print(f"Categoria criada: {nome}")
            categorias_por_nome[nome] = existente

        for dados in PRODUTOS:
            existente = (
                await db.execute(select(Produto).where(Produto.nome == dados["nome"]))
            ).scalar_one_or_none()
            if existente is not None:
                continue
            produto = Produto(
                categoria_id=categorias_por_nome[dados["categoria"]].id,
                nome=dados["nome"],
                descricao=dados["descricao"],
                preco=dados["preco"],
                preco_promocional=dados["preco_promocional"],
                imagem_url=dados["imagem_url"],
                ativo=True,
            )
            db.add(produto)
            print(f"Produto criado: {dados['nome']}")

        await db.commit()
    print("Seed concluído.")


if __name__ == "__main__":
    asyncio.run(seed())
