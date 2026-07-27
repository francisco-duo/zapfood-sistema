from app import main as app_main


async def test_health_liveness(client):
    resposta = await client.get("/health")
    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["status"] == "ok"
    assert "environment" in corpo


async def test_readiness_tudo_ok(client, monkeypatch):
    async def _ok():
        return True

    monkeypatch.setattr(app_main, "verificar_banco", _ok)
    monkeypatch.setattr(app_main, "verificar_redis", _ok)
    monkeypatch.setattr(app_main, "verificar_rabbitmq", _ok)

    resposta = await client.get("/health/ready")
    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["status"] == "ok"
    assert corpo["dependencias"] == {"banco": True, "redis": True, "rabbitmq": True}


async def test_readiness_degradado_quando_uma_dependencia_falha(client, monkeypatch):
    async def _ok():
        return True

    async def _falha():
        return False

    monkeypatch.setattr(app_main, "verificar_banco", _ok)
    monkeypatch.setattr(app_main, "verificar_redis", _falha)
    monkeypatch.setattr(app_main, "verificar_rabbitmq", _ok)

    resposta = await client.get("/health/ready")
    assert resposta.status_code == 503
    corpo = resposta.json()
    assert corpo["status"] == "degradado"
    assert corpo["dependencias"]["redis"] is False
