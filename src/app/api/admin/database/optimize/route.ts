import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import { User } from '@/entities/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Check if user is admin
    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Run VACUUM ANALYZE on all tables for PostgreSQL optimization
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      // Get all table names
      const tables = await queryRunner.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
      `);

      const optimizationResults = [];

      // Run VACUUM ANALYZE on each table
      for (const table of tables) {
        try {
          await queryRunner.query(`VACUUM ANALYZE "${table.tablename}"`);
          optimizationResults.push({
            table: table.tablename,
            status: 'optimized',
            message: 'Successfully vacuumed and analyzed'
          });
        } catch (error) {
          console.error(`Error optimizing table ${table.tablename}:`, error);
          optimizationResults.push({
            table: table.tablename,
            status: 'failed',
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Get database statistics after optimization
      const dbStats = await queryRunner.query(`
        SELECT
          pg_database_size(current_database()) as size,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          current_database() as database_name
      `);

      return NextResponse.json({
        success: true,
        message: 'Database optimization completed',
        results: optimizationResults,
        statistics: {
          databaseSize: dbStats[0]?.size || 0,
          activeConnections: dbStats[0]?.active_connections || 0,
          databaseName: dbStats[0]?.database_name || 'unknown'
        }
      });

    } finally {
      await queryRunner.release();
    }

  } catch (error) {
    console.error('Error optimizing database:', error);
    return NextResponse.json(
      { error: 'Failed to optimize database' },
      { status: 500 }
    );
  }
}
