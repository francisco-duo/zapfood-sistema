import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import requer_perfil
from app.db.session import get_db
from app.models.categoria import Categoria
from app.models.produto import Produto
from app.models.usuario import PerfilUsuario
from app.schemas.categoria import CategoriaCreate, CategoriaRead
from app.schemas.produto import CardapioResponse, ProdutoCreate, ProdutoRead, ProdutoUpdate
from app.services.cardapio_cache import (
    invalidar_cardapio_cache,
    obter_cardapio_cache,
    salvar_cardapio_cache,
)

router = APIRouter()

_SOMENTE_ADMIN = [Depends(requer_perfil(PerfilUsuario.admin))]
# Leitura do catálogo administrativo: balcão também precisa enxergar os
# produtos para montar a comanda do PDV (RF010), mesmo sem poder editá-los.
_LEITURA_GESTAO = [Depends(requer_perfil(PerfilUsuario.admin, PerfilUsuario.funcionario_balcao))]


@router.get("/cardapio", response_model=CardapioResponse)
async def obter_cardapio(db: AsyncSession = Depends(get_db)) -> CardapioResponse:
    """Cardápio público: categorias e produtos ativos. Lido do Redis quando possível (RNF do cache)."""
    cache_bruto = await obter_cardapio_cache()
    if cache_bruto is not None:
        return CardapioResponse.model_validate_json(cache_bruto)

    categorias = (
        (await db.execute(select(Categoria).where(Categoria.ativa == True))).scalars().all()  # noqa: E712
    )
    produtos = (
        (await db.execute(select(Produto).where(Produto.ativo == True))).scalars().all()  # noqa: E712
    )

    resposta = CardapioResponse(
        categorias=[CategoriaRead.model_validate(c) for c in categorias],
        produtos=[ProdutoRead.model_validate(p) for p in produtos],
    )
    await salvar_cardapio_cache(resposta)
    return resposta


@router.get("/categorias", response_model=list[CategoriaRead], dependencies=_LEITURA_GESTAO)
async def listar_categorias(db: AsyncSession = Depends(get_db)) -> list[Categoria]:
    resultado = await db.execute(select(Categoria).order_by(Categoria.nome))
    return list(resultado.scalars().all())


@router.post(
    "/categorias",
    response_model=CategoriaRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=_SOMENTE_ADMIN,
)
async def criar_categoria(dados: CategoriaCreate, db: AsyncSession = Depends(get_db)) -> Categoria:
    categoria = Categoria(nome=dados.nome)
    db.add(categoria)
    await db.commit()
    await invalidar_cardapio_cache()
    return categoria


@router.get("/produtos", response_model=list[ProdutoRead], dependencies=_LEITURA_GESTAO)
async def listar_produtos(db: AsyncSession = Depends(get_db)) -> list[Produto]:
    """Listagem administrativa: inclui produtos inativos. Não usa cache."""
    resultado = await db.execute(select(Produto).order_by(Produto.nome))
    return list(resultado.scalars().all())


async def _carregar_produto(produto_id: uuid.UUID, db: AsyncSession) -> Produto:
    produto = await db.get(Produto, produto_id)
    if produto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado.")
    return produto


@router.post(
    "/produtos",
    response_model=ProdutoRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=_SOMENTE_ADMIN,
)
async def criar_produto(dados: ProdutoCreate, db: AsyncSession = Depends(get_db)) -> Produto:
    produto = Produto(**dados.model_dump())
    db.add(produto)
    await db.commit()
    await invalidar_cardapio_cache()
    return produto


@router.put("/produtos/{produto_id}", response_model=ProdutoRead, dependencies=_SOMENTE_ADMIN)
async def atualizar_produto(
    produto_id: uuid.UUID, dados: ProdutoUpdate, db: AsyncSession = Depends(get_db)
) -> Produto:
    produto = await _carregar_produto(produto_id, db)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(produto, campo, valor)
    await db.commit()
    await invalidar_cardapio_cache()
    return produto


@router.patch(
    "/produtos/{produto_id}/alternar-ativo", response_model=ProdutoRead, dependencies=_SOMENTE_ADMIN
)
async def alternar_ativo_produto(produto_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Produto:
    produto = await _carregar_produto(produto_id, db)
    produto.ativo = not produto.ativo
    await db.commit()
    await invalidar_cardapio_cache()
    return produto
