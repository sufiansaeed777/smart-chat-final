# Smart Chat RAG Platform - Terraform Deployment

This directory contains Terraform Infrastructure as Code (IaC) for deploying the Smart Chat RAG platform to AWS.

## Architecture Overview

The Terraform configuration provisions the following AWS resources:

### Networking
- **VPC** with public and private subnets across 2 availability zones
- **Internet Gateway** for public subnet internet access
- **NAT Gateway** for private subnet outbound traffic
- **Route Tables** for public and private subnets

### Compute
- **Application Load Balancer (ALB)** for traffic distribution
- **Auto Scaling Group** with EC2 instances (Ubuntu 22.04)
- **Launch Template** with user data for automated setup
- Target capacity: 1-4 instances based on CPU and request count

### Database & Cache
- **RDS PostgreSQL 15** (db.t3.micro by default)
  - Automated backups (7-day retention)
  - Multi-AZ option available
  - Performance Insights enabled
- **ElastiCache Redis 7** (cache.t3.micro by default)
  - Used for rate limiting, abuse detection, and caching

### Storage
- **S3 Bucket** for file storage (training data, embeddings, uploads)
  - Versioning enabled
  - Server-side encryption (AES256)
  - Lifecycle policies for cost optimization

### Security
- **Security Groups** for ALB, EC2, RDS, and Redis
- **IAM Roles** for EC2 instances with permissions for:
  - S3 access
  - CloudWatch Logs
  - Systems Manager (SSM)
  - Secrets Manager

### Monitoring
- **CloudWatch Alarms** for:
  - RDS CPU, storage, and connections
  - Redis CPU and memory
  - ALB target health and error rates
  - Application response time
