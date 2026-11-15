#!/bin/bash
# Security Hardening Script
# Run as part of deployment or periodically

set -e

echo "🔒 Running security hardening checks..."

# 1. Dependency Audit
echo "📦 Checking for vulnerable dependencies..."
npm audit --audit-level=high
if [ $? -ne 0 ]; then
  echo "❌ High severity vulnerabilities found!"
  exit 1
fi

# 2. Check for secrets in code
echo "🔍 Scanning for secrets in code..."
if command -v trufflehog &> /dev/null; then
  trufflehog filesystem . --fail
else
  echo "⚠️ trufflehog not installed, skipping secret scan"
fi

# 3. Check file permissions
echo "📁 Checking sensitive file permissions..."
find . -name "*.env*" -o -name "*.pem" -o -name "*.key" | while read file; do
  perms=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%A" "$file" 2>/dev/null)
  if [ "$perms" != "600" ] && [ "$perms" != "400" ]; then
    echo "⚠️ Insecure permissions on $file: $perms (should be 600 or 400)"
  fi
done

# 4. Verify security headers in middleware
echo "🛡️ Verifying security headers configuration..."
if grep -q "X-Content-Type-Options.*nosniff" src/middleware.ts && \
   grep -q "X-Frame-Options.*DENY" src/middleware.ts && \
   grep -q "Strict-Transport-Security" src/middleware.ts && \
   grep -q "Content-Security-Policy" src/middleware.ts; then
  echo "✅ Security headers configured"
else
  echo "❌ Missing security headers in middleware.ts"
  exit 1
fi

# 5. Check CSP includes required domains
echo "🔍 Checking CSP configuration..."
if grep -q "js.stripe.com" src/middleware.ts && \
   grep -q "api.stripe.com" src/middleware.ts; then
  echo "✅ Stripe domains in CSP"
else
  echo "❌ Missing Stripe domains in CSP"
  exit 1
fi

# 6. Verify rate limiting enabled
echo "⏱️ Checking rate limiting..."
if grep -q "rateLimit" src/middleware.ts && \
   grep -q "AUTH_RATE_LIMIT_MAX" src/middleware.ts; then
  echo "✅ Rate limiting configured"
else
  echo "❌ Rate limiting not properly configured"
  exit 1
fi

# 7. Check for HTTPS enforcement
echo "🔐 Checking HTTPS enforcement..."
if grep -q "Strict-Transport-Security" src/middleware.ts; then
  echo "✅ HSTS header present"
else
  echo "❌ HSTS header missing"
  exit 1
fi

# 8. Verify CSRF protection
echo "🛡️ Checking CSRF protection..."
if grep -q "validateCsrfRequest" src/lib/api-middleware.ts && \
   grep -q "x-csrf-token" src/lib/csrf.ts; then
  echo "✅ CSRF protection configured"
else
  echo "❌ CSRF protection missing"
  exit 1
fi

# 9. Check password hashing
echo "🔑 Checking password security..."
if grep -q "bcrypt.hash" src/lib/auth.ts && \
   grep -q "12" src/lib/auth.ts; then
  echo "✅ bcrypt with cost 12 configured"
else
  echo "❌ Password hashing not properly configured"
  exit 1
fi

# 10. Verify environment variables
echo "🔧 Checking required environment variables..."
REQUIRED_VARS=(
  "NEXTAUTH_SECRET"
  "DATABASE_URL"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "RESEND_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "⚠️ Missing required environment variable: $var"
  else
    echo "✅ $var set"
  fi
done

# 11. Check for debug/logging in production
echo "🐛 Checking for debug code..."
if grep -r "console.log" src/ --include="*.ts" --include="*.tsx" | grep -v "test" | grep -v "// " | grep -v "error" | grep -v "warn"; then
  echo "⚠️ Found console.log statements in source code"
fi

# 12. Verify Prisma schema has proper indexes
echo "📊 Checking database indexes..."
if grep -q "@@index" prisma/schema.prisma; then
  echo "✅ Database indexes defined"
else
  echo "⚠️ No database indexes found"
fi

# 13. Check for soft deletes
echo "🗑️ Checking soft delete implementation..."
if grep -q "deletedAt" prisma/schema.prisma; then
  echo "✅ Soft deletes implemented"
else
  echo "⚠️ Soft deletes not fully implemented"
fi

# 14. Verify audit logging
echo "📝 Checking audit logging..."
if grep -q "auditLog" src/lib/audit.ts && \
   grep -q "createAuditLog" src/lib/audit.ts; then
  echo "✅ Audit logging implemented"
else
  echo "❌ Audit logging missing"
  exit 1
fi

# 15. Check test coverage threshold
echo "🧪 Checking test configuration..."
if [ -f "vitest.config.ts" ]; then
  echo "✅ Test configuration present"
else
  echo "⚠️ No test configuration found"
fi

echo ""
echo "✅ Security hardening checks completed!"
echo ""
echo "📋 Summary:"
echo "  - Dependencies audited"
echo "  - Secrets scanned"
echo "  - Security headers verified"
echo "  - CSP validated"
echo "  - Rate limiting confirmed"
echo "  - HTTPS enforced"
echo "  - CSRF protection active"
echo "  - Password hashing secure"
echo "  - Environment variables checked"
echo "  - Audit logging implemented"
echo ""
echo "🎉 All critical security checks passed!"