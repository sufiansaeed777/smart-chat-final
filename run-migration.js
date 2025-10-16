require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('\n=== Running Human Handoff Migration ===\n');

    // Add sessionId column
    console.log('1. Adding sessionId column...');
    await client.query(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS "sessionId" VARCHAR(255);
    `);

    // Add indexes for sessionId
    console.log('2. Creating index on sessionId...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversation_sessionId"
      ON conversations ("sessionId");
    `);

    // Add guestName column
    console.log('3. Adding guestName column...');
    await client.query(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS "guestName" VARCHAR(255);
    `);

    // Add guestId column
    console.log('4. Adding guestId column...');
    await client.query(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS "guestId" VARCHAR(100);
    `);

    // Create mode enum
    console.log('5. Creating conversation_mode_enum...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_mode_enum') THEN
          CREATE TYPE conversation_mode_enum AS ENUM ('AI', 'Human');
        END IF;
      END $$;
    `);

    // Add mode column
    console.log('6. Adding mode column...');
    await client.query(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS "mode" conversation_mode_enum DEFAULT 'AI';
    `);

    // Create status enum
    console.log('7. Creating conversation_status_enum...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_status_enum') THEN
          CREATE TYPE conversation_status_enum AS ENUM ('active', 'waiting', 'idle', 'completed');
        END IF;
      END $$;
    `);

    // Add status column
    console.log('8. Adding status column...');
    await client.query(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS "status" conversation_status_enum DEFAULT 'active';
    `);

    // Add index for status
    console.log('9. Creating index on status...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversation_status"
      ON conversations ("status");
    `);

    // Add assignedAgentId column
    console.log('10. Adding assignedAgentId column...');
    await client.query(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS "assignedAgentId" UUID;
    `);

    // Add index for assignedAgentId
    console.log('11. Creating index on assignedAgentId...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversation_assignedAgentId"
      ON conversations ("assignedAgentId");
    `);

    // Add assignedAgentName column
    console.log('12. Adding assignedAgentName column...');
    await client.query(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS "assignedAgentName" VARCHAR(255);
    `);

    // Add assignedAt column
    console.log('13. Adding assignedAt column...');
    await client.query(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP;
    `);

    // Add messages column
    console.log('14. Adding messages column...');
    await client.query(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS "messages" JSONB DEFAULT '[]';
    `);

    // Add startedAt column
    console.log('15. Adding startedAt column...');
    await client.query(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP;
    `);

    // Add lastMessageAt column
    console.log('16. Adding lastMessageAt column...');
    await client.query(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS "lastMessageAt" TIMESTAMP;
    `);

    // Add completedAt column
    console.log('17. Adding completedAt column...');
    await client.query(`
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP;
    `);

    // Update metadata column to JSONB if it's text
    console.log('18. Updating metadata column type...');
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'conversations'
          AND column_name = 'metadata'
          AND data_type = 'text'
        ) THEN
          ALTER TABLE conversations
          ALTER COLUMN metadata TYPE JSONB USING metadata::jsonb;
        END IF;
      END $$;
    `);

    // Make message and sender nullable (backward compatibility)
    console.log('19. Making message and sender nullable...');
    await client.query(`
      ALTER TABLE conversations
      ALTER COLUMN message DROP NOT NULL;
    `);
    await client.query(`
      ALTER TABLE conversations
      ALTER COLUMN sender DROP NOT NULL;
    `);

    console.log('\n✅ Migration completed successfully!\n');
    console.log('Human Handoff database schema is ready.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

runMigration();
