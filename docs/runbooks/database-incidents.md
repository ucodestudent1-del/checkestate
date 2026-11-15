# Database Incident Runbook

## Overview
This runbook covers common database incidents and their resolution procedures.

## Severity Levels
- **SEV-1**: Complete database outage, data loss risk
- **SEV-2**: Degraded performance, partial functionality
- **SEV-3**: Minor issues, non-critical functionality affected

---

## SEV-1: Database Connection Failure

### Symptoms
- Application returns 503 errors
- Health check endpoint returns "unhealthy" for database
- Connection pool exhausted errors in logs

### Diagnosis
```bash
# Check database connectivity
pg_isready -h $DB_HOST -U $DB_USER -d $DB_NAME

# Check connection count
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT count(*) FROM pg_stat_activity;"

# Check for long-running queries
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC;"
```

### Resolution
1. **If connection pool exhausted**:
   - Restart application servers to release connections
   - Increase connection pool size if needed
   - Kill idle connections: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND now() - state_change > interval '10 minutes';`

2. **If database is down**:
   - Check cloud provider status page
   - Failover to read replica if available
   - Restore from latest backup if data corruption

3. **If max_connections reached**:
   - Increase `max_connections` in PostgreSQL config (requires restart)
   - Or tune application connection pools

### Post-Incident
- Document root cause
- Update connection pool sizing
- Add monitoring alerts for connection count > 80% max

---

## SEV-2: Slow Query Performance

### Symptoms
- API response times > 2s
- Health check shows "degraded" for database
- High CPU on database server

### Diagnosis
```bash
# Find slow queries
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;"

# Check index usage
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;"
```

### Resolution
1. **Add missing indexes** based on query patterns
2. **Update table statistics**: `ANALYZE;`
3. **Rewrite problematic queries** (avoid N+1, add proper WHERE clauses)
4. **Consider partitioning** for large tables (>100GB)

### Post-Incident
- Add query performance monitoring
- Schedule regular `ANALYZE` via cron
- Review slow query log weekly

---

## SEV-2: Disk Space Critical

### Symptoms
- Disk usage > 90%
- WAL files accumulating
- Autovacuum not running

### Diagnosis
```bash
# Check disk usage
df -h /var/lib/postgresql

# Check database sizes
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT pg_size_pretty(pg_database_size(datname)) AS size, datname
FROM pg_database
ORDER BY pg_database_size(datname) DESC;"

# Check table sizes
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;"
```

### Resolution
1. **Immediate**: Run `VACUUM FULL` on largest tables (requires exclusive lock)
2. **Short-term**: Enable/disable autovacuum settings
3. **Long-term**: Implement partitioning, archive old data, add storage

### Post-Incident
- Set up disk usage alerts at 70%, 80%, 90%
- Schedule regular `VACUUM ANALYZE`
- Implement data retention policies

---

## SEV-3: Migration Failure

### Symptoms
- Migration stuck or failed
- Schema drift detected
- Application errors after deploy

### Diagnosis
```bash
# Check migration status
npx prisma migrate status

# Check failed migration
cat prisma/migrations/<migration_name>/migration.sql

# Check for locks
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT pid, usename, query, state, now() - query_start AS duration
FROM pg_stat_activity
WHERE state != 'idle' AND query LIKE '%migration%';"
```

### Resolution
1. **If migration failed**:
   - Fix migration SQL manually
   - Run `npx prisma migrate resolve --applied <migration_name>`
   - Or rollback: `npx prisma migrate resolve --rolled-back <migration_name>`

2. **If schema drift**:
   - Generate new migration: `npx prisma migrate dev --name fix_drift`
   - Apply carefully in staging first

3. **If locked**:
   - Kill blocking queries
   - Retry migration

### Post-Incident
- Add pre-deploy migration checks to CI
- Test migrations on production-sized data in staging
- Document destructive migration patterns to avoid

---

## Contacts
- **Primary On-Call**: [Name] - [Phone] - [Slack]
- **Secondary On-Call**: [Name] - [Phone] - [Slack]
- **DBA**: [Name] - [Phone] - [Slack]
- **Engineering Lead**: [Name] - [Phone] - [Slack]

## Escalation
1. On-call acknowledges within 15 min
2. If not resolved in 30 min, escalate to secondary
3. If not resolved in 1 hour, escalate to engineering lead
4. If data loss risk, escalate to DBA immediately

## Useful Commands
```bash
# Connect to production database
psql "postgresql://$DB_USER:$DB_PASS@$DB_HOST:5432/$DB_NAME"

# View current activity
watch -n 2 "psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME -c 'SELECT pid, state, query FROM pg_stat_activity WHERE state != '\''idle'\'''"

# Check replication lag (if using replicas)
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT * FROM pg_stat_replication;"

# Manual vacuum
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "VACUUM (ANALYZE, VERBOSE) <table_name>;"
```