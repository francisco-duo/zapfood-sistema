from unittest.mock import patch

from app.core.config import settings
from app.services.email_service import enviar_email


def test_enviar_email_nao_faz_nada_sem_api_key(monkeypatch):
    monkeypatch.setattr(settings, "RESEND_API_KEY", "")
    with patch("app.services.email_service.resend.Emails.send") as send_falso:
        enviar_email("cliente@example.com", "Assunto", "<p>corpo</p>")
    send_falso.assert_not_called()


def test_enviar_email_chama_resend_com_api_key_configurada(monkeypatch):
    monkeypatch.setattr(settings, "RESEND_API_KEY", "re_chave_de_teste")
    with patch("app.services.email_service.resend.Emails.send") as send_falso:
        enviar_email("cliente@example.com", "Assunto", "<p>corpo</p>")

    send_falso.assert_called_once()
    args = send_falso.call_args[0][0]
    assert args["to"] == ["cliente@example.com"]
    assert args["subject"] == "Assunto"
    assert args["html"] == "<p>corpo</p>"


def test_enviar_email_nao_propaga_erro_do_resend(monkeypatch):
    monkeypatch.setattr(settings, "RESEND_API_KEY", "re_chave_de_teste")
    with patch("app.services.email_service.resend.Emails.send", side_effect=RuntimeError("fora do ar")):
        enviar_email("cliente@example.com", "Assunto", "<p>corpo</p>")  # não deve levantar
