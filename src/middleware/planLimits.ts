/**
 * Plan-Based Limits Configuration
 * Defines limits for different subscription tiers
 */

export interface PlanLimits {
  name: string;
  monthlyMessages: number;
  maxBots: number;
  maxUsers: number;
  maxDocuments: number;
  maxStorageMB: number;
  features: string[];
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    name: 'Free',
    monthlyMessages: 100,
    maxBots: 1,
    maxUsers: 0, // No team members
    maxDocuments: 5,
    maxStorageMB: 50,
    features: ['basic_chat', 'wordpress_plugin'],
  },
  basic: {
    name: 'Basic',
    monthlyMessages: 1000,
    maxBots: 3,
    maxUsers: 2,
    maxDocuments: 20,
    maxStorageMB: 500,
    features: ['basic_chat', 'wordpress_plugin', 'document_training', 'email_support'],
  },
  pro: {
    name: 'Pro',
    monthlyMessages: 10000,
    maxBots: 10,
    maxUsers: 10,
    maxDocuments: 100,
    maxStorageMB: 5000,
    features: [
      'basic_chat',
      'wordpress_plugin',
      'document_training',
      'n8n_rag',
      'priority_support',
      'custom_branding',
      'analytics',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    monthlyMessages: -1, // Unlimited
    maxBots: -1, // Unlimited
    maxUsers: -1, // Unlimited
    maxDocuments: -1, // Unlimited
    maxStorageMB: -1, // Unlimited
    features: [
      'basic_chat',
      'wordpress_plugin',
      'document_training',
      'n8n_rag',
      'priority_support',
      'custom_branding',
      'analytics',
      'dedicated_support',
      'custom_integrations',
      'sla',
    ],
  },
};

/**
 * Check if user has exceeded their plan limits
 */
export function checkLimit(
  currentValue: number,
  limit: number,
  type: 'messages' | 'bots' | 'users' | 'documents' | 'storage'
): { allowed: boolean; message?: string } {
  // Unlimited (-1)
  if (limit === -1) {
    return { allowed: true };
  }

  if (currentValue >= limit) {
    const messages = {
      messages: `You've reached your monthly message limit (${limit}). Upgrade your plan to continue.`,
      bots: `You've reached your bot limit (${limit}). Upgrade to create more bots.`,
      users: `You've reached your team member limit (${limit}). Upgrade to add more users.`,
      documents: `You've reached your document limit (${limit}). Upgrade to upload more documents.`,
      storage: `You've reached your storage limit (${limit}MB). Upgrade for more storage.`,
    };

    return {
      allowed: false,
      message: messages[type],
    };
  }

  return { allowed: true };
}

/**
 * Get user's current plan limits
 */
export function getUserPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Check if user has a specific feature
 */
export function hasFeature(plan: string, feature: string): boolean {
  const limits = getUserPlanLimits(plan);
  return limits.features.includes(feature);
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(current: number, limit: number): number {
  if (limit === -1) return 0; // Unlimited
  if (limit === 0) return 100; // No limit means maxed out
  return Math.round((current / limit) * 100);
}
