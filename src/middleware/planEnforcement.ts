/**
 * Plan Enforcement Middleware
 * Enforces subscription plan limits as per Phase 3 requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AppDataSource } from '@/config/database';

export interface PlanLimits {
  maxBots: number;
  maxChatsPerMonth: number;
  maxStorageMB: number;
  maxDocumentsPerBot: number;
  features: {
    customDomain: boolean;
    analytics: boolean;
    prioritySupport: boolean;
    whiteLabel: boolean;
  };
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxBots: 1,
    maxChatsPerMonth: 100,
    maxStorageMB: 50,
    maxDocumentsPerBot: 5,
    features: {
      customDomain: false,
      analytics: false,
      prioritySupport: false,
      whiteLabel: false
    }
  },
  basic: {
    maxBots: 3,
    maxChatsPerMonth: 1000,
    maxStorageMB: 500,
    maxDocumentsPerBot: 20,
    features: {
      customDomain: false,
      analytics: true,
      prioritySupport: false,
      whiteLabel: false
    }
  },
  professional: {
    maxBots: 10,
    maxChatsPerMonth: 10000,
    maxStorageMB: 5000,
    maxDocumentsPerBot: 100,
    features: {
      customDomain: true,
      analytics: true,
      prioritySupport: true,
      whiteLabel: false
    }
  },
  enterprise: {
    maxBots: -1, // Unlimited
    maxChatsPerMonth: -1, // Unlimited
    maxStorageMB: -1, // Unlimited
    maxDocumentsPerBot: -1, // Unlimited
    features: {
      customDomain: true,
      analytics: true,
      prioritySupport: true,
      whiteLabel: true
    }
  }
};

export async function checkPlanLimits(
  userId: string,
  limitType: 'bots' | 'chats' | 'storage' | 'documents'
): Promise<{ allowed: boolean; message?: string; currentUsage?: number; limit?: number }> {
  try {
    // Initialize database if needed
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository('users');
    const user = await userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      return { allowed: false, message: 'User not found' };
    }

    const plan = user.planType || 'free';
    const limits = PLAN_LIMITS[plan];

    if (!limits) {
      return { allowed: false, message: 'Invalid plan type' };
    }

    switch (limitType) {
      case 'bots': {
        if (limits.maxBots === -1) {
          return { allowed: true };
        }

        const botRepository = AppDataSource.getRepository('bots');
        const botCount = await botRepository.count({
          where: { createdBy: userId, status: 'active' }
        });

        if (botCount >= limits.maxBots) {
          return {
            allowed: false,
            message: `Bot limit reached. Your ${plan} plan allows ${limits.maxBots} bot(s).`,
            currentUsage: botCount,
            limit: limits.maxBots
          };
        }

        return { allowed: true, currentUsage: botCount, limit: limits.maxBots };
      }

      case 'chats': {
        if (limits.maxChatsPerMonth === -1) {
          return { allowed: true };
        }

        // Get current month's chat count
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const chatRepository = AppDataSource.getRepository('chat_sessions');
        const chatCount = await chatRepository
          .createQueryBuilder('chat')
          .where('chat.userId = :userId', { userId })
          .andWhere('chat.createdAt >= :startOfMonth', { startOfMonth })
          .getCount();

        if (chatCount >= limits.maxChatsPerMonth) {
          // Auto-suspend if limit exceeded
          await suspendUserServices(userId, 'Chat limit exceeded');

          return {
            allowed: false,
            message: `Monthly chat limit reached. Your ${plan} plan allows ${limits.maxChatsPerMonth} chats/month.`,
            currentUsage: chatCount,
            limit: limits.maxChatsPerMonth
          };
        }

        return { allowed: true, currentUsage: chatCount, limit: limits.maxChatsPerMonth };
      }

      case 'storage': {
        if (limits.maxStorageMB === -1) {
          return { allowed: true };
        }

        const documentRepository = AppDataSource.getRepository('documents');
        const result = await documentRepository
          .createQueryBuilder('doc')
          .select('SUM(doc.size)', 'totalSize')
          .where('doc.userId = :userId', { userId })
          .andWhere('doc.status = :status', { status: 'active' })
          .getRawOne();

        const usedMB = (result?.totalSize || 0) / (1024 * 1024);

        if (usedMB >= limits.maxStorageMB) {
          return {
            allowed: false,
            message: `Storage limit reached. Your ${plan} plan allows ${limits.maxStorageMB}MB.`,
            currentUsage: Math.round(usedMB),
            limit: limits.maxStorageMB
          };
        }

        return { allowed: true, currentUsage: Math.round(usedMB), limit: limits.maxStorageMB };
      }

      case 'documents': {
        if (limits.maxDocumentsPerBot === -1) {
          return { allowed: true };
        }

        // This check would be done per bot
        return { allowed: true, limit: limits.maxDocumentsPerBot };
      }

      default:
        return { allowed: false, message: 'Invalid limit type' };
    }
  } catch (error) {
    console.error('Error checking plan limits:', error);
    return { allowed: false, message: 'Error checking plan limits' };
  }
}

async function suspendUserServices(userId: string, reason: string): Promise<void> {
  try {
    const botRepository = AppDataSource.getRepository('bots');

    // Suspend all user's bots
    await botRepository
      .createQueryBuilder()
      .update()
      .set({
        status: 'suspended',
        suspensionReason: reason,
        suspendedAt: new Date()
      })
      .where('createdBy = :userId', { userId })
      .execute();

    console.log(`Suspended services for user ${userId}: ${reason}`);
  } catch (error) {
    console.error('Error suspending user services:', error);
  }
}

/**
 * Middleware to enforce plan limits on API routes
 */
