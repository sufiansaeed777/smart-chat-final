import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateConversationForHandoff1730880000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add sessionId column
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'sessionId',
        type: 'varchar',
        length: '255',
        isNullable: true,
      })
    );

    // Add guestName column
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'guestName',
        type: 'varchar',
        length: '255',
        isNullable: true,
      })
    );

    // Add guestId column
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'guestId',
        type: 'varchar',
        length: '100',
        isNullable: true,
      })
    );

    // Add mode column (AI or Human)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_mode_enum') THEN
          CREATE TYPE conversation_mode_enum AS ENUM ('AI', 'Human');
        END IF;
      END $$;
    `);

    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'mode',
        type: 'conversation_mode_enum',
        default: "'AI'",
      })
    );

    // Add status column
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_status_enum') THEN
          CREATE TYPE conversation_status_enum AS ENUM ('active', 'waiting', 'idle', 'completed');
        END IF;
      END $$;
    `);

    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'status',
        type: 'conversation_status_enum',
        default: "'active'",
      })
    );

    // Add assignedAgentId column
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'assignedAgentId',
        type: 'uuid',
        isNullable: true,
      })
    );

    // Add assignedAgentName column
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'assignedAgentName',
        type: 'varchar',
        length: '255',
        isNullable: true,
      })
    );

    // Add assignedAt column
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'assignedAt',
        type: 'timestamp',
        isNullable: true,
      })
    );

    // Add messages column (JSONB array)
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'messages',
        type: 'jsonb',
        default: "'[]'",
      })
    );

    // Add startedAt column
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'startedAt',
        type: 'timestamp',
        isNullable: true,
      })
    );

    // Add lastMessageAt column
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'lastMessageAt',
        type: 'timestamp',
        isNullable: true,
      })
    );

    // Add completedAt column
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'completedAt',
        type: 'timestamp',
        isNullable: true,
      })
    );

    // Add metadata column (JSONB)
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'metadata',
        type: 'jsonb',
        isNullable: true,
      })
    );

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversation_sessionId" ON "conversations" ("sessionId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversation_status" ON "conversations" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversation_assignedAgentId" ON "conversations" ("assignedAgentId");
    `);

    console.log('✅ Conversation table updated for human handoff functionality');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversation_assignedAgentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversation_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversation_sessionId"`);

    // Drop columns
    await queryRunner.dropColumn('conversations', 'metadata');
    await queryRunner.dropColumn('conversations', 'completedAt');
    await queryRunner.dropColumn('conversations', 'lastMessageAt');
    await queryRunner.dropColumn('conversations', 'startedAt');
    await queryRunner.dropColumn('conversations', 'messages');
    await queryRunner.dropColumn('conversations', 'assignedAt');
    await queryRunner.dropColumn('conversations', 'assignedAgentName');
    await queryRunner.dropColumn('conversations', 'assignedAgentId');
    await queryRunner.dropColumn('conversations', 'status');
    await queryRunner.dropColumn('conversations', 'mode');
    await queryRunner.dropColumn('conversations', 'guestId');
    await queryRunner.dropColumn('conversations', 'guestName');
    await queryRunner.dropColumn('conversations', 'sessionId');

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS conversation_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS conversation_mode_enum`);

    console.log('✅ Rolled back Conversation table changes');
  }
}
