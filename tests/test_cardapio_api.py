import uuid

from app.core.redis import get_redis
from app.services.cardapio_cache import CARDAPIO_CACHE_KEY
from tests import factories
from tests.conftest import auth_headers

PREFIXO = "/api/v1"


async def _limpar_cache():
    try:
        await get_redis().delete(CARDAPIO_CACHE_KEY)
    except Exception:
        pass


# --- GET /cardapio (público, com cache) ---------------------------------------------------------


async def test_obter_cardapio_retorna_apenas_categorias_e_produtos_ativos(client, db_session):
    await _limpar_cache()
    categoria_ativa = await factories.criar_categoria(db_session, ativa=True)
    await factories.criar_categoria(db_session, ativa=False)
    await factories.criar_produto(db_session, categoria_ativa, ativo=True)
    await factories.criar_produto(db_session, categoria_ativa, ativo=False)

    resposta = await client.get(f"{PREFIXO}/cardapio")

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert len(corpo["categorias"]) == 1
    assert len(corpo["produtos"]) == 1


async def test_obter_cardapio_usa_cache_na_segunda_chamada(client, db_session):
    await _limpar_cache()
    categoria = await factories.criar_categoria(db_session)
    await factories.criar_produto(db_session, categoria)

    primeira = await client.get(f"{PREFIXO}/cardapio")
    assert primeira.status_code == 200

    cache_bruto = await get_redis().get(CARDAPIO_CACHE_KEY)
    assert cache_bruto is not None

    # Mesmo criando outro produto sem invalidar o cache, a segunda leitura
    # deve continuar batendo no Redis (mesmo resultado da primeira).
    await factories.criar_produto(db_session, categoria)
    segunda = await client.get(f"{PREFIXO}/cardapio")
    assert segunda.json() == primeira.json()

    await _limpar_cache()


# --- categorias (leitura: admin+balcão / escrita: admin) ---------------------------------------------------------


async def test_listar_categorias_como_balcao(client, db_session, usuario_balcao):
    await factories.criar_categoria(db_session)
    resposta = await client.get(f"{PREFIXO}/categorias", headers=auth_headers(usuario_balcao))
    assert resposta.status_code == 200


async def test_listar_categorias_como_cliente_retorna_403(client, usuario_cliente):
    resposta = await client.get(f"{PREFIXO}/categorias", headers=auth_headers(usuario_cliente))
    assert resposta.status_code == 403


async def test_criar_categoria_como_admin(client, usuario_admin):
    resposta = await client.post(
        f"{PREFIXO}/categorias", headers=auth_headers(usuario_admin), json={"nome": "Sobremesas"}
    )
    assert resposta.status_code == 201
    assert resposta.json()["nome"] == "Sobremesas"


async def test_criar_categoria_como_balcao_retorna_403(client, usuario_balcao):
    resposta = await client.post(
        f"{PREFIXO}/categorias", headers=auth_headers(usuario_balcao), json={"nome": "Sobremesas"}
    )
    assert resposta.status_code == 403


async def test_criar_categoria_invalida_cache_do_cardapio(client, db_session, usuario_admin):
    await _limpar_cache()
    await client.get(f"{PREFIXO}/cardapio")
    assert await get_redis().get(CARDAPIO_CACHE_KEY) is not None

    await client.post(
        f"{PREFIXO}/categorias", headers=auth_headers(usuario_admin), json={"nome": "Nova"}
    )

    assert await get_redis().get(CARDAPIO_CACHE_KEY) is None


# --- produtos (leitura: admin+balcão / escrita: admin) ---------------------------------------------------------


async def test_listar_produtos_inclui_inativos_para_gestao(client, db_session, usuario_admin):
    categoria = await factories.criar_categoria(db_session)
    await factories.criar_produto(db_session, categoria, ativo=False)

    resposta = await client.get(f"{PREFIXO}/produtos", headers=auth_headers(usuario_admin))
    assert resposta.status_code == 200
    assert any(p["ativo"] is False for p in resposta.json())


async def test_criar_produto_como_admin(client, db_session, usuario_admin):
    categoria = await factories.criar_categoria(db_session)

    resposta = await client.post(
        f"{PREFIXO}/produtos",
        headers=auth_headers(usuario_admin),
        json={
            "categoria_id": str(categoria.id),
            "nome": "X-Salada",
            "descricao": "Pão, carne, salada",
            "preco": 22.9,
            "imagem_url": "https://picsum.photos/200",
        },
    )
    assert resposta.status_code == 201
    assert resposta.json()["nome"] == "X-Salada"
    assert resposta.json()["ativo"] is True


async def test_atualizar_produto_como_admin(client, db_session, usuario_admin):
    categoria = await factories.criar_categoria(db_session)
    produto = await factories.criar_produto(db_session, categoria, nome="Antigo")

    resposta = await client.put(
        f"{PREFIXO}/produtos/{produto.id}",
        headers=auth_headers(usuario_admin),
        json={"nome": "Novo Nome"},
    )
    assert resposta.status_code == 200
    assert resposta.json()["nome"] == "Novo Nome"


async def test_atualizar_produto_inexistente_retorna_404(client, usuario_admin):
    resposta = await client.put(
        f"{PREFIXO}/produtos/{uuid.uuid4()}",
        headers=auth_headers(usuario_admin),
        json={"nome": "Novo Nome"},
    )
    assert resposta.status_code == 404


async def test_alternar_ativo_produto_inverte_o_estado(client, db_session, usuario_admin):
    categoria = await factories.criar_categoria(db_session)
    produto = await factories.criar_produto(db_session, categoria, ativo=True)

    resposta = await client.patch(
        f"{PREFIXO}/produtos/{produto.id}/alternar-ativo", headers=auth_headers(usuario_admin)
    )
    assert resposta.status_code == 200
    assert resposta.json()["ativo"] is False

    resposta2 = await client.patch(
        f"{PREFIXO}/produtos/{produto.id}/alternar-ativo", headers=auth_headers(usuario_admin)
    )
    assert resposta2.json()["ativo"] is True


async def test_criar_produto_como_cliente_retorna_403(client, db_session, usuario_cliente):
    categoria = await factories.criar_categoria(db_session)
    resposta = await client.post(
        f"{PREFIXO}/produtos",
        headers=auth_headers(usuario_cliente),
        json={
            "categoria_id": str(categoria.id),
            "nome": "X-Salada",
            "descricao": "Pão, carne, salada",
            "preco": 22.9,
            "imagem_url": "https://picsum.photos/200",
        },
    )
    assert resposta.status_code == 403
