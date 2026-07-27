import json
import logging

import pytest

from app.core.logging_config import FormatadorJSON, configurar_logging


def _registro(msg="oi", **extra):
    registro = logging.LogRecord(
        name="teste.logger",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg=msg,
        args=(),
        exc_info=None,
    )
    for chave, valor in extra.items():
        setattr(registro, chave, valor)
    return registro


def test_formatador_json_produz_json_valido_com_campos_basicos():
    linha = FormatadorJSON().format(_registro("mensagem de teste"))
    payload = json.loads(linha)

    assert payload["level"] == "INFO"
    assert payload["logger"] == "teste.logger"
    assert payload["message"] == "mensagem de teste"
    assert "timestamp" in payload


def test_formatador_json_inclui_campos_extras():
    linha = FormatadorJSON().format(_registro("pedido criado", pedido_id="abc123"))
    payload = json.loads(linha)

    assert payload["pedido_id"] == "abc123"


def test_formatador_json_inclui_stack_trace_em_excecao():
    try:
        raise ValueError("boom")
    except ValueError:
        import sys

        registro = _registro("erro")
        registro.exc_info = sys.exc_info()
        linha = FormatadorJSON().format(registro)

    payload = json.loads(linha)
    assert "ValueError: boom" in payload["exception"]


@pytest.fixture
def logging_isolado():
    root = logging.getLogger()
    handlers_originais = root.handlers[:]
    nivel_original = root.level
    yield
    root.handlers = handlers_originais
    root.setLevel(nivel_original)


def test_configurar_logging_instala_handler_json_no_root_logger(logging_isolado):
    configurar_logging("DEBUG")
    root = logging.getLogger()

    assert len(root.handlers) == 1
    assert isinstance(root.handlers[0].formatter, FormatadorJSON)
    assert root.level == logging.DEBUG
