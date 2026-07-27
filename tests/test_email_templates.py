from datetime import datetime, timezone

from app.services.email_templates import (
    template_redefinicao_senha,
    template_verificacao_email,
)


def test_template_verificacao_email_contem_nome_link_e_ano_atual():
    html = template_verificacao_email("Maria Silva", "https://app.zapfood.com/verificar-email?token=abc")

    assert "Maria" in html
    assert "https://app.zapfood.com/verificar-email?token=abc" in html
    assert str(datetime.now(timezone.utc).year) in html
    assert "{{" not in html and "}}" not in html


def test_template_redefinicao_senha_contem_nome_link_e_ano_atual():
    html = template_redefinicao_senha("João", "https://app.zapfood.com/redefinir-senha?token=xyz")

    assert "João" in html
    assert "https://app.zapfood.com/redefinir-senha?token=xyz" in html
    assert str(datetime.now(timezone.utc).year) in html
    assert "{{" not in html and "}}" not in html


def test_templates_usam_apenas_o_primeiro_nome_na_saudacao():
    html = template_verificacao_email("Maria Silva Santos", "https://link")
    assert "Olá, Maria!" in html
