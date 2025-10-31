import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppDataSource } from '@/config/database';
import os from 'os';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);

    const cpus = os.cpus();
    const cpuCount = cpus.length;
    
    const cpuUsage = cpus.map(cpu => {
      const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
      const idle = cpu.times.idle;
      return ((1 - idle / total) * 100).toFixed(2);
    });
    const avgCpuUsage = (cpuUsage.reduce((acc, usage) => acc + parseFloat(usage), 0) / cpuCount).toFixed(2);

    const uptime = os.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeDays = Math.floor(uptimeHours / 24);

    let dbStatus = 'disconnected';
    let dbResponseTime = 0;
    try {
      const startTime = Date.now();
      await AppDataSource.query('SELECT 1');
      dbResponseTime = Date.now() - startTime;
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
    }

    return NextResponse.json({
      success: true,
      system: {
        memory: {
          total: (totalMemory / 1024 / 1024 / 1024).toFixed(2) + ' GB',
          used: (usedMemory / 1024 / 1024 / 1024).toFixed(2) + ' GB',
          free: (freeMemory / 1024 / 1024 / 1024).toFixed(2) + ' GB',
          usagePercent: memoryUsagePercent,
          status: parseFloat(memoryUsagePercent) > 90 ? 'critical' : parseFloat(memoryUsagePercent) > 75 ? 'warning' : 'healthy'
        },
        cpu: {
          count: cpuCount,
          model: cpus[0].model,
          usagePercent: avgCpuUsage,
          cores: cpuUsage,
          status: parseFloat(avgCpuUsage) > 90 ? 'critical' : parseFloat(avgCpuUsage) > 75 ? 'warning' : 'healthy'
        },
        uptime: {
          seconds: uptime,
          formatted: uptimeDays + 'd ' + (uptimeHours % 24) + 'h',
          days: uptimeDays
        },
        database: {
          status: dbStatus,
          responseTime: dbResponseTime + 'ms',
          health: dbResponseTime < 100 ? 'excellent' : dbResponseTime < 500 ? 'good' : 'slow'
        },
        platform: os.platform(),
        hostname: os.hostname(),
        nodeVersion: process.version
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching system health:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
