# Smart Chat - Production Deployment Guide

## Overview

This guide covers deploying Smart Chat to production using AWS infrastructure with Docker containers orchestrated by Docker Compose, provisioned via Terraform.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
│                                                              │
│  ┌──────────────┐      ┌───────────────┐                   │
│  │  CloudFront  │─────▶│   S3 Bucket   │                   │
│  │     (CDN)    │      │  (Static Files)│                   │
│  └──────────────┘      └───────────────┘                   │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐      ┌───────────────┐                   │
│  │  Application │      │               │                   │
│  │ Load Balancer│      │  EC2 Instance │                   │
│  │    (ALB)     │─────▶│  (Next.js App)│                   │
│  └──────────────┘      │  + Docker     │                   │
│                        └───────┬───────┘                   │
│                                │                             │
│         ┌──────────────────────┼──────────────────┐         │
│         │                      │                  │         │
│         ▼                      ▼                  ▼         │
│  ┌─────────────┐      ┌──────────────┐   ┌─────────────┐  │
│  │  RDS (PostgreSQL)  │   ElastiCache│   │  S3 Bucket  │  │
│  │   (Database)       │    (Redis)   │   │  (Uploads)  │  │
│  └─────────────┘      └──────────────┘   └─────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │                      │
         ▼                      ▼
   ┌──────────┐          ┌──────────┐
   │  Stripe  │          │   n8n    │
   │(Payments)│          │  (RAG)   │
   └──────────┘          └──────────┘
```

## Prerequisites

### Local Development Machine

1. **AWS CLI**
   ```bash
   # Install AWS CLI
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install

   # Configure credentials
   aws configure
   # Enter: Access Key ID, Secret Access Key, Region (us-east-1), Format (json)
   ```

2. **Terraform**
   ```bash
   # Install Terraform
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/

   # Verify
   terraform --version
   ```

3. **Docker**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Add user to docker group
   sudo usermod -aG docker $USER

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

### AWS Account Setup

1. **Create IAM User for Deployment**
   - Name: `smartchat-deploy`
   - Permissions:
     - EC2FullAccess
     - RDSFullAccess
     - S3FullAccess
     - ElastiCacheFullAccess
     - CloudFrontFullAccess
     - Route53FullAccess
     - IAMFullAccess (for creating service roles)

2. **Create S3 Bucket for Terraform State**
   ```bash
   aws s3 mb s3://smartchat-terraform-state --region us-east-1
   aws s3api put-bucket-versioning \
     --bucket smartchat-terraform-state \
     --versioning-configuration Status=Enabled
   ```

## Infrastructure Setup (Terraform)

### 1. Create Terraform Configuration

Create `terraform/` directory structure:

```
terraform/
├── main.tf
├── variables.tf
├── outputs.tf
├── vpc.tf
├── rds.tf
├── elasticache.tf
├── ec2.tf
├── s3.tf
└── alb.tf
```

### 2. Deploy Infrastructure

```bash
# Create terraform directory
mkdir -p terraform
cd terraform

# Create terraform.tfvars file
cat > terraform.tfvars <<EOF
aws_region   = "us-east-1"
environment  = "production"
db_username  = "smartchat_admin"
db_password  = "CHANGE_ME_TO_SECURE_PASSWORD"
domain_name  = "smartchat.com"
EOF

# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply (create infrastructure)
terraform apply

# Save outputs
terraform output > ../deployment-outputs.txt
```

## Application Deployment (Docker)

### 1. Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Build Next.js application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create nextjs user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Create Docker Compose (`docker-compose.prod.yml`)

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_APP_URL: https://smartchat.com
    ports:
      - "3000:3000"
    environment:
      # Database
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/smartchat

      # Redis
      REDIS_URL: redis://${REDIS_HOST}:6379

      # Auth
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: https://smartchat.com

      # OpenAI
      OPENAI_API_KEY: ${OPENAI_API_KEY}

      # Stripe
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${STRIPE_PUBLISHABLE_KEY}

      # n8n
      N8N_WEBHOOK_URL: ${N8N_WEBHOOK_URL}

      # AWS S3
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_REGION: us-east-1
      AWS_S3_BUCKET: ${S3_BUCKET_NAME}

      # App
      NODE_ENV: production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - app
    restart: unless-stopped
```

### 3. Create Nginx Configuration (`nginx.conf`)

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name smartchat.com www.smartchat.com;

        # Redirect HTTP to HTTPS
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name smartchat.com www.smartchat.com;

        ssl_certificate /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Proxy settings
        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # SSE streaming support
        location /api/wordpress/send-message {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Connection '';
            proxy_buffering off;
            proxy_cache off;
            chunked_transfer_encoding off;
        }
    }
}
```

### 4. Deploy Application

SSH into EC2 instance:

```bash
# Get EC2 public IP from Terraform output
EC2_IP=$(terraform output -raw ec2_public_ip)

