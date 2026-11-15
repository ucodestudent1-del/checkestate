#!/bin/bash
# Database Migration Script
# Usage: ./scripts/migrate.sh [up|down|status|create <name>]

set -e

COMMAND=${1:-up}
MIGRATION_NAME=${2:-}

case $COMMAND in
  up)
    echo "Running migrations up..."
    npx prisma migrate deploy
    ;;
  down)
    echo "Rolling back last migration..."
    npx prisma migrate resolve --rolled-back $(npx prisma migrate status --json | jq -r '.applied[-1].migration_name')
    ;;
  status)
    echo "Migration status:"
    npx prisma migrate status
    ;;
  create)
    if [ -z "$MIGRATION_NAME" ]; then
      echo "Error: Migration name required"
      echo "Usage: ./scripts/migrate.sh create <migration_name>"
      exit 1
    fi
    echo "Creating migration: $MIGRATION_NAME"
    npx prisma migrate dev --name "$MIGRATION_NAME"
    ;;
  reset)
    echo "Resetting database (WARNING: This will delete all data)..."
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      npx prisma migrate reset --force
    fi
    ;;
  *)
    echo "Usage: ./scripts/migrate.sh [up|down|status|create|reset]"
    exit 1
    ;;
esac