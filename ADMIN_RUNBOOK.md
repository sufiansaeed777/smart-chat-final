# Smart Chat RAG Platform - Admin Runbook

Operations and troubleshooting guide for system administrators.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Monitoring & Alerts](#monitoring--alerts)
3. [Common Operations](#common-operations)
4. [Troubleshooting](#troubleshooting)
5. [Database Management](#database-management)
6. [Performance Optimization](#performance-optimization)
7. [Security](#security)
8. [Incident Response](#incident-response)
9. [Maintenance Procedures](#maintenance-procedures)

---

## System Architecture

### Components

```
┌─────────────────────────────────────────┐
│         Application Load Balancer        │
│            (Port 80/443)                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│      Auto Scaling Group (1-4 EC2)       │
│         Next.js Application              │
│          (Port 3000)                     │
└─┬──────────┬──────────┬─────────────────┘
  │          │          │
  ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌───────────┐
│  RDS   │ │ Redis  │ │    S3     │
│Postgres│ │ElastiC.│ │  Storage  │
└────────┘ └────────┘ └───────────┘
```

### Services

- **Frontend**: Next.js 14 (React, TypeScript)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 15 (RDS)
- **Cache**: Redis 7 (ElastiCache)
- **Storage**: S3 (File uploads, training data)
- **AI**: OpenAI API (GPT-3.5/GPT-4)
- **Payments**: Stripe

---

## Monitoring & Alerts

### CloudWatch Dashboard

Access: https://console.aws.amazon.com/cloudwatch/

**Key Metrics to Monitor:**

1. **Application Health**
   - ALB Target Health
   - 5XX Error Rate (< 1%)
   - Response Time (< 3s average)
   - Request Count

2. **Database Health**
   - CPU Utilization (< 80%)
   - Free Storage Space (> 5GB)
   - Database Connections (< 80)
   - Read/Write Latency

3. **Cache Health**
   - Redis CPU (< 75%)
   - Memory Usage (< 85%)
   - Cache Hit Ratio (> 70%)
   - Evictions (should be minimal)

4. **System Resources**
   - EC2 CPU Utilization
   - Network In/Out
   - Disk I/O

### CloudWatch Alarms

**Critical Alarms** (immediate action required):
- RDS storage < 5GB
- 5XX error rate > 5%
- All targets unhealthy
- Database connections > 90

**Warning Alarms** (investigate soon):
- CPU > 80%
- Response time > 3s
- Cache memory > 85%

### Log Locations

```bash
# Application logs
/aws/ec2/smart-chat-production

# RDS logs
AWS Console > RDS > Logs

# ALB logs
S3 bucket: smart-chat-alb-logs-{account-id}
```

### Viewing Logs

```bash
# Real-time application logs
aws logs tail /aws/ec2/smart-chat-production --follow

# Filter for errors
aws logs tail /aws/ec2/smart-chat-production --follow --filter-pattern "ERROR"

# Last hour of logs
aws logs tail /aws/ec2/smart-chat-production --since 1h

# Specific time range
aws logs filter-log-events \
  --log-group-name /aws/ec2/smart-chat-production \
  --start-time 1640000000000 \
  --end-time 1640086400000
```

---

## Common Operations

### Deploying New Code

```bash
# 1. SSH into an EC2 instance
aws ssm start-session --target i-xxxxxxxxx

# 2. Navigate to app directory
cd /opt/smart-chat

# 3. Pull latest code
git pull origin main

# 4. Install dependencies (if package.json changed)
npm install

# 5. Build application
npm run build

# 6. Restart application
pm2 restart smart-chat

# 7. Verify deployment
curl http://localhost:3000/api/health

# 8. Check logs
pm2 logs smart-chat
```

### Rolling Deployment (Zero Downtime)

```bash
# 1. Update Auto Scaling Group with new launch template
aws autoscaling update-auto-scaling-group \
  --auto-scaling-group-name smart-chat-asg-production \
  --launch-template LaunchTemplateId=lt-xxx,Version='$Latest'

# 2. Terminate instances one by one
# ASG will automatically replace them with new instances

# Get instance IDs
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names smart-chat-asg-production \
  --query 'AutoScalingGroups[0].Instances[*].InstanceId'

# Terminate one instance at a time
aws autoscaling terminate-instance-in-auto-scaling-group \
  --instance-id i-xxxxxxxxx \
  --should-decrement-desired-capacity

# Wait for new instance to be healthy before terminating next
```

### Scaling Operations

**Manual Scaling**:
```bash
# Scale up
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name smart-chat-asg-production \
  --desired-capacity 4

# Scale down
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name smart-chat-asg-production \
  --desired-capacity 2

# Check status
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names smart-chat-asg-production
```

**Update Auto Scaling Policies**:
```bash
# View current policies
aws autoscaling describe-policies \
  --auto-scaling-group-name smart-chat-asg-production

# Suspend scaling (during maintenance)
aws autoscaling suspend-processes \
  --auto-scaling-group-name smart-chat-asg-production

# Resume scaling
aws autoscaling resume-processes \
  --auto-scaling-group-name smart-chat-asg-production
```

### Cache Management

**Clear Bot Config Cache**:
```bash
# Connect to an EC2 instance
aws ssm start-session --target i-xxxxxxxxx

# Access Node.js REPL
cd /opt/smart-chat
node

# Clear all bot cache
const botCache = require('./dist/lib/botCache').default;
await botCache.clearAll();
// Or for specific bot
await botCache.invalidateBot('bot-id-here');
```

**Clear Redis Cache Manually**:
```bash
# Connect to Redis (from EC2 instance)
redis-cli -h smart-chat-redis-production.xxxxx.0001.use1.cache.amazonaws.com

# Clear all cache
FLUSHALL

# Clear specific keys
KEYS bot:config:*
DEL bot:config:abc123

# View cache stats
INFO stats
```

### User Management

**Create Admin User**:
```sql
-- Connect to RDS
psql "postgresql://username:password@rds-endpoint:5432/smart_chat"

-- Create admin
INSERT INTO users (
  email,
  "hashedPassword",
  role,
  "firstName",
  "lastName",
  "isEmailVerified",
  "isActive"
) VALUES (
  'admin@domain.com',
  '$2b$12$...',  -- Use bcrypt to hash password
  'admin',
  'Admin',
  'User',
  true,
  true
);
```

**Reset User Password**:
```sql
-- Generate hash using bcrypt (rounds=12)
-- Then update:
UPDATE users
SET "hashedPassword" = '$2b$12$newhashedpassword...'
WHERE email = 'user@domain.com';
```

**Disable User Account**:
```sql
UPDATE users
SET "isActive" = false
WHERE email = 'user@domain.com';
```

---

## Troubleshooting

### High Response Times

**Symptoms**: Response time > 3 seconds

**Diagnosis**:
```bash
# Check ALB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=app/smart-chat-alb/xxx \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T01:00:00Z \
  --period 300 \
  --statistics Average

# Check slow queries in RDS
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Solutions**:
1. Check database query performance
2. Verify cache hit ratio
3. Check for API rate limiting (OpenAI)
4. Scale up EC2 instances
5. Add database indexes

### Database Connection Errors

**Symptoms**: "Connection pool exhausted", "Too many connections"

**Diagnosis**:
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check connections by database
SELECT datname, count(*)
FROM pg_stat_activity
GROUP BY datname;

-- Check idle connections
SELECT count(*)
FROM pg_stat_activity
WHERE state = 'idle';
```

**Solutions**:
```sql
-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < current_timestamp - INTERVAL '1 hour';

-- Update connection pool settings
-- In application: max_connections in db config
-- In RDS: Modify parameter group
```

### Memory Issues (Redis)

**Symptoms**: Cache evictions, slow cache performance

**Diagnosis**:
```bash
redis-cli -h <redis-endpoint>

# Check memory usage
INFO memory

# Check eviction stats
INFO stats | grep evicted

# Check memory usage by key pattern
MEMORY USAGE bot:config:abc123
```

**Solutions**:
1. Increase Redis instance size
2. Reduce cache TTL
3. Clear unnecessary cache entries
4. Check for memory leaks in application

### SSL/TLS Certificate Issues

**Symptoms**: HTTPS not working, certificate warnings

**Solutions**:
```bash
# Check certificate expiry
aws acm describe-certificate --certificate-arn arn:aws:acm:...

# Renew certificate (if using ACM, it's automatic)
# If manual renewal needed, update certificate in ALB listener

# Verify HTTPS is working
curl -I https://yourdomain.com
```

### Stripe Webhook Failures

**Symptoms**: Webhooks showing as failed in Stripe Dashboard

**Diagnosis**:
```bash
# Check webhook logs
aws logs tail /aws/ec2/smart-chat-production --follow --filter-pattern "stripe"

# Test webhook endpoint
curl -X POST https://yourdomain.com/api/webhooks/stripe \
  -H "stripe-signature: test" \
  -d '{}'
```

**Solutions**:
1. Verify webhook secret matches
2. Check endpoint is accessible (not behind auth)
3. Ensure HTTPS is configured
4. Check Stripe API version compatibility

---

## Database Management

### Backups

**Automated Backups** (configured by default):
- Retention: 7 days
- Backup window: 3:00-4:00 AM UTC
- Stored in S3

**Manual Snapshot**:
```bash
aws rds create-db-snapshot \
  --db-instance-identifier smart-chat-db-production \
  --db-snapshot-identifier manual-snapshot-$(date +%Y%m%d-%H%M)
```

**Restore from Snapshot**:
```bash
# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier smart-chat-db-production

# Restore
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier smart-chat-db-restored \
  --db-snapshot-identifier snapshot-name
```

### Maintenance

**Apply Pending Updates**:
```bash
# Check for pending updates
aws rds describe-db-instances \
  --db-instance-identifier smart-chat-db-production \
  --query 'DBInstances[0].PendingModifiedValues'

# Apply immediately (causes downtime)
aws rds apply-pending-maintenance-action \
  --resource-identifier arn:aws:rds:... \
  --apply-action system-update \
  --opt-in-type immediate
```

**Database Optimization**:
```sql
-- Vacuum and analyze
VACUUM ANALYZE;

-- Reindex
REINDEX DATABASE smart_chat;

-- Update statistics
ANALYZE;

-- Check table bloat
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

---

## Performance Optimization

### Application Performance

**Enable Response Caching**:
```typescript
// In Next.js API routes
export const revalidate = 60; // Cache for 60 seconds
```

**Optimize Database Queries**:
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_bots_created_by ON bots("createdBy");
CREATE INDEX idx_conversations_bot_id ON conversations("botId");

-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
ORDER BY n_distinct DESC;
```

**Bot Config Caching**:
- Already implemented with Redis
- Monitor cache hit ratio
- Adjust TTL if needed (current: 5 minutes)

### Infrastructure Optimization

**CDN Setup** (CloudFront):
```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION_ID \
  --paths "/*"
```

**Database Read Replicas**:
```bash
# Create read replica for read-heavy workloads
aws rds create-db-instance-read-replica \
  --db-instance-identifier smart-chat-db-replica \
  --source-db-instance-identifier smart-chat-db-production
```

---

## Security

### Security Checklist

- [ ] SSL/TLS certificates up to date
- [ ] Security groups properly configured
- [ ] Database not publicly accessible
- [ ] S3 buckets have public access blocked
- [ ] IAM roles follow principle of least privilege
- [ ] Secrets in AWS Secrets Manager (not in code)
- [ ] Rate limiting enabled
- [ ] Abuse detection enabled
- [ ] Regular security updates applied
- [ ] CloudWatch alarms configured

### Security Monitoring

**Check for Suspicious Activity**:
```bash
# Check failed login attempts
aws logs filter-log-events \
  --log-group-name /aws/ec2/smart-chat-production \
  --filter-pattern "Invalid credentials"

# Check rate limit violations
aws logs filter-log-events \
  --log-group-name /aws/ec2/smart-chat-production \
  --filter-pattern "Rate limit exceeded"

# Check abuse detection blocks
aws logs filter-log-events \
  --log-group-name /aws/ec2/smart-chat-production \
  --filter-pattern "Abuse threshold exceeded"
```

### Rotate Secrets

**Rotate Database Password**:
```bash
# 1. Update RDS password
aws rds modify-db-instance \
  --db-instance-identifier smart-chat-db-production \
  --master-user-password NewSecurePassword123

# 2. Update application environment variables
# 3. Restart application
```

**Rotate API Keys**:
1. Generate new OpenAI API key
2. Update environment variable
3. Deploy application
4. Delete old API key

---

## Incident Response

### P1 - Critical (Service Down)

**Response Time**: Immediate

1. **Acknowledge incident** in monitoring system
2. **Check ALB target health**:
   ```bash
   aws elbv2 describe-target-health \
     --target-group-arn <tg-arn>
   ```
3. **Check recent deployments** (rollback if needed)
4. **Check CloudWatch alarms** for root cause
5. **Scale up if capacity issue**
6. **Engage on-call team** if not resolved in 15 minutes

### P2 - High (Degraded Performance)

**Response Time**: Within 1 hour

1. Identify affected component
2. Check resource utilization (CPU, memory, disk)
3. Review application logs for errors
4. Check database performance
5. Monitor and escalate if worsens

### P3 - Medium (Minor Issue)

**Response Time**: Within 4 hours

1. Document issue
2. Create ticket for investigation
3. Monitor for escalation

### Common Incident Scenarios

**Scenario: Database Down**
1. Check RDS instance status
2. Check security groups
3. Attempt connection from EC2
4. Restore from snapshot if corrupted
5. Check automated backups

**Scenario: High 5XX Errors**
1. Check application logs
2. Check database connections
3. Check external API status (OpenAI, Stripe)
4. Restart application if needed
5. Scale up if capacity issue

---

## Maintenance Procedures

### Weekly Maintenance

- [ ] Review CloudWatch alarms and metrics
- [ ] Check disk space on all instances
- [ ] Review application logs for errors
- [ ] Check database performance
- [ ] Verify backups are running
- [ ] Review security alerts

### Monthly Maintenance

- [ ] Apply security patches
- [ ] Review and optimize database
- [ ] Update dependencies
- [ ] Review and adjust auto scaling policies
- [ ] Cost optimization review
- [ ] Disaster recovery drill

### Quarterly Maintenance

- [ ] Security audit
- [ ] Performance testing
- [ ] Capacity planning
- [ ] Update disaster recovery plan
- [ ] Review and update documentation

---

## Contacts

**On-Call Escalation**:
1. DevOps Team: devops@domain.com
2. Engineering Manager: engineering@domain.com
3. CTO: cto@domain.com

**Vendor Support**:
- AWS Support: [AWS Console](https://console.aws.amazon.com/support/)
- OpenAI Support: https://help.openai.com/
- Stripe Support: https://support.stripe.com/

---

**Last Updated**: 2024
**Version**: 1.0.0
