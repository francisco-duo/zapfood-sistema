import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.categoria import CategoriaRead


class ProdutoBase(BaseModel):
    categoria_id: uuid.UUID
    nome: str = Field(max_length=150)
    descricao: str
    preco: float = Field(gt=0)
    preco_promocional: float | None = Field(default=None, gt=0)
    imagem_url: str = Field(max_length=500)


class ProdutoCreate(ProdutoBase):
    pass


class ProdutoUpdate(BaseModel):
    categoria_id: uuid.UUID | None = None
    nome: str | None = Field(default=None, max_length=150)
    descricao: str | None = None
    preco: float | None = Field(default=None, gt=0)
    preco_promocional: float | None = Field(default=None, gt=0)
    imagem_url: str | None = Field(default=None, max_length=500)


class ProdutoRead(ProdutoBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    ativo: bool


class CardapioResponse(BaseModel):
    categorias: list[CategoriaRead]
    produtos: list[ProdutoRead]
