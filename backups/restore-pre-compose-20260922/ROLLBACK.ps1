# Rollback: volver al estado pre-compose (22/09/2026)

# 1. Código
git checkout restore-pre-compose-20260922

# 2. Red manual
docker network create crm-network 2>$null

# 3. Parar stack compose actual (mantener datos en volúmenes)
docker compose down

# 4. Reconectar datos a ambas redes
docker run -d --name restore-tmp --network crm-network alpine sleep 5
docker network connect crm-network crm-postgres
docker network connect crm-network crm-redis
docker rm -f restore-tmp

# 5. API/Web huérfanos (imágenes de respaldo)
docker rm -f crm-api crm-web 2>$null
docker run -d --name crm-api --network crm-network -p 3001:3001 restore-pre-compose-crm-api
docker run -d --name crm-web --network crm-network -p 8081:80 restore-pre-compose-crm-web

# 6. Stack base (postgres/redis/minio/worker) vuelve por compose
docker compose up -d postgres redis minio worker

# Verificación
docker ps --filter "name=crm-"
docker exec crm-api node -e "require('dns').lookup('minio',(e,a)=>console.log(e?e.code:a))"
