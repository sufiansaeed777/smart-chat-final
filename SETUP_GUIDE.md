# Smart Chat RAG Platform - Setup Guide

Complete installation and configuration guide for the Smart Chat RAG Chatbot platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Running the Application](#running-the-application)
6. [WordPress Plugin Setup](#wordpress-plugin-setup)
7. [Stripe Integration](#stripe-integration)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **PostgreSQL** >= 15.0 ([Download](https://www.postgresql.org/download/))
- **Redis** (Optional, for production) ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/downloads))

### Required Accounts

- **OpenAI API Key** ([Get API Key](https://platform.openai.com/api-keys))
- **Stripe Account** (for billing) ([Sign Up](https://dashboard.stripe.com/register))
- **AWS Account** (for production deployment, optional)

### System Requirements

- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 10GB free space
- **OS**: Windows, macOS, or Linux

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd smart-chat
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 14
- TypeORM
- OpenAI SDK
- Stripe SDK
- Redis (ioredis)
- And more...

---

## Database Configuration

### Option 1: Local PostgreSQL

#### Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql-15 postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

#### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE smart_chat;
CREATE USER smart_chat_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE smart_chat TO smart_chat_user;

# Exit psql
\q
```

#### Run Migrations

```bash
# Generate initial migration
npm run typeorm migration:generate -- -n InitialSetup

# Run migrations
npm run typeorm migration:run
```

### Option 2: Docker PostgreSQL

```bash
# Start PostgreSQL with Docker
docker run --name smart-chat-db \
  -e POSTGRES_DB=smart_chat \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15-alpine

# Check if running
docker ps
```

### Option 3: Supabase (Cloud PostgreSQL)

1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Copy the connection string from Settings > Database
4. Use the connection string in your `.env.local` file

---

## Environment Variables

### 1. Copy Example File

```bash
cp .env.local.example .env.local
```

### 2. Configure Required Variables

Edit `.env.local` with your values:

```env
# Database Configuration
DATABASE_URL=postgresql://smart_chat_user:your_password@localhost:5432/smart_chat

# NextAuth Configuration
NEXTAUTH_SECRET=generate_a_random_secret_here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# Redis Configuration (Optional for development)
REDIS_URL=redis://localhost:6379

# AWS S3 Configuration (Optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=smart-chat-storage

# Application Configuration
NODE_ENV=development
```

### 3. Generate Secrets

#### NextAuth Secret

```bash
# Generate a random secret
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET`

#### Stripe Webhook Secret

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Set URL: `http://localhost:3000/api/webhooks/stripe`
4. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy the "Signing secret"

---

## Running the Application

### Development Mode

```bash
# Start the development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Using Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

---

## WordPress Plugin Setup

### 1. Install the Plugin

1. Download the WordPress plugin from `/wordpress-plugin` directory
2. Log in to your WordPress admin panel
3. Go to Plugins > Add New > Upload Plugin
4. Upload the zip file and activate

### 2. Configure the Plugin

1. Go to Settings > Smart Chat Settings
2. Enter your configuration:
   - **API Base URL**: `https://yourdomain.com` (or `http://localhost:3000` for testing)
   - **User ID**: Your user ID from Smart Chat dashboard
   - **Bot ID**: The bot ID you want to use
   - **Secret Token**: Generated from Smart Chat dashboard

### 3. Add Chat Widget to Website

**Option 1: Shortcode**
```
[smart-chat]
```

**Option 2: PHP Code**
```php
<?php echo do_shortcode('[smart-chat]'); ?>
```

**Option 3: Widget**
1. Go to Appearance > Widgets
2. Add "Smart Chat Widget" to your sidebar or footer

---

## Stripe Integration

### 1. Development Setup

1. Create a Stripe account at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Get your test API keys from Dashboard > Developers > API keys
3. Copy Secret key to `STRIPE_SECRET_KEY`
4. Copy Publishable key to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 2. Create Products and Prices

```bash
# Install Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Create products (run from project root)
node scripts/create-stripe-products.js
```

Or manually create in Stripe Dashboard:

1. Go to Products > Add Product
2. Create 3 products:
   - **Free Plan**: $0/month (for trial)
   - **Pro Plan**: $29/month
   - **Enterprise Plan**: $99/month

### 3. Configure Webhooks

**Development (using Stripe CLI):**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Production:**
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 4. Test Payments

Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Any future expiry date and any CVC

---

## Production Deployment

### Option 1: AWS with Terraform (Recommended)

See [terraform/README.md](terraform/README.md) for detailed instructions.

**Quick Start:**
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform plan
terraform apply
```

**Estimated Cost**: ~$154-169/month

### Option 2: Vercel (Frontend) + Supabase (Database)

1. **Deploy to Vercel:**
```bash
npm install -g vercel
vercel
```

2. **Configure Environment Variables in Vercel:**
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.local`

3. **Connect Supabase:**
   - Use Supabase connection string for `DATABASE_URL`

### Option 3: Docker on VPS

```bash
# On your server
git clone <repository-url>
cd smart-chat

# Setup environment
cp .env.local.example .env.production
nano .env.production  # Edit with production values

# Build and start
docker-compose -f docker-compose.prod.yml up -d
```

---

## Initial Configuration

### 1. Create Admin User

After first deployment:

```bash
# Connect to your database
psql $DATABASE_URL

# Create admin user
INSERT INTO users (
  email,
  "hashedPassword",
  role,
  "firstName",
  "lastName",
  "isEmailVerified"
) VALUES (
  'admin@yourdomain.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5ztpql/BK3eKm', -- password: admin123
  'admin',
  'Admin',
  'User',
  true
);
```

**Change the password immediately after first login!**

### 2. Configure Email (Optional)

For email notifications and password reset:

```env
# Add to .env.local
EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
EMAIL_FROM=noreply@yourdomain.com
```

### 3. Setup Monitoring

See [ADMIN_RUNBOOK.md](ADMIN_RUNBOOK.md) for monitoring setup.

---

## Troubleshooting

### Database Connection Issues

**Error**: `Connection refused`

**Solution**:
```bash
# Check if PostgreSQL is running
pg_isready

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

### OpenAI API Errors

**Error**: `Invalid API key`

**Solution**:
1. Verify your API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Check if there are usage limits or billing issues
3. Ensure the key has proper permissions

**Error**: `Rate limit exceeded`

**Solution**:
1. Upgrade your OpenAI plan
2. Implement request queuing
3. Use caching for common queries

### Stripe Webhook Issues

**Error**: `Webhook signature verification failed`

**Solution**:
1. Verify `STRIPE_WEBHOOK_SECRET` is correct
2. Check if webhook endpoint is accessible
3. Ensure webhook version matches Stripe API version

### Redis Connection Issues

**Error**: `Redis connection failed`

**Solution**:
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### Build Errors

**Error**: `Module not found`

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run build
```

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use a different port
PORT=3001 npm run dev
```

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeORM Documentation](https://typeorm.io/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [ADMIN_RUNBOOK.md](ADMIN_RUNBOOK.md) - Operations guide

## Support

For issues or questions:
- Check logs: `npm run logs` or `docker-compose logs`
- Review error messages in browser console
- Check database connectivity
- Verify environment variables

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Database
npm run typeorm migration:generate -- -n MigrationName
npm run typeorm migration:run
npm run typeorm migration:revert

# Docker
docker-compose up -d     # Start all services
docker-compose down      # Stop all services
docker-compose logs -f   # View logs

# Testing
npm test                 # Run tests
npm run lint             # Run linter
```

### Default Credentials

**Admin User** (create manually):
- Email: admin@yourdomain.com
- Password: (set during creation)

**Test Stripe Cards**:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

---

**Last Updated**: 2024
**Version**: 1.0.0
