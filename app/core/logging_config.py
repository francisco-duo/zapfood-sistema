"""Logging estruturado (JSON, uma linha por evento) para os dois entrypoints
do processo (API e worker).

Sempre escreve em stdout — pensado pra rodar em container, onde quem cuida
de rotação/retenção é o driver de log do Docker (ver "logging:" em
infra/compose/docker-compose.prod.yml), não um RotatingFileHandler local.
"""

import json
import logging
import sys
from datetime import datetime, timezone

# Atributos que todo LogRecord já tem — usado pra separar campos "extras"
# (passados via logger.info(..., extra={...})) do resto.
_CAMPOS_PADRAO_LOGRECORD = frozenset(
    logging.LogRecord(
        "", logging.INFO, "", 0, "", (), None
    ).__dict__.keys()
)


class FormatadorJSON(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        for chave, valor in record.__dict__.items():
            if chave not in _CAMPOS_PADRAO_LOGRECORD:
                payload.setdefault(chave, valor)
        return json.dumps(payload, ensure_ascii=False, default=str)


def configurar_logging(nivel: str) -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(FormatadorJSON())
    logging.basicConfig(level=nivel, handlers=[handler], force=True)
