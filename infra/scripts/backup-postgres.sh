#!/bin/sh
# Roda DENTRO do container "backup" (ver infra/compose/docker-compose.prod.yml,
# imagem postgres:16-alpine — já tem pg_dump na versão certa pro banco).
#
# Um dump completo do Postgres a cada BACKUP_INTERVAL_HORAS (default 24),
# comprimido e com nome carimbado, guardado em /backups (volume
# "zapfood_backups_prod"). Rotação: apaga dumps com mais de
# BACKUP_RETENTION_DIAS (default 14).
#
# --clean --if-exists no pg_dump grava os DROP antes dos CREATE, então
# restaurar é só "gunzip -c arquivo.sql.gz | psql ..." sem precisar dropar
# o banco antes — ver infra/scripts/restore-postgres.sh.
set -eu

: "${POSTGRES_USER:?defina POSTGRES_USER}"
: "${POSTGRES_DB:?defina POSTGRES_DB}"
: "${POSTGRES_PASSWORD:?defina POSTGRES_PASSWORD}"
PGHOST="${PGHOST:-db}"
export PGPASSWORD="$POSTGRES_PASSWORD"

BACKUP_DIR=/backups
RETENCAO_DIAS="${BACKUP_RETENTION_DIAS:-14}"
INTERVALO_HORAS="${BACKUP_INTERVAL_HORAS:-24}"

executar_backup() {
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  arquivo="$BACKUP_DIR/zapfood_${timestamp}.sql.gz"
  tmp="${arquivo}.tmp"

  echo "[$timestamp] iniciando backup -> $arquivo"
  if pg_dump -h "$PGHOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
       --format=plain --clean --if-exists --no-owner --no-privileges \
       | gzip > "$tmp"; then
    mv "$tmp" "$arquivo"
    echo "[$timestamp] backup concluído ($(du -h "$arquivo" | cut -f1))"
  else
    echo "[$timestamp] ERRO: pg_dump falhou" >&2
    rm -f "$tmp"
    return 1
  fi

  echo "[$timestamp] removendo backups com mais de ${RETENCAO_DIAS}d"
  find "$BACKUP_DIR" -name 'zapfood_*.sql.gz' -mtime "+$RETENCAO_DIAS" -print -delete
}

# "--once" existe pra rodar um backup manual sem esperar o loop:
#   docker compose -f infra/compose/docker-compose.prod.yml --env-file .env.production \
#     exec backup sh /scripts/backup-postgres.sh --once
if [ "${1:-}" = "--once" ]; then
  executar_backup
  exit $?
fi

while true; do
  executar_backup || echo "backup falhou, tentando de novo no próximo ciclo"
  sleep "$((INTERVALO_HORAS * 3600))"
done
