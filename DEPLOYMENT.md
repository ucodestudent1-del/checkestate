# CheckEstate Deployment Guide

This guide will help you deploy CheckEstate to Railway (or any Docker-compatible platform).

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Deployment Steps](#deployment-steps)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Overview

CheckEstate is a Next.js 16 application with PostgreSQL database, designed to be deployed on any Docker-compatible platform including Railway, Render, AWS ECS, Google Cloud Run, or DigitalOcean App Platform.

## Prerequisites

Before deploying, ensure you have:

1. **A railway.app account** (or alternative hosting provider)
2. **A PostgreSQL database** (Railway provides managed PostgreSQL)
3. **A Stripe account** (for payments)
4. **An email service provider** (Resend, SendGrid, or AWS SES)
5. **A domain name** (optional, for production)

## Deployment Steps

### Option 1: Deploy to Railway (Recommended)

#### Step 1: Connect Your Repository

1. Go to [Railway.app](https://railway.app) and create an account
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your CheckEstate repository
4. Railway will automatically detect the Dockerfile

#### Step 2: Add PostgreSQL Database

1. In the Railway dashboard, click "Add Service"
2. Select "Database" → "PostgreSQL"
3. Wait for the database to be provisioned
4. Railway will automatically set the `DATABASE_URL` environment variable

#### Step 3: Configure Environment Variables

In the Railway dashboard, go to your project's **Variables** tab and add the following:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Provided by Railway automatically |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js sessions | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your application URL | `https://your-app.railway.app` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |
| `RESEND_API_KEY` | Resend API key | `re_...` |
| `EMAIL_FROM` | From email address | `noreply@yourdomain.com` |
| `S3_ACCESS_KEY_ID` | S3/R2 access key | `your-access-key` |
| `S3_SECRET_ACCESS_KEY` | S3/R2 secret key | `your-secret-key` |
| `S3_BUCKET` | S3 bucket name | `checkestate-uploads` |
| `S3_REGION` | S3 region | `us-east-1` |
| `S3_ENDPOINT` | S3 endpoint (for R2) | `https://your-r2-endpoint.com` |
| `SENTRY_DSN` | Sentry DSN (optional) | `https://...` |

#### Step 4: Deploy

1. Click "Deploy" in the Railway dashboard
2. Wait for the build to complete
3. Your application will be available at `https://your-app.railway.app`

### Option 2: Deploy to Other Platforms

The Dockerfile is configured for any Docker-compatible platform:

- **AWS ECS/Fargate**
- **Google Cloud Run**
- **DigitalOcean App Platform**
- **Render**
- **Fly.io**
- **Heroku**

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Yes | NextAuth session secret | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Your application URL | `https://checkestate.app` |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook secret | `whsec_...` |
| `RESEND_API_KEY` | Yes | Email service API key | `re_...` |
| `EMAIL_FROM` | Yes | From email address | `noreply@yourdomain.com` |
| `S3_ACCESS_KEY_ID` | No | S3/R2 access key | `your-access-key` |
| `S3_SECRET_ACCESS_KEY` | No | S3/R2 secret key | `your-secret-key` |
| `S3_BUCKET` | No | S3 bucket name | `checkestate-uploads` |
| `S3_REGION` | No | S3 region | `us-east-1` |
| `S3_ENDPOINT` | No | S3 endpoint (for R2) | `https://your-r2-endpoint.com` |
| `SENTRY_DSN` | No | Error monitoring DSN | `https://...` |
| `FREE_TRIAL_ENABLED` | No | Enable free trials | `true` |
| `FREE_TRIAL_DAYS` | No | Free trial duration | `14` |

## Database Setup

### Option 1: Railway PostgreSQL (Recommended)

1. Add PostgreSQL service in Railway dashboard
2. Railway will automatically set `DATABASE_URL`
3. Run migrations: `npx prisma migrate deploy`

### Option 2: External PostgreSQL

1. Set `DATABASE_URL` environment variable
2. Run migrations: `npx prisma migrate deploy`

### Database Schema

The application uses Prisma ORM with the following main entities:
- **User**: User accounts and authentication
- **Organization**: Multi-tenant organizations
- **Property**: Rental properties
- **Unit**: Individual units within properties
- **Tenant**: Tenant information
- **MaintenanceRequest**: Maintenance requests from tenants
- **WorkOrder**: Work orders for contractors
- **Contractor**: Contractor information
- **MaintenanceExpense**: Maintenance expenses

## Post-Deployment

### 1. Run Database Migrations

After deployment, run database migrations:

```bash
npx prisma migrate deploy
```

Or use the Railway CLI:
```bash
railway run npx prisma migrate deploy
```

### 2. Verify Deployment

1. Visit your application URL
2. Register a new account
3. Verify email confirmation
4. Create a property and unit
5. Submit a maintenance request
6. Verify email notifications

### 3. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.railway.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

## Troubleshooting

### Build Fails
- Check that all environment variables are set
- Verify `DATABASE_URL` is correct
- Check build logs for specific errors

### Database Connection Fails
- Verify `DATABASE_URL` is correct
- Ensure database is running and accessible
- Check firewall rules

### Email Not Sending
- Verify `RESEND_API_KEY` is correct
- Check email sending limits
- Verify domain verification in Resend

### Payments Not Working
- Verify `STRIPE_SECRET_KEY` is correct
- Check webhook configuration in Stripe dashboard
- Verify webhook URL is accessible

## Monitoring

- Use **Sentry** for error tracking (configure `SENTRY_DSN`)
- Use **Railway metrics** for performance monitoring
- Check application logs in Railway dashboard

## Support

For deployment issues, check:
1. Railway documentation: https://docs.railway.app
2. Next.js deployment docs: https://nextjs.org/docs/deployment
3. Prisma deployment docs: https://pris.ly/d/deploy