export async function enforcePlanLimits(
  request: NextRequest,
  limitType: 'bots' | 'chats' | 'storage' | 'documents'
): Promise<NextResponse | null> {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from email
    const userRepository = AppDataSource.getRepository('users');
    const user = await userRepository.findOne({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const limitCheck = await checkPlanLimits(user.id, limitType);

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Plan limit exceeded',
          message: limitCheck.message,
          currentUsage: limitCheck.currentUsage,
          limit: limitCheck.limit,
          upgradeUrl: '/dashboard/billing'
        },
        { status: 403 }
      );
    }

    // Allow request to proceed
    return null;
  } catch (error) {
    console.error('Error enforcing plan limits:', error);
    // In case of error, allow request to proceed
    return null;
  }
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(userId: string): Promise<any> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository('users');
    const user = await userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      return null;
    }

    const plan = user.planType || 'free';
    const limits = PLAN_LIMITS[plan];

    // Get bot count
    const botRepository = AppDataSource.getRepository('bots');
    const botCount = await botRepository.count({
      where: { createdBy: userId, status: 'active' }
    });

    // Get monthly chat count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const chatRepository = AppDataSource.getRepository('chat_sessions');
    const chatCount = await chatRepository
      .createQueryBuilder('chat')
      .where('chat.userId = :userId', { userId })
      .andWhere('chat.createdAt >= :startOfMonth', { startOfMonth })
      .getCount();

    // Get storage usage
    const documentRepository = AppDataSource.getRepository('documents');
    const result = await documentRepository
      .createQueryBuilder('doc')
      .select('SUM(doc.size)', 'totalSize')
      .where('doc.userId = :userId', { userId })
      .andWhere('doc.status = :status', { status: 'active' })
      .getRawOne();

    const usedMB = (result?.totalSize || 0) / (1024 * 1024);

    return {
      plan,
      limits,
      usage: {
        bots: {
          used: botCount,
          limit: limits.maxBots,
          percentage: limits.maxBots === -1 ? 0 : Math.round((botCount / limits.maxBots) * 100)
        },
        chats: {
          used: chatCount,
          limit: limits.maxChatsPerMonth,
          percentage: limits.maxChatsPerMonth === -1 ? 0 : Math.round((chatCount / limits.maxChatsPerMonth) * 100)
        },
        storage: {
          usedMB: Math.round(usedMB),
          limitMB: limits.maxStorageMB,
          percentage: limits.maxStorageMB === -1 ? 0 : Math.round((usedMB / limits.maxStorageMB) * 100)
        }
      },
      features: limits.features
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return null;
  }
}