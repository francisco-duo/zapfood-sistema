import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict, Field

from app.models.usuario import PerfilUsuario


class UsuarioBase(BaseModel):
    nome: str = Field(max_length=150)
    email: EmailStr = Field(max_length=100)
    telefone: str | None = Field(default=None, max_length=20)
    perfil: PerfilUsuario


class UsuarioCreate(UsuarioBase):
    senha: str = Field(min_length=8, max_length=128)


class UsuarioUpdate(BaseModel):
    nome: str | None = Field(default=None, max_length=150)
    telefone: str | None = Field(default=None, max_length=20)
    senha: str | None = Field(default=None, min_length=8, max_length=128)


class UsuarioRead(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email_verificado: bool
    criado_em: datetime
