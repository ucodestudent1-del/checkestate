#!/bin/bash
# Database Backup Script
# Usage: ./scripts/backup.sh [full|incremental]

set -e

BACKUP_TYPE=${1:-full}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_NAME="${DB_NAME:-checkestate}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

case $BACKUP_TYPE in
  full)
    echo "Starting full backup..."
    pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
      --no-owner --no-privileges --format=custom \
      --file="$BACKUP_DIR/checkestate_full_${TIMESTAMP}.dump"
    
    # Compress
    gzip "$BACKUP_DIR/checkestate_full_${TIMESTAMP}.dump"
    
    echo "Full backup completed: $BACKUP_DIR/checkestate_full_${TIMESTAMP}.dump.gz"
    ;;
    
  incremental)
    echo "Starting incremental backup (WAL archiving)..."
    # This requires WAL archiving to be configured in PostgreSQL
    # pg_basebackup -h "$DB_HOST" -U "$DB_USER" -D "$BACKUP_DIR/incremental_${TIMESTAMP}" -Ft -z -P
    echo "Incremental backup requires WAL archiving setup. See docs for configuration."
    ;;
    
  schema)
    echo "Backing up schema only..."
    pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
      --schema-only --no-owner --no-privileges \
      --file="$BACKUP_DIR/checkestate_schema_${TIMESTAMP}.sql"
    
    gzip "$BACKUP_DIR/checkestate_schema_${TIMESTAMP}.sql"
    echo "Schema backup completed: $BACKUP_DIR/checkestate_schema_${TIMESTAMP}.sql.gz"
    ;;
    
  *)
    echo "Usage: ./scripts/backup.sh [full|incremental|schema]"
    exit 1
    ;;
esac

# Cleanup old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "checkestate_*.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup process completed"