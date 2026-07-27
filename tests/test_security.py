from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt as jose_jwt

from app.core.security import (
    JWTError,
    criar_access_token,
    decodificar_access_token,
    hash_senha,
    verificar_senha,
)


def test_hash_senha_gera_hash_diferente_da_senha_original():
    hash_resultante = hash_senha("minhaSenha123")
    assert hash_resultante != "minhaSenha123"


def test_hash_senha_e_verificar_senha_fazem_round_trip():
    hash_resultante = hash_senha("minhaSenha123")
    assert verificar_senha("minhaSenha123", hash_resultante) is True


def test_verificar_senha_rejeita_senha_errada():
    hash_resultante = hash_senha("minhaSenha123")
    assert verificar_senha("outraSenha", hash_resultante) is False


def test_hash_senha_e_nao_deterministico_mesmo_pra_mesma_senha():
    # Argon2 gera um salt aleatório a cada chamada, então dois hashes da
    # mesma senha nunca devem ser iguais (mesmo com o pepper fixo).
    assert hash_senha("minhaSenha123") != hash_senha("minhaSenha123")


def test_criar_e_decodificar_access_token_fazem_round_trip():
    token = criar_access_token(usuario_id="abc-123", perfil="cliente")
    payload = decodificar_access_token(token)
    assert payload["sub"] == "abc-123"
    assert payload["perfil"] == "cliente"
    assert "exp" in payload
    assert "iat" in payload


def test_decodificar_access_token_rejeita_token_adulterado():
    token = criar_access_token(usuario_id="abc-123", perfil="cliente")
    token_adulterado = token[:-1] + ("A" if token[-1] != "A" else "B")
    with pytest.raises(JWTError):
        decodificar_access_token(token_adulterado)


def test_decodificar_access_token_rejeita_token_expirado(monkeypatch):
    # Fabrica um token já expirado manipulando o "exp" diretamente, sem
    # depender de esperar o relógio andar.
    from app.core.config import settings

    agora = datetime.now(timezone.utc)
    payload = {"sub": "abc-123", "perfil": "cliente", "iat": agora - timedelta(hours=1), "exp": agora - timedelta(minutes=1)}
    token_expirado = jose_jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    with pytest.raises(JWTError):
        decodificar_access_token(token_expirado)


def test_decodificar_access_token_rejeita_assinatura_de_outra_chave():
    token = jose_jwt.encode({"sub": "abc-123"}, "outra-chave-secreta", algorithm="HS256")
    with pytest.raises(JWTError):
        decodificar_access_token(token)
