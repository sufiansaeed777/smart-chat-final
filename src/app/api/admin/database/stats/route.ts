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

      // Get table sizes
      const tableStats = await queryRunner.query(`
        SELECT
          schemaname as schema,
          tablename as table,
          pg_size_pretty(pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(tablename))) as size
        FROM pg_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(tablename)) DESC
        LIMIT 10
      `);

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
