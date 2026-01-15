import { LEVEL_CONFIG, PEAK_HOURS, MULTIPLIERS } from './constants';

/**
 * Calculate XP required for a specific level
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(LEVEL_CONFIG.BASE_XP * Math.pow(level, LEVEL_CONFIG.EXPONENT));
}

/**
 * Calculate total XP required to reach a level (cumulative)
 */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

/**
 * Calculate level from total XP
 */
export function levelFromXp(totalXp: number): number {
  let level = 0;
  let xpNeeded = 0;

  while (xpNeeded <= totalXp) {
    level++;
    xpNeeded += xpForLevel(level);
  }

  return Math.max(1, level - 1);
}

/**
 * Calculate progress to next level (0-100%)
 */
export function progressToNextLevel(currentXp: number, level: number): number {
  const xpForCurrentLevel = totalXpForLevel(level);
  const xpForNextLevel = totalXpForLevel(level + 1);
  const xpInCurrentLevel = currentXp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;

  return Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100));
}

/**
 * Get XP needed for next level
 */
export function xpNeededForNextLevel(currentXp: number, level: number): number {
  const xpForNextLevel = totalXpForLevel(level + 1);
  return Math.max(0, xpForNextLevel - currentXp);
}

/**
 * Generate random XP within a range
 */
export function randomXp(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if current time is within peak hours
 */
export function isPeakHours(): boolean {
  const hour = new Date().getHours();
  return hour >= PEAK_HOURS.START && hour <= PEAK_HOURS.END;
}

/**
 * Check if current day is weekend
 */
export function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

/**
 * Check if current time is night (00h-06h)
 */
export function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 0 && hour < 6;
}

/**
 * Calculate total multiplier based on conditions
 */
export function calculateMultiplier(options: {
  isBooster?: boolean;
  streakDays?: number;
  eventActive?: boolean;
}): number {
  let multiplier = 1;

  if (isPeakHours()) {
    multiplier *= MULTIPLIERS.PEAK_HOURS;
  }

  if (isWeekend()) {
    multiplier *= MULTIPLIERS.WEEKEND;
  }

  if (options.eventActive) {
    multiplier *= MULTIPLIERS.EVENT;
  }

  if (options.isBooster) {
    multiplier *= MULTIPLIERS.BOOSTER;
  }

  if (options.streakDays && options.streakDays >= 7) {
    multiplier *= MULTIPLIERS.STREAK_7_DAYS;
  }

  return multiplier;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if a date was yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

/**
 * Get start of day for a date
 */
export function startOfDay(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get start of week (Monday)
 */
export function startOfWeek(date: Date = new Date()): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get start of month
 */
export function startOfMonth(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('pt-BR');
}

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/**
 * Create progress bar string
 */
export function createProgressBar(progress: number, length: number = 10): string {
  const filled = Math.round((progress / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Generate simple hash for string (for spam detection)
 */
export function simpleHash(str: string): string {
  let hash = 0;
  const normalizedStr = str.toLowerCase().replace(/\s+/g, '');

  for (let i = 0; i < normalizedStr.length; i++) {
    const char = normalizedStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return hash.toString(16);
}

/**
 * Calculate string similarity (Jaccard index)
 */
export function stringSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.toLowerCase().split(''));
  const set2 = new Set(str2.toLowerCase().split(''));

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Get ordinal suffix for number (1st, 2nd, 3rd, etc.)
 */
export function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
