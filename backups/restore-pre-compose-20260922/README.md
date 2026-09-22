# Punto de restauración: pre-compose (2026-09-22)

## Contexto
- crm-api y crm-web eran huérfanos de Compose (`docker run --network crm-network`)
- Stack base (postgres, redis, minio, worker) en `crm_default` (Compose)
- postgres/redis conectados también a `crm-network`
- MinIO **no** resolvía desde crm-api (EAI_AGAIN) — uploads rotos

## Qué contiene este backup
- `*.json` — `docker inspect` de cada contenedor crm-*
- `networks.json` — inspect de crm-network y crm_default
- `images.txt` — IDs de imágenes crm
- `compose-ps.json` — estado Compose al momento del backup
- `ROLLBACK.ps1` — script de reversión

## Imágenes de respaldo
- `restore-pre-compose-crm-api`
- `restore-pre-compose-crm-web`
- `restore-pre-compose-crm-worker`

## Git
- Tag: `restore-pre-compose-20260922`
