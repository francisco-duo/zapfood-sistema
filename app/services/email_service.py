import logging

import resend

from app.core.config import settings

logger = logging.getLogger("services.email")

resend.api_key = settings.RESEND_API_KEY


def enviar_email(destinatario: str, assunto: str, html: str) -> None:
    """Envia um e-mail transacional via Resend.

    Roda como BackgroundTask (função síncrona — o Starlette a executa numa
    threadpool), então nunca bloqueia a resposta HTTP nem derruba a
    requisição principal se o Resend estiver fora do ar (RNF004).
    """
    if not settings.RESEND_API_KEY:
        logger.warning(
            "RESEND_API_KEY não configurada; e-mail para %s NÃO foi enviado (assunto: %s).",
            destinatario,
            assunto,
        )
        return

    try:
        resend.Emails.send(
            {
                "from": settings.RESEND_FROM_EMAIL,
                "to": [destinatario],
                "subject": assunto,
                "html": html,
            }
        )
        logger.info("E-mail '%s' enviado para %s.", assunto, destinatario)
    except Exception:
        logger.exception("Falha ao enviar e-mail '%s' para %s.", assunto, destinatario)
