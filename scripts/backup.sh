#!/usr/bin/env bash
# ============================================================
#  IEEE Rama Estudiantil UNMSM — Script de Backup
#  Uso: ./scripts/backup.sh [destino_remoto]
# ============================================================
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_LOCAL_DIR:-./backups}"
DB_SOURCE="${DB_PATH:-./backend/database.sqlite}"
UPLOADS_SOURCE="./backend/uploads"

mkdir -p "$BACKUP_DIR"

# ── 1. Backup de la base de datos SQLite ──────────────────
DB_BACKUP="$BACKUP_DIR/database_${TIMESTAMP}.sqlite"
if [ -f "$DB_SOURCE" ]; then
  # sqlite3 .backup es seguro con la BD en uso (no corrompe)
  sqlite3 "$DB_SOURCE" ".backup '$DB_BACKUP'"
  echo "✅ DB backup: $DB_BACKUP"
else
  echo "⚠️  Base de datos no encontrada en $DB_SOURCE"
fi

# ── 2. Backup de uploads (imágenes subidas) ───────────────
UPLOADS_BACKUP="$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"
if [ -d "$UPLOADS_SOURCE" ]; then
  tar -czf "$UPLOADS_BACKUP" -C "$(dirname "$UPLOADS_SOURCE")" "$(basename "$UPLOADS_SOURCE")"
  echo "✅ Uploads backup: $UPLOADS_BACKUP"
fi

# ── 3. Limpieza de backups más antiguos de 30 días ────────
find "$BACKUP_DIR" -name "*.sqlite" -mtime +30 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete 2>/dev/null || true
echo "🧹 Backups anteriores a 30 días eliminados"

# ── 4. Sincronización remota opcional ─────────────────────
REMOTE="${1:-}"
if [ -n "$REMOTE" ]; then
  rsync -avz --delete "$BACKUP_DIR/" "$REMOTE"
  echo "📤 Backup sincronizado a: $REMOTE"
fi

echo "✅ Backup completado: $TIMESTAMP"
