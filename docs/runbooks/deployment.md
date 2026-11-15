# Deployment Runbook

## Overview
This runbook covers the deployment process for CheckEstate application.

## Deployment Pipeline

### Stages
1. **CI Pipeline** (GitHub Actions)
   - Lint → Type Check → Security Audit → Unit Tests → Integration Tests → Build
   
2. **Preview Deployment** (Pull Requests)
   - Automatic Vercel preview deployment
   - E2E tests against preview URL

3. **Production Deployment** (Main Branch)
   - Automatic Vercel production deployment
   - Post-deploy health checks

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All CI checks pass (lint, typecheck, tests)
- [ ] No security audit failures
- [ ] Test coverage > 80%
- [ ] No console.log/debugger in production code

### Database
- [ ] Migrations reviewed and tested in staging
- [ ] No destructive migrations (DROP TABLE, DROP COLUMN) without data migration plan
- [ ] Migration tested on production-sized data in staging
- [ ] Rollback plan documented for each migration

### Configuration
- [ ] Environment variables set in Vercel
- [ ] Secrets rotated if needed (Stripe, Resend, Sentry)
- [ ] Feature flags configured
- [ ] Stripe webhook URLs updated for new deployment

### Monitoring
- [ ] Sentry release created
- [ ] Health check endpoint responding
- [ ] Alerting rules updated for new features

---

## Deployment Commands

### Manual Deployment (if needed)
```bash
# Build locally to verify
npm run build

# Deploy to Vercel preview
npx vercel --token=$VERCEL_TOKEN

# Deploy to production
npx vercel --prod --token=$VERCEL_TOKEN
```

### Database Migration
```bash
# Apply migrations (run before deployment if possible)
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status

# Generate new migration (development only)
npx prisma migrate dev --name descriptive_name
```

---

## Post-Deployment Verification

### Automated Checks (run within 5 min of deploy)
```bash
# Health check
curl -f https://checkestate.app/api/health

# Key API endpoints
curl -f https://checkestate.app/api/properties
curl -f https://checkestate.app/api/health

# Authentication flow
curl -X POST https://checkestate.app/api/auth/callback/credentials \
  -d "email=test@example.com&password=test"
```

### Manual Verification (within 30 min)
- [ ] Login works for all roles (owner, manager, tenant, contractor)
- [ ] Create property → create unit → create maintenance request
- [ ] Work order status progression
- [ ] Contractor portal access
- [ ] Stripe checkout flow
- [ ] Email notifications sending
- [ ] File upload working

### Monitoring Verification
- [ ] Sentry receiving events
- [ ] No new error spikes in Sentry
- [ ] Response times normal in Vercel analytics
- [ ] Database connections stable
- [ ] No alert firing in PagerDuty/Opsgenie

---

## Rollback Procedure

### Vercel Rollback (Instant)
1. Go to Vercel Dashboard → Deployments
2. Click "..." on previous deployment → "Promote to Production"
2. Verify health check passes

### Database Rollback (If migration caused issues)
```bash
# 1. Identify migration to rollback
npx prisma migrate status

# 2. Rollback migration
npx prisma migrate resolve --rolled-back <migration_name>

# 3. If data migration needed, restore from backup
./scripts/restore.sh /backups/checkestate_full_20240115_020000.dump.gz checkestate_rollback

# 4. Switch DNS/database connection to rollback DB
# Update DATABASE_URL in Vercel environment variables
```

### Full Rollback Checklist
- [ ] Vercel deployment rolled back
- [ ] Database schema compatible with rolled-back code
- [ ] Environment variables correct
- [ ] Health checks passing
- [ ] Key user flows working
- [ ] Team notified of rollback

---

## Emergency Contacts
- **Release Manager**: [Name] - [Phone] - [Slack]
- **On-Call Engineer**: [Name] - [Phone] - [Slack]
- **DBA**: [Name] - [Phone] - [Slack]
- **Engineering Lead**: [Name] - [Phone] - [Slack]

## Communication
- Post deployment status in #deployments Slack channel
- Update incident channel if issues detected
- Send all-clear message when verified

## Post-Deployment (24 hours)
- [ ] Review Sentry for new errors
- [ ] Check database performance metrics
- [ ] Review user feedback/support tickets
- [ ] Update deployment metrics dashboard