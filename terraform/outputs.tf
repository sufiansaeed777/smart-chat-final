#
# PHASE 4: Terraform Outputs
#

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Application Load Balancer Zone ID (for Route53)"
  value       = aws_lb.main.zone_id
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_address" {
  description = "RDS PostgreSQL address"
  value       = aws_db_instance.postgres.address
}

output "rds_port" {
  description = "RDS PostgreSQL port"
  value       = aws_db_instance.postgres.port
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].port
}

output "s3_bucket_name" {
  description = "S3 bucket name for file storage"
  value       = aws_s3_bucket.storage.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.storage.arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.app.name
}

output "autoscaling_group_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.app.name
}

output "iam_instance_profile" {
  description = "IAM instance profile name"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "database_url" {
  description = "Full PostgreSQL connection URL (sensitive)"
  value       = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${var.db_name}"
  sensitive   = true
}

output "redis_url" {
  description = "Full Redis connection URL"
  value       = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:${aws_elasticache_cluster.redis.cache_nodes[0].port}"
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "deployment_summary" {
  description = "Deployment summary"
  value = <<-EOT
    ========================================
    Smart Chat RAG Platform - Deployment Summary
    ========================================

    Environment: ${var.environment}
    Region: ${var.aws_region}

    Application:
    - Load Balancer: ${aws_lb.main.dns_name}
    - Auto Scaling Group: ${aws_autoscaling_group.app.name}
    - Desired Capacity: ${var.asg_desired_capacity}

    Database:
    - RDS Endpoint: ${aws_db_instance.postgres.endpoint}
    - Database Name: ${var.db_name}

    Cache:
    - Redis Endpoint: ${aws_elasticache_cluster.redis.cache_nodes[0].address}:${aws_elasticache_cluster.redis.cache_nodes[0].port}

    Storage:
    - S3 Bucket: ${aws_s3_bucket.storage.id}

    Monitoring:
    - CloudWatch Logs: ${aws_cloudwatch_log_group.app.name}
    - Dashboard: ${aws_cloudwatch_dashboard.main.dashboard_name}

    Next Steps:
    1. Point your domain to: ${aws_lb.main.dns_name}
    2. Create ACM certificate for HTTPS
    3. Update HTTPS listener with certificate ARN
    4. Configure application environment variables
    5. Deploy application code to EC2 instances

    ========================================
  EOT
}
