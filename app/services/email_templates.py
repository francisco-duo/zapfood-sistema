"""Templates de e-mail transacional (HTML com CSS inline, para compatibilidade
ampla entre clientes de e-mail — Gmail, Outlook, Apple Mail etc.)."""

from datetime import datetime, timezone

_CORAL = "#FF5A36"
_CORAL_DARK = "#E23F1D"
_INK = "#171418"
_MUTED = "#7A7178"
_BG = "#FBF9F7"


def _base(preheader: str, conteudo_html: str) -> str:
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>zapFood</title>
</head>
<body style="margin:0; padding:0; background-color:{_BG}; font-family:'Segoe UI', Helvetica, Arial, sans-serif;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">{preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{_BG}; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 32px rgba(23,20,24,0.08);">
          <tr>
            <td style="padding:32px 32px 0 32px; text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px auto;">
                <tr>
                  <td style="width:52px; height:52px; border-radius:14px; background:linear-gradient(135deg, #FF8563 0%, {_CORAL_DARK} 100%); text-align:center; vertical-align:middle; font-size:26px;">
                    🍔
                  </td>
                </tr>
              </table>
              <div style="font-size:20px; font-weight:800; color:{_INK}; letter-spacing:-0.02em;">zapFood</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px 32px;">
              {conteudo_html}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px; background-color:{_BG}; text-align:center;">
              <div style="font-size:12px; color:{_MUTED};">
                Este é um e-mail automático, não é necessário responder.<br />
                © {datetime.now(timezone.utc).year} zapFood. Todos os direitos reservados.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _botao(texto: str, link: str) -> str:
    return f"""
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;">
        <tr>
          <td style="border-radius:14px; background:linear-gradient(135deg, #FF8563 0%, {_CORAL_DARK} 100%);">
            <a href="{link}" target="_blank"
               style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:14px;">
              {texto}
            </a>
          </td>
        </tr>
      </table>
    """


def template_verificacao_email(nome: str, link: str) -> str:
    conteudo = f"""
      <h1 style="font-size:22px; font-weight:800; color:{_INK}; margin:0 0 12px 0; text-align:center; letter-spacing:-0.01em;">
        Confirme seu e-mail
      </h1>
      <p style="font-size:15px; color:{_MUTED}; line-height:1.6; margin:0; text-align:center;">
        Olá, {nome.split(" ")[0]}! Falta pouco para você começar a pedir no zapFood.
        Clique no botão abaixo para confirmar que este é o seu e-mail.
      </p>
      {_botao("Confirmar meu e-mail", link)}
      <p style="font-size:13px; color:{_MUTED}; line-height:1.6; margin:0; text-align:center;">
        Se você não criou uma conta no zapFood, pode ignorar esta mensagem com segurança.
        Este link expira em 24 horas.
      </p>
    """
    return _base("Confirme seu e-mail para ativar sua conta zapFood", conteudo)


def template_redefinicao_senha(nome: str, link: str) -> str:
    conteudo = f"""
      <h1 style="font-size:22px; font-weight:800; color:{_INK}; margin:0 0 12px 0; text-align:center; letter-spacing:-0.01em;">
        Redefinir sua senha
      </h1>
      <p style="font-size:15px; color:{_MUTED}; line-height:1.6; margin:0; text-align:center;">
        Olá, {nome.split(" ")[0]}. Recebemos um pedido para redefinir a senha da sua conta zapFood.
        Clique no botão abaixo para escolher uma nova senha.
      </p>
      {_botao("Redefinir minha senha", link)}
      <p style="font-size:13px; color:{_MUTED}; line-height:1.6; margin:0; text-align:center;">
        Se você não pediu essa alteração, pode ignorar este e-mail — sua senha atual continua
        funcionando normalmente. Este link expira em 1 hora.
      </p>
    """
    return _base("Redefina sua senha zapFood", conteudo)
