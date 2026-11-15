#!/bin/bash
# Database Restore Script
# Usage: ./scripts/restore.sh <backup_file> [target_db]

set -e

BACKUP_FILE=${1:-}
TARGET_DB=${2:-checkestate_restore_$(date +"%Y%m%d_%H%M%S")}

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./scripts/restore.sh <backup_file> [target_db]"
  echo "Example: ./scripts/restore.sh /backups/checkestate_full_20240115_020000.dump.gz"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Restoring from: $BACKUP_FILE"
echo "Target database: $TARGET_DB"

# Create target database if it doesn't exist
psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "CREATE DATABASE $TARGET_DB;" 2>/dev/null || true

# Restore
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "Decompressing and restoring..."
  gunzip -c "$BACKUP_FILE" | pg_restore -h "$DB_HOST" -U "$DB_USER" -d "$TARGET_DB" --no-owner --no-privileges
else
  echo "Restoring..."
  pg_restore -h "$DB_HOST" -U "$DB_USER" -d "$TARGET_DB" --no-owner --no-privileges "$BACKUP_FILE"
fi

# Run migrations to ensure schema is up to date
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:5432/$TARGET_DB" npx prisma migrate deploy

echo "Restore completed successfully"
echo "Database: $TARGET_DB"
echo "Verify data integrity before promoting to production"