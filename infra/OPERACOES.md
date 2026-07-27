# Operação — zapFood

Runbook mínimo pra operar a stack de produção (Oracle Cloud, Docker Compose).
Para como o deploy funciona por dentro, ver os comentários em
`infra/scripts/*.sh` e `.github/workflows/ci-cd.yml` — este documento é só
"o que rodar quando precisar fazer X".

Todos os comandos abaixo assumem: conectado por SSH no servidor, dentro de
`$APP_DIR` (default `/opt/zapfood`), com `.env.production` já preenchido.

```bash
COMPOSE="docker compose -f infra/compose/docker-compose.prod.yml --env-file .env.production"
```

## Primeiro deploy num servidor novo

CI só atualiza `api worker frontend admin kds proxy` (ver `infra/scripts/ci-deploy.sh`) —
o resto (`db redis rabbitmq backup monitor certbot`) precisa subir manualmente
uma vez:

1. Clonar o repo, copiar `.env.production.example` → `.env.production` e preencher.
2. `./infra/scripts/deploy.sh` (builda tudo local e sobe a stack inteira).
3. `./infra/scripts/init-letsencrypt.sh` (emite os certificados TLS — só uma vez).

Dali em diante, todo push em `main` faz o CI atualizar os serviços de app
sozinho (ver `.github/workflows/ci-cd.yml`).

## Ver status e logs

```bash
$COMPOSE ps
$COMPOSE logs -f api          # -f segue em tempo real; sem -f só mostra o que já rodou
$COMPOSE logs --since 1h worker
```

Logs da API/worker saem em JSON (uma linha por evento — ver
`app/core/logging_config.py`); dá pra filtrar com `jq`:

```bash
$COMPOSE logs api | grep -o '{.*}' | jq 'select(.level=="ERROR")'
```

Rotação é automática (driver `json-file` do Docker, 10MB × 5 arquivos por
container — ver `x-logging` no topo do compose). Não precisa de logrotate.

## Backup do Postgres

Roda sozinho a cada `BACKUP_INTERVAL_HORAS` (default 24h), guarda em
`/backups` dentro do container `backup` (volume `zapfood_backups_prod`),
apaga o que passar de `BACKUP_RETENTION_DIAS` (default 14 dias).

```bash
# Backup manual, sem esperar o ciclo:
$COMPOSE exec backup sh /scripts/backup-postgres.sh --once

# Listar backups existentes:
$COMPOSE exec backup ls -lh /backups

# Copiar um backup pro seu computador (rodar no seu computador, não no servidor):
scp usuario@servidor:/var/lib/docker/volumes/zapfood_backups_prod/_data/zapfood_XXXXXXXX.sql.gz .
```

### Restaurar um backup

**Isso sobrescreve o banco atual.** `infra/scripts/restore-postgres.sh` pede
confirmação antes de continuar, para a API/worker durante a restauração e
sobe de novo no final:

```bash
./infra/scripts/restore-postgres.sh /caminho/para/zapfood_20260101T000000Z.sql.gz
```

## Monitoramento

O container `monitor` roda a cada `MONITOR_INTERVAL_SEGUNDOS` (default 5min)
e loga em JSON: saúde de `/health/ready` da API, idade do último backup e uso
de disco do volume de backups.

```bash
$COMPOSE logs -f monitor
$COMPOSE logs monitor | grep -o '{.*}' | jq 'select(.status=="alerta")'
```

Isso é observação passiva (grep/log) — não dispara alerta em lugar nenhum
sozinho. Ver "Melhorias futuras" no resumo da auditoria pra ideias de próximo
passo (webhook, Prometheus/Grafana, etc.).

Healthchecks do próprio Docker (`$COMPOSE ps` mostra `healthy`/`unhealthy`)
cobrem o restart automático de cada serviço — isso já funciona independente
do container `monitor`, que serve só pra visibilidade.

## Rollback

Deploy via CI já faz rollback sozinho se o health check pós-deploy falhar
(ver `infra/scripts/ci-deploy.sh`). Pra reverter manualmente pra uma tag
específica:

```bash
IMAGE_TAG=<sha-do-commit-anterior> $COMPOSE pull migrate api worker frontend admin kds proxy
IMAGE_TAG=<sha-do-commit-anterior> $COMPOSE up -d api worker frontend admin kds proxy
```

Rollback de código nunca desfaz uma migração de banco já aplicada — se o
commit problemático incluiu uma migração, avalie um `alembic downgrade`
manual (dentro do container `api`/`migrate`) antes ou depois de reverter o
código, conforme o que a migração mudou.

## Reiniciar um serviço específico

```bash
$COMPOSE restart api
```

Todo serviço de longa duração usa `restart: unless-stopped` — volta sozinho
depois de crash ou reboot do host. O único que não é `unless-stopped` é
`migrate`, que roda uma vez e termina (`restart: "no"`) — comportamento
esperado, não é bug se ele aparecer como "Exited (0)" no `ps`.

## Secrets

Nunca commitar `.env.production` (já está no `.gitignore`). Credenciais do
deploy (chave SSH, host, etc.) ficam em GitHub Secrets — ver o job `deploy`
em `.github/workflows/ci-cd.yml` pra lista completa.
