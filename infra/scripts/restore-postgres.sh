#!/usr/bin/env bash
# Restaura um backup do Postgres. Rodar a partir da raiz do repositorio,
# com a stack de producao no ar:
#
#   ./infra/scripts/restore-postgres.sh /caminho/para/zapfood_20260101T000000Z.sql.gz
#
# ATENCAO: isso SOBRESCREVE o banco atual (o dump foi gerado com --clean
# --if-exists, entao ele mesmo dropa e recria os objetos). Roda no host, não
# dentro de um container, porque precisa que o operador confirme antes de
# continuar.
set -euo pipefail

cd "$(dirname "$0")/../.."

ARQUIVO="${1:?uso: restore-postgres.sh <arquivo.sql.gz>}"

if [ ! -f "$ARQUIVO" ]; then
  echo "Erro: arquivo não encontrado: $ARQUIVO" >&2
  exit 1
fi

if [ ! -f .env.production ]; then
  echo "Erro: .env.production não encontrado." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a && source .env.production && set +a

COMPOSE=(docker compose -f infra/compose/docker-compose.prod.yml --env-file .env.production)

echo "ATENÇÃO: isso vai APAGAR o conteúdo atual do banco '$POSTGRES_DB' e restaurar a partir de:"
echo "  $ARQUIVO"
read -r -p "Digite 'restaurar' para confirmar: " CONFIRMACAO
if [ "$CONFIRMACAO" != "restaurar" ]; then
  echo "Cancelado."
  exit 1
fi

echo ">> Parando api e worker (evita escrita durante a restauração)..."
"${COMPOSE[@]}" stop api worker

echo ">> Restaurando..."
gunzip -c "$ARQUIVO" | "${COMPOSE[@]}" exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo ">> Restauração concluída. Subindo api e worker de novo..."
"${COMPOSE[@]}" up -d api worker

echo ">> Pronto. Confira /health/ready antes de liberar tráfego de verdade."
