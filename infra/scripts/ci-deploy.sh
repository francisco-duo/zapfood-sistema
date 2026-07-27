#!/usr/bin/env bash
# Executado NO SERVIDOR pelo job "deploy" do workflow
# .github/workflows/ci-cd.yml, via SSH. Nao chame isso manualmente sem
# entender o fluxo — pra deploy manual use infra/scripts/deploy.sh (builda
# local em vez de puxar do registry).
#
# Variaveis de ambiente esperadas (exportadas pelo workflow antes de chamar):
#   IMAGE_TAG    tag publicada no GHCR pelo job "build" (ex.: o SHA do commit)
#   GHCR_TOKEN   token pra "docker login ghcr.io" (o GITHUB_TOKEN do run)
#   GHCR_ACTOR   usuario pro login (github.actor)
#   APP_DIR      diretorio no servidor com .env.production + infra/ (default /opt/zapfood)
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/zapfood}"
cd "$APP_DIR"

COMPOSE_FILE="infra/compose/docker-compose.prod.yml"
COMPOSE=(docker compose -f "$COMPOSE_FILE" --env-file .env.production)
STATE_FILE="$APP_DIR/.deployed_tag"
SERVICES=(migrate api worker frontend admin kds proxy)

if [ ! -f .env.production ]; then
  echo "Erro: $APP_DIR/.env.production não encontrado. Copie .env.production.example pra lá e preencha antes do primeiro deploy." >&2
  exit 1
fi

echo "==> Login no GHCR"
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_ACTOR" --password-stdin

PREVIOUS_TAG="$(cat "$STATE_FILE" 2>/dev/null || true)"
echo "==> Tag em producao no momento: ${PREVIOUS_TAG:-<nenhuma, primeiro deploy>}"
echo "==> Nova tag: $IMAGE_TAG"

subir_na_tag() {
  local tag="$1"
  local rodar_migracao="$2" # "sim" só no forward deploy — ver nota abaixo
  IMAGE_TAG="$tag" "${COMPOSE[@]}" pull "${SERVICES[@]}"
  if [ "$rodar_migracao" = "sim" ]; then
    IMAGE_TAG="$tag" "${COMPOSE[@]}" run --rm migrate
  fi
  IMAGE_TAG="$tag" "${COMPOSE[@]}" up -d api worker frontend admin kds proxy
}

checar_saude() {
  local tentativas=15
  local i
  for i in $(seq 1 "$tentativas"); do
    if "${COMPOSE[@]}" exec -T api curl -fsS http://localhost:8000/health >/dev/null 2>&1 \
       && curl -fsS http://127.0.0.1:8080/healthz >/dev/null 2>&1; then
      return 0
    fi
    echo "    health check $i/$tentativas ainda não respondeu, aguardando 5s..."
    sleep 5
  done
  return 1
}

echo "==> Subindo a nova versão ($IMAGE_TAG)"
subir_na_tag "$IMAGE_TAG" "sim"

echo "==> Checando saúde da aplicação"
if checar_saude; then
  echo "$IMAGE_TAG" > "$STATE_FILE"
  echo "==> Deploy concluído com sucesso na tag $IMAGE_TAG"
  docker image prune -f >/dev/null 2>&1 || true
  exit 0
fi

echo "==> Health check falhou. Iniciando rollback." >&2
if [ -z "$PREVIOUS_TAG" ]; then
  echo "==> Nenhuma tag anterior registrada (era o primeiro deploy) — nada pra reverter." >&2
  exit 1
fi

# Não roda "migrate" de volta: alembic upgrade head da imagem antiga pode nem
# conhecer a revisão mais nova do banco (schema já avançou). Rollback aqui é
# só de aplicação — reverter uma migração de banco é decisão manual
# (alembic downgrade), avaliando o que a migração nova mudou.
subir_na_tag "$PREVIOUS_TAG" "nao"

if checar_saude; then
  echo "$PREVIOUS_TAG" > "$STATE_FILE"
  echo "==> Rollback concluído: voltou pra tag $PREVIOUS_TAG" >&2
else
  echo "==> Rollback também falhou o health check — intervenção manual necessária." >&2
fi

exit 1
