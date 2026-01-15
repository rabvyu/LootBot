import { logger } from '../utils/logger';

interface UserRateLimit {
  lastCommand: number;
  hourlyCommands: { timestamp: number; count: number };
  dailyCommands: { date: string; count: number };
}

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}

// Rate limit configuration
const RATE_LIMITS = {
  general: {
    cooldownMs: 10 * 60 * 1000, // 10 minutes
    maxPerHour: 3,
    maxPerDay: 10,
  },
  dedicated: {
    cooldownMs: 0,
    maxPerHour: Infinity,
    maxPerDay: Infinity,
  },
};

// Dedicated bot channel name (case insensitive)
const DEDICATED_CHANNEL_NAME = 'lootbot';

// Roles that are exempt from rate limiting (case insensitive)
const EXEMPT_ROLES = ['fundadores', 'fundador', 'admin', 'admins', 'administrador', 'administradores'];

class RateLimitService {
  private userLimits: Map<string, UserRateLimit> = new Map();

  isDedicatedChannel(channelName: string): boolean {
    return channelName.toLowerCase() === DEDICATED_CHANNEL_NAME;
  }

  isExemptRole(roleNames: string[]): boolean {
    return roleNames.some(role =>
      EXEMPT_ROLES.includes(role.toLowerCase())
    );
  }

  checkRateLimit(userId: string, channelName: string, userRoles?: string[]): RateLimitResult {
    // Dedicated channel has no limits
    if (this.isDedicatedChannel(channelName)) {
      return { allowed: true };
    }

    // Check if user has exempt role
    if (userRoles && this.isExemptRole(userRoles)) {
      return { allowed: true };
    }

    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    const hourAgo = now - 60 * 60 * 1000;

    let userLimit = this.userLimits.get(userId);

    if (!userLimit) {
      userLimit = {
        lastCommand: 0,
        hourlyCommands: { timestamp: now, count: 0 },
        dailyCommands: { date: today, count: 0 },
      };
      this.userLimits.set(userId, userLimit);
    }

    // Reset daily counter if new day
    if (userLimit.dailyCommands.date !== today) {
      userLimit.dailyCommands = { date: today, count: 0 };
    }

    // Reset hourly counter if hour passed
    if (userLimit.hourlyCommands.timestamp < hourAgo) {
      userLimit.hourlyCommands = { timestamp: now, count: 0 };
    }

    const limits = RATE_LIMITS.general;

    // Check daily limit
    if (userLimit.dailyCommands.count >= limits.maxPerDay) {
      return {
        allowed: false,
        reason: `Você atingiu o limite de **${limits.maxPerDay} comandos por dia** neste canal.\nUse o canal **#LootBot** para comandos ilimitados!`,
      };
    }

    // Check hourly limit
    if (userLimit.hourlyCommands.count >= limits.maxPerHour) {
      const nextHour = userLimit.hourlyCommands.timestamp + 60 * 60 * 1000;
      const retryAfter = Math.ceil((nextHour - now) / 60000);
      return {
        allowed: false,
        reason: `Você atingiu o limite de **${limits.maxPerHour} comandos por hora** neste canal.\nTente novamente em **${retryAfter} minutos** ou use o canal **#LootBot**!`,
        retryAfter,
      };
    }

    // Check cooldown
    const timeSinceLastCommand = now - userLimit.lastCommand;
    if (timeSinceLastCommand < limits.cooldownMs) {
      const retryAfter = Math.ceil((limits.cooldownMs - timeSinceLastCommand) / 60000);
      return {
        allowed: false,
        reason: `Aguarde **${retryAfter} minutos** entre comandos neste canal.\nOu use o canal **#LootBot** para comandos ilimitados!`,
        retryAfter,
      };
    }

    return { allowed: true };
  }

  recordCommand(userId: string, channelName: string, userRoles?: string[]): void {
    // Don't record for dedicated channel or exempt roles
    if (this.isDedicatedChannel(channelName)) {
      return;
    }

    if (userRoles && this.isExemptRole(userRoles)) {
      return;
    }

    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

    let userLimit = this.userLimits.get(userId);

    if (!userLimit) {
      userLimit = {
        lastCommand: now,
        hourlyCommands: { timestamp: now, count: 1 },
        dailyCommands: { date: today, count: 1 },
      };
      this.userLimits.set(userId, userLimit);
      return;
    }

    userLimit.lastCommand = now;
    userLimit.hourlyCommands.count++;
    userLimit.dailyCommands.count++;

    logger.debug(`Rate limit recorded for user ${userId}: hourly=${userLimit.hourlyCommands.count}, daily=${userLimit.dailyCommands.count}`);
  }

  getUserStats(userId: string, channelName: string, userRoles?: string[]): {
    isDedicated: boolean;
    isExempt: boolean;
    hourlyUsed: number;
    hourlyMax: number;
    dailyUsed: number;
    dailyMax: number;
    cooldownRemaining: number;
  } {
    const isDedicated = this.isDedicatedChannel(channelName);
    const isExempt = userRoles ? this.isExemptRole(userRoles) : false;

    if (isDedicated || isExempt) {
      return {
        isDedicated,
        isExempt,
        hourlyUsed: 0,
        hourlyMax: Infinity,
        dailyUsed: 0,
        dailyMax: Infinity,
        cooldownRemaining: 0,
      };
    }

    const userLimit = this.userLimits.get(userId);
    const limits = RATE_LIMITS.general;
    const now = Date.now();

    if (!userLimit) {
      return {
        isDedicated: false,
        isExempt: false,
        hourlyUsed: 0,
        hourlyMax: limits.maxPerHour,
        dailyUsed: 0,
        dailyMax: limits.maxPerDay,
        cooldownRemaining: 0,
      };
    }

    const cooldownRemaining = Math.max(0, limits.cooldownMs - (now - userLimit.lastCommand));

    return {
      isDedicated: false,
      isExempt: false,
      hourlyUsed: userLimit.hourlyCommands.count,
      hourlyMax: limits.maxPerHour,
      dailyUsed: userLimit.dailyCommands.count,
      dailyMax: limits.maxPerDay,
      cooldownRemaining: Math.ceil(cooldownRemaining / 60000),
    };
  }

  // Clean up old entries periodically
  cleanup(): void {
    const now = Date.now();
    const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    for (const [userId, limit] of this.userLimits.entries()) {
      if (limit.dailyCommands.date < yesterday) {
        this.userLimits.delete(userId);
      }
    }
  }
}

export const rateLimitService = new RateLimitService();
export default rateLimitService;
