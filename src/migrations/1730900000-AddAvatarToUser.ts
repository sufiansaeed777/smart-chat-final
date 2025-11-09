import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAvatarToUser1730900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if avatar column already exists
    const table = await queryRunner.getTable('users');
    const avatarColumn = table?.findColumnByName('avatar');

    if (!avatarColumn) {
      // Add avatar column to users table
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'avatar',
          type: 'text',
          isNullable: true,
        })
      );

      console.log('✅ Avatar column added to users table');
    } else {
      console.log('ℹ️  Avatar column already exists in users table');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop avatar column
    await queryRunner.dropColumn('users', 'avatar');

    console.log('✅ Rolled back avatar column from users table');
  }
}
