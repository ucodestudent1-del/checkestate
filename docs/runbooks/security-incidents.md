# Security Incident Runbook

## Overview
This runbook covers security incident response procedures for CheckEstate.

## Incident Classification

### P0 - Critical (Immediate Response)
- Active data breach / unauthorized data access
- Compromised production credentials
- Active attack (SQL injection, RCE, etc.)
- Payment system compromise

### P1 - High (1 Hour Response)
- Suspicious authentication activity (brute force, credential stuffing)
- Vulnerability in dependencies with known exploits
- Unauthorized access to internal systems
- CSRF/XSS vulnerabilities in production

### P2 - Medium (4 Hour Response)
- Security scan findings
- Misconfigured security headers
- Expired certificates
- Weak password policies

### P3 - Low (Next Business Day)
- Security hygiene improvements
- Dependency updates
- Documentation updates

---

## P0: Active Data Breach

### Immediate Actions (First 15 Minutes)
1. **Contain**
   - Revoke compromised API keys/tokens immediately
   - Rotate database passwords
   - Disable affected user accounts
   - Block malicious IPs at WAF/CDN level

2. **Assess**
   - Determine scope: what data accessed, how many users/orgs affected
   - Identify attack vector
   - Preserve logs and evidence

3. **Notify**
   - Alert security team and engineering lead
   - Notify legal/compliance if PII involved
   - Prepare customer communication if needed

### Investigation (First Hour)
```bash
# Check authentication logs
grep -i "failed\|unauthorized\|invalid" /var/log/auth.log | tail -100

# Check database access logs
psql -c "SELECT * FROM pg_stat_activity WHERE state != 'idle';"

# Check for data exfiltration
# Review network egress logs for unusual patterns

# Check application logs for injection attempts
grep -i "union\|select.*from\|drop table\|insert into" /var/log/app.log
```

### Recovery
1. **Rotate all secrets**: Database, Stripe, Resend, Sentry, JWT secrets
2. **Force password reset** for affected users
3. **Audit all admin accounts** for unauthorized changes
4. **Review and update** all IAM policies
5. **Deploy WAF rules** for detected attack patterns

### Post-Incident (Within 24 Hours)
- Complete incident report with timeline
- Root cause analysis
- Customer notification if required by law (GDPR, CCPA)
- Update security controls to prevent recurrence
- Schedule penetration test

---

## P1: Authentication Attacks

### Brute Force / Credential Stuffing
**Detection**:
- High failed login rate from single IP
- Multiple accounts targeted from same IP
- Known credential lists being tested

**Response**:
```bash
# Block attacking IPs at CDN/WAF
# Rate limit already configured in middleware (5 req/15min for auth)

# Check for compromised accounts
psql -c "
SELECT u.email, u.id, COUNT(a.id) as failed_attempts
FROM users u
JOIN audit_logs a ON u.id = a.user_id
WHERE a.action = 'LOGIN' AND a.metadata->>'success' = 'false'
AND a.created_at > NOW() - INTERVAL '1 hour'
GROUP BY u.id
HAVING COUNT(a.id) > 10;
"
```

**Mitigation**:
- Force password reset for targeted accounts
- Enable MFA for all admin accounts
- Add CAPTCHA to login/registration
- Monitor for credential reuse across breaches

### Session Hijacking
**Detection**:
- Multiple sessions from different locations for same user
- Session token reuse anomalies

**Response**:
- Invalidate all sessions for affected user
- Force re-authentication
- Review session security settings (HttpOnly, Secure, SameSite)

---

## P1: Dependency Vulnerabilities

### Detection
- GitHub Dependabot alerts
- `npm audit` failures in CI
- Snyk/OWASP scans

### Response
1. **Assess severity** (CVSS score, exploit availability)
2. **Check if vulnerable code path is reachable**
3. **Patch or mitigate**:
   - Update dependency: `npm update <package>`
   - Apply workaround if update breaks functionality
   - Add WAF rule for known exploit patterns

### Critical Vulnerability Process
1. **Immediate** (CVSS 9-10, active exploit): Deploy patch within 4 hours
2. **High** (CVSS 7-8): Deploy patch within 24 hours
3. **Medium/Low**: Include in next sprint

---

## P2: Security Configuration Issues

### Missing Security Headers
**Detection**: Security scan or manual check
**Response**: Update middleware.ts with proper headers
- CSP, HSTS, X-Frame-Options, X-Content-Type-Options

### Expired Certificates
**Detection**: Monitoring alerts or browser warnings
**Response**: 
- Renew SSL certificate
- Update CDN/load balancer configuration
- Verify HSTS preload status

### Weak Password Policy
**Detection**: Audit or penetration test finding
**Response**: 
- Increase minimum length to 12
- Require uppercase, lowercase, number, special char
- Implement breach detection (HaveIBeenPwned API)

---

## Evidence Preservation

### Do
- Copy relevant logs to secure storage
- Take screenshots of alerts/dashboards
- Document timeline with timestamps
- Preserve database snapshots if data accessed

### Don't
- Modify or delete logs
- Restart services before capturing state
- Share details in unencrypted channels
- Discuss details with unauthorized personnel

---

## Communication Templates

### Internal Alert (Slack)
```
🚨 SECURITY INCIDENT - [P0/P1/P2]
**Type**: [Data Breach / Auth Attack / Vulnerability]
**Status**: [Investigating / Contained / Resolved]
**Scope**: [What systems/data affected]
**Lead**: @[incident-commander]
**Channel**: #security-incident-[id]
```

### Customer Notification (if required)
```
Subject: Important Security Notice - CheckEstate

Dear [Customer],

We are writing to inform you of a security incident that may have affected your account...

What happened: [Brief, non-technical description]
What data was involved: [Specific data types]
What we're doing: [Remediation steps]
What you should do: [Password reset, MFA enable, etc.]
Contact: security@checkestate.app
```

---

## Post-Incident Review (Within 1 Week)

### Incident Report Template
1. **Summary**: What happened, when, duration
2. **Timeline**: Key events with timestamps
3. **Root Cause**: Technical and process failures
4. **Impact**: Users affected, data exposed, downtime
5. **Response**: What worked, what didn't
6. **Action Items**: Specific improvements with owners and deadlines

### Metrics to Track
- Mean Time to Detect (MTTD)
- Mean Time to Respond (MTTR)
- Number of incidents by type/severity
- Recurrence rate

---

## Contacts
- **Security Lead**: [Name] - [Phone] - [Slack]
- **Engineering Lead**: [Name] - [Phone] - [Slack]
- **Legal/Compliance**: [Name] - [Phone] - [Slack]
- **PR/Communications**: [Name] - [Phone] - [Slack]

## External Resources
- **CERT/CC**: https://www.kb.cert.org/
- **NVD**: https://nvd.nist.gov/
- **OWASP**: https://owasp.org/
- **HaveIBeenPwned API**: https://haveibeenpwned.com/API/v3