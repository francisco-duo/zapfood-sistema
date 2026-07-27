from sqlalchemy import text

from app.db.session import get_db


async def test_get_db_entrega_uma_sessao_utilizavel_e_fecha_ao_final():
    gerador = get_db()
    session = await gerador.__anext__()

    resultado = await session.execute(text("SELECT 1"))
    assert resultado.scalar() == 1

    # Esgota o generator pra rodar o "async with" até o fim (fecha a sessão).
    fechou = False
    try:
        await gerador.__anext__()
    except StopAsyncIteration:
        fechou = True
    assert fechou
