#!/bin/sh
# Roda DENTRO do container "monitor" (ver infra/compose/docker-compose.prod.yml).
#
# Monitoramento básico, sem dependência externa: a cada MONITOR_INTERVAL_SEGUNDOS
# (default 300) checa (1) /health/ready da API, (2) se existe um backup do
# Postgres recente e (3) o uso de disco do volume de backups — cada checagem
# vira uma linha de JSON em stdout (o driver de log do Docker cuida da
# rotação, ver "logging:" no compose).
#
# Isso NÃO manda alerta pra lugar nenhum sozinho — é grep/observação manual
# (docker compose logs -f monitor) ou agregação por quem coletar os logs do
# host. Ver infra/OPERACOES.md pra ideias de próximo passo (webhook, Grafana
# Alloy, etc.).
set -eu

API_URL="${MONITOR_API_URL:-http://api:8000/health/ready}"
BACKUP_DIR="${MONITOR_BACKUP_DIR:-/backups}"
# Backup roda a cada BACKUP_INTERVAL_HORAS (default 24) — 30h dá folga sem
# disparar falso alerta por causa de atraso de alguns minutos no ciclo.
BACKUP_MAX_IDADE_HORAS="${MONITOR_BACKUP_MAX_IDADE_HORAS:-30}"
INTERVALO_SEGUNDOS="${MONITOR_INTERVAL_SEGUNDOS:-300}"

log() {
  # $1=status(ok|alerta) $2=nome_da_checagem $3=resto_do_json_sem_chaves
  timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "{\"timestamp\":\"$timestamp\",\"status\":\"$1\",\"check\":\"$2\",$3}"
}

checar_api() {
  if resposta="$(curl -fsS -m 5 "$API_URL" 2>&1)"; then
    log "ok" "api_ready" "\"response\":$resposta"
  else
    detalhe="$(echo "$resposta" | tr -d '\n"' | cut -c1-200)"
    log "alerta" "api_ready" "\"erro\":\"$detalhe\""
  fi
}

checar_backup() {
  ultimo="$(ls -t "$BACKUP_DIR"/zapfood_*.sql.gz 2>/dev/null | head -1)"
  if [ -z "$ultimo" ]; then
    log "alerta" "backup_recente" "\"detalhe\":\"nenhum backup encontrado em $BACKUP_DIR\""
    return
  fi
  epoch="$(date -r "$ultimo" +%s)"
  agora="$(date +%s)"
  idade_horas=$(((agora - epoch) / 3600))
  if [ "$idade_horas" -gt "$BACKUP_MAX_IDADE_HORAS" ]; then
    log "alerta" "backup_recente" "\"arquivo\":\"$(basename "$ultimo")\",\"idade_horas\":$idade_horas"
  else
    log "ok" "backup_recente" "\"arquivo\":\"$(basename "$ultimo")\",\"idade_horas\":$idade_horas"
  fi
}

checar_disco() {
  uso_pct="$(df -P "$BACKUP_DIR" | awk 'NR==2 { gsub("%",""); print $5 }')"
  if [ "$uso_pct" -ge 90 ]; then
    log "alerta" "disco_backups" "\"uso_percentual\":$uso_pct"
  else
    log "ok" "disco_backups" "\"uso_percentual\":$uso_pct"
  fi
}

while true; do
  checar_api
  checar_backup
  checar_disco
  sleep "$INTERVALO_SEGUNDOS"
done
