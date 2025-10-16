require('dotenv').config({ path: '.env.local' });
require('reflect-metadata');

const { DataSource } = require('typeorm');
const { User } = require('./src/entities/User.ts');
const { Bot } = require('./src/entities/Bot.ts');
const { BotAssignment } = require('./src/entities/BotAssignment.ts');
const { Conversation } = require('./src/entities/Conversation.ts');
const { Subscription } = require('./src/entities/Subscription.ts');
const { BillingPlan } = require('./src/entities/BillingPlan.ts');
const { Invoice } = require('./src/entities/Invoice.ts');
const { ChatbotIssue } = require('./src/entities/ChatbotIssue.ts');
const { Document } = require('./src/entities/Document.ts');
const { BotDocument } = require('./src/entities/BotDocument.ts');

module.exports = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: true,
  entities: [User, Bot, BotAssignment, Conversation, Subscription, BillingPlan, Invoice, ChatbotIssue, Document, BotDocument],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
  ssl: {
    rejectUnauthorized: false
  }
});