# SSH into instance
ssh -i ~/.ssh/id_rsa ec2-user@$EC2_IP

# Navigate to app directory
cd /opt/smartchat

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Environment Variables Setup

### Store secrets in AWS Systems Manager Parameter Store:

```bash
# Database credentials
aws ssm put-parameter \
  --name "/smartchat/production/db-password" \
  --value "YOUR_SECURE_PASSWORD" \
  --type "SecureString" \
  --region us-east-1

# All environment variables as one parameter
aws ssm put-parameter \
  --name "/smartchat/production/env" \
  --value "$(cat .env.production)" \
  --type "SecureString" \
  --region us-east-1
```

## SSL/TLS Certificate Setup

### Using AWS Certificate Manager (ACM):

```bash
# Request certificate
aws acm request-certificate \
  --domain-name smartchat.com \
  --subject-alternative-names www.smartchat.com \
  --validation-method DNS \
  --region us-east-1

# Get validation record
aws acm describe-certificate \
  --certificate-arn <certificate-arn> \
  --region us-east-1

# Add CNAME record to your DNS (Route53)
# Wait for validation (can take 5-30 minutes)
```

## Monitoring & Logging

### 1. CloudWatch Logs

Create log groups:

```bash
aws logs create-log-group --log-group-name /smartchat/application
aws logs create-log-group --log-group-name /smartchat/nginx
```

### 2. CloudWatch Alarms

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name smartchat-high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name 5XXError \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 5.0 \
  --comparison-operator GreaterThanThreshold

# Database CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name smartchat-db-high-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80.0 \
  --comparison-operator GreaterThanThreshold
```

## Backup & Disaster Recovery

### 1. Automated Database Backups

RDS automatically creates daily backups (configured in Terraform).

### 2. Manual Backup

```bash
# Create manual RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier smart-chat-db \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d)
```

### 3. S3 Bucket Versioning

Already enabled in Terraform configuration.

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to EC2
        env:
          EC2_HOST: ${{ secrets.EC2_HOST }}
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
        run: |
          echo "$SSH_PRIVATE_KEY" > private_key
          chmod 600 private_key

          ssh -o StrictHostKeyChecking=no -i private_key ec2-user@$EC2_HOST << 'EOF'
            cd /opt/smartchat
            git pull origin main
            docker-compose -f docker-compose.prod.yml down
            docker-compose -f docker-compose.prod.yml build
            docker-compose -f docker-compose.prod.yml up -d
          EOF
```

## Post-Deployment Checklist

- [ ] Verify application is accessible via HTTPS
- [ ] Test WordPress plugin connection
- [ ] Verify database connections
- [ ] Check Redis cache is working
- [ ] Test Stripe webhooks
- [ ] Verify file uploads to S3
- [ ] Check CloudWatch logs
- [ ] Test rate limiting
- [ ] Verify SSL certificate
- [ ] Run end-to-end tests from TESTING_PLAN.md
- [ ] Set up monitoring alerts
- [ ] Configure backup retention
- [ ] Update DNS records
- [ ] Test disaster recovery procedure

## Maintenance

### Scaling

To handle increased load:

1. **Horizontal Scaling:** Add more EC2 instances behind ALB
2. **Database Scaling:** Upgrade RDS instance class
3. **Cache Scaling:** Add more Redis nodes

### Updates

```bash
# SSH to EC2
ssh ec2-user@<ec2-ip>

# Pull latest code
cd /opt/smartchat
git pull

# Rebuild
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Check container status
docker-compose -f docker-compose.prod.yml ps

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Database connection issues

```bash
# Test connection from EC2
psql -h <rds-endpoint> -U smartchat_admin -d smartchat

# Check security groups
aws ec2 describe-security-groups --group-ids <rds-sg-id>
```

### Redis connection issues

```bash
# Test Redis connection
redis-cli -h <elasticache-endpoint>

# Check security groups
aws ec2 describe-security-groups --group-ids <redis-sg-id>
```

## Support

For deployment issues:
- Check CloudWatch Logs
- Review EC2 instance health
- Verify RDS connectivity
- Check Terraform state: `terraform show`

## Cost Estimation

Monthly AWS costs (approximate):

- EC2 t3.large: $60
- RDS db.t3.medium (Multi-AZ): $150
- ElastiCache (2 nodes): $100
- S3 storage (100GB): $3
- Data transfer: $50
- **Total: ~$363/month**

*Note: Actual costs may vary based on usage*

---

**For detailed Terraform configurations, see `terraform/` directory.**
**For complete testing procedures, see `TESTING_PLAN.md`.**
**For API documentation, see `openapi.yaml` and `API_DOCUMENTATION.md`.**
