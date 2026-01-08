/**
 * Plan-Based Limits Configuration
 * Defines limits for different subscription tiers
 */

export interface PlanLimits {
  name: string;
  monthlyMessages: number;
  monthlyHumanMessages: number;
  maxBots: number;
  maxUsers: number;
  maxDocuments: number;
  maxStorageMB: number;
  maxFileSizeKB: number;
  features: string[];
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    name: 'Free Trial',
    monthlyMessages: 100, // 100 AI messages
    monthlyHumanMessages: 100, // 100 Human messages
    maxBots: 1,
    maxUsers: 1,
    maxDocuments: 5,
    maxStorageMB: 20,
    maxFileSizeKB: 50, // 50KB per file
    features: [
      'basic_chat',
      'wordpress_plugin',
      'basic_analytics',
      'csv_export',
      'ai_support',
    ],
  },
  basic: {
    name: 'Basic',
    monthlyMessages: 1000, // 1000 AI messages
    monthlyHumanMessages: 1000, // 1000 Human messages
    maxBots: 2,
    maxUsers: 2,
    maxDocuments: 20,
    maxStorageMB: 50,
    maxFileSizeKB: 500, // 500KB per file
    features: [
      'basic_chat',
      'wordpress_plugin',
      'document_training',
      'advanced_analytics',
      'csv_export',
      'privacy_tools',
      'email_support',
    ],
  },
  pro: {
    name: 'Pro',
    monthlyMessages: 5000, // 5000 AI messages
    monthlyHumanMessages: 5000, // 5000 Human messages
    maxBots: 5,
    maxUsers: 5,
    maxDocuments: 100,
    maxStorageMB: 200,
    maxFileSizeKB: 5120, // 5MB per file
    features: [
      'basic_chat',
      'wordpress_plugin',
      'document_training',
      'n8n_rag',
      'advanced_analytics',
      'pdf_excel_csv_export',
      'weekly_reports',
      'custom_branding',
      'multi_language',
      'chat_scheduling',
      'privacy_tools',
      'priority_support',
    ],
  },
};

/**
 * Check if user has exceeded their plan limits
 */
export function checkLimit(
  currentValue: number,
  limit: number,
  type: 'messages' | 'human_messages' | 'bots' | 'users' | 'documents' | 'storage' | 'filesize'
): { allowed: boolean; message?: string } {
  // Unlimited (-1)
  if (limit === -1) {
    return { allowed: true };
  }

  if (currentValue >= limit) {
    const messages = {
      messages: `You've reached your monthly AI message limit (${limit}). Upgrade your plan to continue.`,
      human_messages: `You've reached your monthly human message limit (${limit}). Upgrade your plan to continue.`,
      bots: `You've reached your bot limit (${limit}). Upgrade to create more bots.`,
      users: `You've reached your team member limit (${limit}). Upgrade to add more users.`,
      documents: `You've reached your document limit (${limit}). Upgrade to upload more documents.`,
      storage: `You've reached your storage limit (${limit}MB). Upgrade for more storage.`,
      filesize: `File exceeds maximum size limit (${limit}KB). Upgrade your plan for larger file uploads.`,
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
