-- Migration: Create Help Center Tables
-- Description: Creates tables for help articles, video links, and FAQs
-- Date: 2025-01-21

-- Create help_articles table
CREATE TABLE IF NOT EXISTS help_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    "viewCount" INTEGER DEFAULT 0,
    "isPublished" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on category for faster queries
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category);
CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles("isPublished");

-- Create video_links table
CREATE TABLE IF NOT EXISTS video_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    thumbnail VARCHAR(255),
    duration INTEGER DEFAULT 0,
    "viewCount" INTEGER DEFAULT 0,
    "isPublished" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on category for faster queries
CREATE INDEX IF NOT EXISTS idx_video_links_category ON video_links(category);
CREATE INDEX IF NOT EXISTS idx_video_links_published ON video_links("isPublished");

-- Create faqs table
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    "orderIndex" INTEGER DEFAULT 0,
    "viewCount" INTEGER DEFAULT 0,
    "isPublished" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on category for faster queries
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_published ON faqs("isPublished");
CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs("orderIndex");

-- Insert sample data for testing (optional)
INSERT INTO help_articles (title, content, category, description) VALUES
('Getting Started Guide', 'Welcome to ChatBot Pro! This guide will help you get started with creating and managing your AI chatbots. First, navigate to the Bots section...', 'getting-started', 'Learn the basics of ChatBot Pro'),
('User Management', 'Managing users in your organization is easy. Navigate to the Users section to invite team members, assign roles, and manage permissions...', 'user-management', 'How to manage users and permissions')
ON CONFLICT DO NOTHING;

INSERT INTO video_links (title, url, category, description, duration) VALUES
('Quick Start Tutorial', 'https://youtube.com/watch?v=example1', 'getting-started', 'A 5-minute tutorial to get you started', 300),
('Bot Creation Guide', 'https://youtube.com/watch?v=example2', 'bot-creation', 'Learn how to create your first bot', 600)
ON CONFLICT DO NOTHING;

INSERT INTO faqs (question, answer, category, "orderIndex") VALUES
('How do I create a new bot?', 'To create a new bot, navigate to the Bots section and click the "Create Bot" button. Fill in the required information including bot name, description, and domain.', 'bot-creation', 1),
('Can I assign multiple agents to a bot?', 'Yes! You can assign multiple agents to handle conversations for a single bot. This allows for load balancing and specialized support.', 'user-management', 1),
('How do I view analytics?', 'Analytics are available in the Analytics section of your dashboard. You can view conversation metrics, user engagement, and bot performance.', 'analytics', 1)
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Help center tables created successfully!';
    RAISE NOTICE 'Tables: help_articles, video_links, faqs';
    RAISE NOTICE 'Sample data inserted for testing';
END $$;
