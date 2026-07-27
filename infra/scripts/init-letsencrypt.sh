#!/usr/bin/env bash
# Emite os certificados Let's Encrypt na primeira vez (bootstrap). Rodar UMA
# UNICA VEZ, a partir da raiz do repositorio, depois que:
#   - o DNS de APP_DOMAIN/ADMIN_DOMAIN/KDS_DOMAIN/API_DOMAIN ja aponta pra este
#     servidor;
#   - as portas 80 e 443 estao liberadas no firewall/security group.
#
#   ./infra/scripts/init-letsencrypt.sh
#
# Depois disso a renovacao e automatica via o servico "certbot" do compose.
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ ! -f .env.production ]; then
  echo "Erro: .env.production não encontrado. Copie .env.production.example e preencha os valores." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a && source .env.production && set +a

: "${APP_DOMAIN:?defina APP_DOMAIN no .env.production}"
: "${ADMIN_DOMAIN:?defina ADMIN_DOMAIN no .env.production}"
: "${KDS_DOMAIN:?defina KDS_DOMAIN no .env.production}"
: "${API_DOMAIN:?defina API_DOMAIN no .env.production}"
: "${LETSENCRYPT_EMAIL:?defina LETSENCRYPT_EMAIL no .env.production}"

COMPOSE=(docker compose -f infra/compose/docker-compose.prod.yml --env-file .env.production)
DOMAINS=("$APP_DOMAIN" "$ADMIN_DOMAIN" "$KDS_DOMAIN" "$API_DOMAIN")

echo ">> Criando certificados temporarios (dummy) para o nginx conseguir subir..."
for DOMAIN in "${DOMAINS[@]}"; do
  "${COMPOSE[@]}" run --rm --entrypoint sh certbot -c "
    mkdir -p /etc/letsencrypt/live/$DOMAIN && \
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
      -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
      -subj '/CN=localhost'
  "
done

# certbot roda como root e grava a chave privada com permissao 600; o nginx
# do proxy roda como usuario non-root (uid 101) e precisa conseguir le-la.
"${COMPOSE[@]}" run --rm --entrypoint sh certbot -c \
  "chmod -R o+rX /etc/letsencrypt/live /etc/letsencrypt/archive 2>/dev/null || true"

echo ">> Subindo o proxy com os certificados temporarios..."
"${COMPOSE[@]}" up -d proxy

echo ">> Removendo certificados temporarios..."
for DOMAIN in "${DOMAINS[@]}"; do
  "${COMPOSE[@]}" run --rm --entrypoint sh certbot -c "
    rm -rf /etc/letsencrypt/live/$DOMAIN /etc/letsencrypt/archive/$DOMAIN /etc/letsencrypt/renewal/$DOMAIN.conf
  "
done

echo ">> Solicitando certificados reais via HTTP-01 (webroot)..."
for DOMAIN in "${DOMAINS[@]}"; do
  "${COMPOSE[@]}" run --rm --entrypoint certbot certbot certonly \
    --webroot -w /var/www/certbot \
    -d "$DOMAIN" \
    --email "$LETSENCRYPT_EMAIL" --agree-tos --no-eff-email --non-interactive
done

"${COMPOSE[@]}" run --rm --entrypoint sh certbot -c \
  "chmod -R o+rX /etc/letsencrypt/live /etc/letsencrypt/archive 2>/dev/null || true"

echo ">> Recarregando o nginx com os certificados definitivos..."
"${COMPOSE[@]}" exec proxy nginx -s reload

echo ">> Pronto. Renovação automática ativa via o serviço 'certbot' (docker compose up -d)."
