import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository('users');
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get database statistics
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      // Get database size
      const sizeResult = await queryRunner.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);

      // Get table sizes - wrap in try-catch to handle any missing tables
      let tableStats = [];
      try {
        tableStats = await queryRunner.query(`
          SELECT
            t.schemaname as schema,
            t.tablename as table,
            pg_size_pretty(pg_total_relation_size('"' || t.schemaname || '"."' || t.tablename || '"')) as size,
            pg_total_relation_size('"' || t.schemaname || '"."' || t.tablename || '"') as size_bytes
          FROM pg_tables t
          WHERE t.schemaname = 'public'
          ORDER BY size_bytes DESC
          LIMIT 10
        `);
      } catch (tableError) {
        console.error('Error fetching table sizes:', tableError);
        tableStats = [];
      }

      // Get connection stats
      const connectionStats = await queryRunner.query(`
        SELECT
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);

      // Get cache hit ratio
      const cacheStats = await queryRunner.query(`
        SELECT
          sum(heap_blks_read) as heap_read,
          sum(heap_blks_hit) as heap_hit,
          CASE
            WHEN sum(heap_blks_hit) + sum(heap_blks_read) = 0 THEN 0
            ELSE (sum(heap_blks_hit) * 100.0 / (sum(heap_blks_hit) + sum(heap_blks_read)))
          END as cache_hit_ratio
        FROM pg_statio_user_tables
      `);

      return NextResponse.json({
        success: true,
        stats: {
          databaseSize: sizeResult[0]?.size || 'Unknown',
          activeConnections: connectionStats[0]?.active_connections || 0,
          totalConnections: connectionStats[0]?.total_connections || 0,
          idleConnections: connectionStats[0]?.idle_connections || 0,
          cacheHitRatio: cacheStats[0]?.cache_hit_ratio
            ? parseFloat(cacheStats[0].cache_hit_ratio).toFixed(2) + '%'
            : '0%',
          topTables: tableStats
        },
        timestamp: new Date().toISOString()
      });

    } finally {
      await queryRunner.release();
    }

  } catch (error) {
    console.error('Error fetching database stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
