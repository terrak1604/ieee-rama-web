#!/usr/bin/env bash
# ============================================================
#  IEEE Rama Estudiantil UNMSM — Script de Deploy a Producción
#  Requisitos: git, docker compose v2, .env configurado
#  Uso: ./scripts/deploy.sh
# ============================================================
set -euo pipefail

echo "🚀 Iniciando deploy IEEE Rama UNMSM..."

# ── 1. Verificar que existe .env ──────────────────────────
if [ ! -f .env ]; then
  echo "❌ Falta el archivo .env. Copia .env.example y completa los valores."
  exit 1
fi

# ── 2. Hacer backup antes de cualquier cambio ─────────────
echo "📦 Realizando backup previo..."
bash ./scripts/backup.sh

# ── 3. Actualizar código ──────────────────────────────────
echo "⬇️  Descargando últimos cambios..."
git pull origin main --ff-only

# ── 4. Rebuild y restart de contenedores ─────────────────
echo "🐳 Reconstruyendo contenedores Docker..."
docker compose pull
docker compose build --no-cache backend
docker compose up -d --remove-orphans

# ── 5. Esperar healthcheck ────────────────────────────────
echo "⏳ Esperando que el backend esté listo..."
MAX_WAIT=60
ELAPSED=0
until docker compose exec backend wget -q --spider http://localhost:3000/api/health 2>/dev/null; do
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "❌ El backend no respondió en ${MAX_WAIT}s. Ver logs:"
    docker compose logs --tail=30 backend
    exit 1
  fi
done

echo "✅ Backend activo"

# ── 6. Limpiar imágenes Docker antiguas ───────────────────
docker image prune -f

echo "🎉 Deploy completado exitosamente."
echo "   URL: ${SITE_URL:-https://ieee-unmsm.org}"
