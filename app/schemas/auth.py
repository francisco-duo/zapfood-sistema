from pydantic import BaseModel, EmailStr, Field

from app.schemas.usuario import UsuarioRead


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str = Field(min_length=1)


class RegistroClienteRequest(BaseModel):
    nome: str = Field(max_length=150)
    email: EmailStr = Field(max_length=100)
    senha: str = Field(min_length=8, max_length=128)
    telefone: str | None = Field(default=None, max_length=20)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioRead


class VerificarEmailRequest(BaseModel):
    token: str


class ReenviarVerificacaoResponse(BaseModel):
    mensagem: str


class EsqueciSenhaRequest(BaseModel):
    email: EmailStr


class RedefinirSenhaRequest(BaseModel):
    token: str
    senha_nova: str = Field(min_length=8, max_length=128)


class MensagemResponse(BaseModel):
    mensagem: str
