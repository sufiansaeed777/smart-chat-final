#!/bin/bash

echo "🚀 Setting up WordPress with Docker..."
echo "=================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

echo "✅ Docker is installed"

# Stop any existing containers
echo "🛑 Stopping any existing WordPress containers..."
docker-compose -f docker-compose-wordpress.yml down 2>/dev/null || docker compose -f docker-compose-wordpress.yml down 2>/dev/null

# Start WordPress
echo "🔄 Starting WordPress containers..."
if command -v docker-compose &> /dev/null; then
    docker-compose -f docker-compose-wordpress.yml up -d
else
    docker compose -f docker-compose-wordpress.yml up -d
fi

echo "⏳ Waiting for WordPress to be ready..."
sleep 10

echo ""
echo "✅ WordPress is ready!"
echo "=================================="
echo "📍 WordPress URL: http://localhost:8080"
echo "📍 PHPMyAdmin URL: http://localhost:8081"
echo ""
echo "📝 WordPress Setup:"
echo "1. Go to http://localhost:8080"
echo "2. Choose your language"
echo "3. Site Title: Test Site"
echo "4. Username: admin"
echo "5. Password: (choose any password)"
echo "6. Email: your-email@example.com"
echo ""
echo "🔌 After WordPress setup:"
echo "1. Login to WordPress admin"
echo "2. Go to Plugins → Add New → Upload Plugin"
echo "3. Upload the synofex-chatbot.zip from your Integrations page"
echo "4. Activate the plugin"
echo "5. Go to Settings → Synofex Chatbot"
echo "6. Enter your token and API URL (http://host.docker.internal:3000)"
echo ""
echo "💡 Tip: Use 'http://host.docker.internal:3000' as API URL"
echo "   (This lets Docker container connect to your localhost:3000)"
echo "=================================="