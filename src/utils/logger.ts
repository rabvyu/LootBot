type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  timestamp?: boolean;
  prefix?: string;
}

class Logger {
  private options: LogOptions;

  constructor(options: LogOptions = {}) {
    this.options = {
      timestamp: true,
      prefix: '[BOT]',
      ...options,
    };
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
    const timestamp = this.options.timestamp ? `[${new Date().toISOString()}]` : '';
    const prefix = this.options.prefix || '';
    const levelTag = `[${level.toUpperCase()}]`;

    let formattedMessage = `${timestamp} ${prefix} ${levelTag} ${message}`;

    if (args.length > 0) {
      formattedMessage += ' ' + args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
    }

    return formattedMessage;
  }

  info(message: string, ...args: unknown[]): void {
    console.log(this.formatMessage('info', message, ...args));
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage('warn', message, ...args));
  }

  error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage('error', message, ...args));
  }

  debug(message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, ...args));
    }
  }

  xp(userId: string, amount: number, source: string, details?: unknown): void {
    this.info(`XP: User ${userId} gained ${amount} XP from ${source}`, details || '');
  }

  levelUp(userId: string, oldLevel: number, newLevel: number): void {
    this.info(`LEVEL UP: User ${userId} leveled up from ${oldLevel} to ${newLevel}`);
  }

  badge(userId: string, badgeId: string, action: 'earned' | 'removed'): void {
    this.info(`BADGE: User ${userId} ${action} badge ${badgeId}`);
  }

  suspicious(userId: string, reason: string, details?: unknown): void {
    this.warn(`SUSPICIOUS: User ${userId} - ${reason}`, details || '');
  }

  antiExploit(userId: string, action: string, penalty?: number): void {
    this.warn(`ANTI-EXPLOIT: User ${userId} - ${action}${penalty ? ` (Penalty: ${penalty} XP)` : ''}`);
  }
}

export const logger = new Logger();
export default logger;