- **CloudWatch Dashboard** for centralized monitoring
- **SNS Topic** for alarm notifications

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** >= 1.0 installed ([Download](https://www.terraform.io/downloads))
3. **AWS CLI** configured with credentials
   ```bash
   aws configure
   ```
4. **SSH Key Pair** created in AWS EC2 console
5. **Domain Name** (optional, for production)

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd smart-chat/terraform
```

### 2. Configure Variables
```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and fill in your values:
```hcl
aws_region   = "us-east-1"
key_pair_name = "your-ssh-key"
db_password   = "strong-password"
s3_bucket_name = "smart-chat-storage-123456789"
nextauth_secret = "random-secret"
nextauth_url    = "https://yourdomain.com"
openai_api_key  = "sk-..."
stripe_secret_key = "sk_live_..."
# ... etc
```

### 3. Initialize Terraform
```bash
terraform init
```

### 4. Review Plan
```bash
terraform plan
```

Review the resources that will be created (approximately 40+ resources).

### 5. Deploy Infrastructure
```bash
terraform apply
```

Type `yes` to confirm. Deployment takes approximately 15-20 minutes.

### 6. Save Outputs
```bash
terraform output > outputs.txt
terraform output -json > outputs.json
```

Important outputs:
- `alb_dns_name` - Load balancer URL
- `rds_endpoint` - Database endpoint
- `redis_endpoint` - Redis endpoint
- `s3_bucket_name` - Storage bucket name

## Post-Deployment Steps

### 1. Configure DNS
Point your domain to the ALB DNS name:
```bash
terraform output alb_dns_name
```

Create a CNAME record:
```
yourdomain.com -> <alb_dns_name>
```

### 2. Create SSL Certificate
1. Go to AWS Certificate Manager (ACM)
2. Request a certificate for your domain
3. Validate via DNS or email
4. Update `alb.tf` with certificate ARN:
   ```hcl
   resource "aws_lb_listener" "https" {
     certificate_arn = "arn:aws:acm:..."
   }
   ```
5. Apply changes: `terraform apply`

### 3. Deploy Application Code

SSH into an EC2 instance:
```bash
# Get instance IP
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=smart-chat-app-production" \
  --query 'Reservations[*].Instances[*].[InstanceId,PublicIpAddress]' \
  --output table

# SSH using Systems Manager (no public IP needed)
aws ssm start-session --target <instance-id>

# Or SSH directly
ssh -i your-key.pem ubuntu@<instance-ip>
```

Inside the instance:
```bash
cd /opt/smart-chat

# Clone your repository
git clone <your-repo-url> .

# Install dependencies
npm install

# Build application
npm run build

# Start with PM2
pm2 start npm --name "smart-chat" -- start
pm2 save
```

### 4. Run Database Migrations
```bash
# SSH into an EC2 instance
cd /opt/smart-chat

# Run migrations
npm run db:migrate

# Or connect to RDS directly
psql "$(terraform output -raw database_url)"
```

### 5. Configure Environment Variables
Environment variables are automatically set via user data script, but verify:
```bash
cat /opt/smart-chat/.env.production
```

### 6. Verify Deployment
```bash
# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn $(terraform output -raw target_group_arn)

# Test application
curl http://$(terraform output -raw alb_dns_name)/api/health
```

## Monitoring

### CloudWatch Dashboard
```bash
# Get dashboard URL
terraform output cloudwatch_dashboard_url
```

### View Logs
```bash
# Application logs
aws logs tail /aws/ec2/smart-chat-production --follow

# RDS logs
aws rds describe-db-log-files --db-instance-identifier smart-chat-db-production
```

### Check Alarms
```bash
aws cloudwatch describe-alarms --alarm-name-prefix smart-chat
```

## Scaling

### Manual Scaling
Update `terraform.tfvars`:
```hcl
asg_desired_capacity = 4
```

Apply changes:
```bash
terraform apply
```

### Auto Scaling
Auto scaling is configured based on:
- CPU utilization (target: 70%)
- Request count per target (target: 1000 requests/target)

## Cost Estimation

Estimated monthly costs (us-east-1):

| Resource | Type | Quantity | Monthly Cost |
|----------|------|----------|--------------|
| EC2 | t3.medium | 2 | ~$60 |
| RDS | db.t3.micro | 1 | ~$15 |
| ElastiCache | cache.t3.micro | 1 | ~$12 |
| ALB | - | 1 | ~$20 |
| NAT Gateway | - | 1 | ~$32 |
| S3 | Storage + requests | - | ~$5-10 |
| Data Transfer | - | - | ~$10-20 |
| **Total** | | | **~$154-169/month** |

*Costs vary based on usage. Add ~20-30% for CloudWatch, backups, etc.*

## Backup & Disaster Recovery

### RDS Backups
- Automated daily backups (7-day retention)
- Manual snapshots before major changes:
  ```bash
  aws rds create-db-snapshot \
    --db-instance-identifier smart-chat-db-production \
    --db-snapshot-identifier smart-chat-manual-$(date +%Y%m%d)
  ```

### Redis Backups
- Automated snapshots (5-day retention)
- Snapshot window: 3:00-5:00 AM UTC

### S3 Versioning
- Enabled on storage bucket
- Old versions retained for 90 days

### State Backup
Terraform state is local by default. For production, use remote backend:

Uncomment in `provider.tf`:
```hcl
backend "s3" {
  bucket         = "your-terraform-state-bucket"
  key            = "smart-chat/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "terraform-state-lock"
}
```

## Destroying Infrastructure

⚠️ **WARNING**: This will delete ALL resources including databases!

```bash
# Review what will be destroyed
terraform plan -destroy

# Destroy infrastructure
terraform destroy
```

To keep data:
1. Create manual RDS snapshot before destroying
2. Export S3 data
3. Set `deletion_protection = false` for RDS in production

## Troubleshooting

### EC2 Instances Not Healthy
```bash
# Check instance status
aws ec2 describe-instance-status --instance-ids <instance-id>

# Check target health
aws elbv2 describe-target-health --target-group-arn <tg-arn>

# Check logs
aws logs tail /aws/ec2/smart-chat-production --follow
```

### Database Connection Issues
```bash
# Test connectivity from EC2
psql -h <rds-endpoint> -U postgres -d smart_chat

# Check security groups
aws ec2 describe-security-groups --group-ids <sg-id>
```

### High Costs
```bash
# Check Cost Explorer
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics UnblendedCost
```

Optimization tips:
- Use t3/t4g instances with credits
- Enable RDS storage autoscaling
- Use S3 lifecycle policies
- Consider Reserved Instances for production

## Security Best Practices

1. **Enable MFA** on AWS root account
2. **Use IAM roles** instead of access keys
3. **Rotate secrets** regularly
4. **Enable AWS GuardDuty** for threat detection
5. **Use AWS Secrets Manager** for sensitive values
6. **Restrict SSH access** to specific IPs
7. **Enable VPC Flow Logs** for network monitoring
8. **Use AWS WAF** with ALB for additional protection

## Support

For issues or questions:
- Check CloudWatch Logs: `/aws/ec2/smart-chat-production`
- Review CloudWatch Alarms
- Check AWS Health Dashboard
- Contact DevOps team

## License

MIT License - See LICENSE file for details
