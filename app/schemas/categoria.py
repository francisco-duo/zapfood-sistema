import uuid

from pydantic import BaseModel, ConfigDict, Field


class CategoriaBase(BaseModel):
    nome: str = Field(max_length=100)


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaRead(CategoriaBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    ativa: bool
