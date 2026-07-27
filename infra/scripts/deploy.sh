#!/usr/bin/env bash
# Build e sobe a stack de producao. Rodar a partir da raiz do repositorio:
#   ./infra/scripts/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ ! -f .env.production ]; then
  echo "Erro: .env.production não encontrado. Copie .env.production.example e preencha os valores." >&2
  exit 1
fi

docker compose -f infra/compose/docker-compose.prod.yml --env-file .env.production up -d --build

echo
echo "Deploy concluido. Status dos serviços:"
docker compose -f infra/compose/docker-compose.prod.yml --env-file .env.production ps
