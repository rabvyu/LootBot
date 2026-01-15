// XP Configuration
export const XP_CONFIG = {
  // Base XP gains
  // Messages: 1-5 XP based on length
  MESSAGE_XP_MIN: 1,
  MESSAGE_XP_MAX: 5,
  // Voice: 1 XP per minute per (pessoas - 1) na call
  VOICE_XP_BASE: 1, // Base multiplied by (members - 1)
  REACTION_GIVEN_XP: 1,
  REACTION_RECEIVED_XP: 2,
  DAILY_CHECK_IN_XP: 50,
  STREAK_BONUS_XP: 5,
  INVITE_XP: 100,
  BOOST_XP: 500,

  // Cooldowns (in milliseconds)
  MESSAGE_COOLDOWN: 60 * 1000, // 60 seconds
  REACTION_COOLDOWN: 30 * 1000, // 30 seconds
  VOICE_CHECK_INTERVAL: 60 * 1000, // 1 minute

  // Daily limits (adjusted for lower XP values)
  DAILY_LIMITS: {
    total: 500,
    messages: 200,
    voice: 150,
    reactions: 50,
    invites: 500,
  },

  // Minimum requirements
  MIN_MESSAGE_LENGTH: 5,
  MIN_VOICE_MEMBERS: 2,

  // Invite validation
  INVITE_VALIDATION_DAYS: 7,
  INVITE_MIN_STAY_HOURS: 24,
  MAX_INVITES_PER_DAY: 5,
};

// Multipliers
export const MULTIPLIERS = {
  PEAK_HOURS: 1.2, // 19h-23h
  WEEKEND: 1.3,
  EVENT: 2.0,
  BOOSTER: 1.5,
  STREAK_7_DAYS: 1.25,
};

// Peak hours (24h format)
export const PEAK_HOURS = {
  START: 19,
  END: 23,
};

// Anti-Exploit Configuration
export const ANTI_EXPLOIT = {
  // Spam detection
  MAX_MESSAGES_IN_WINDOW: 5,
  SPAM_WINDOW_SECONDS: 10,
  SPAM_PENALTY_XP: 50,
  SPAM_TIMEOUT_MINUTES: 5,

  // Flood detection
  FLOOD_THRESHOLD: 10,
  FLOOD_WINDOW_SECONDS: 30,

  // Repeated message detection
  MESSAGE_HISTORY_SIZE: 10,
  SIMILAR_MESSAGE_THRESHOLD: 0.8,

  // Voice abuse
  MAX_MUTED_MINUTES: 5,
  MIN_VOICE_ACTIVITY_PERCENT: 20,
};

// Badge Definitions
export const BADGES = {
  // Level badges
  LEVEL: [
    { id: 'level_5', name: 'Iniciante', description: 'Alcance o nivel 5', icon: '🌱', level: 5, rarity: 'common' as const },
    { id: 'level_10', name: 'Ativo', description: 'Alcance o nivel 10', icon: '⚡', level: 10, rarity: 'common' as const },
    { id: 'level_25', name: 'Dedicado', description: 'Alcance o nivel 25', icon: '🔥', level: 25, rarity: 'uncommon' as const },
    { id: 'level_50', name: 'Veterano', description: 'Alcance o nivel 50', icon: '💎', level: 50, rarity: 'rare' as const },
    { id: 'level_100', name: 'Lenda', description: 'Alcance o nivel 100', icon: '👑', level: 100, rarity: 'legendary' as const },
  ],

  // Time badges (days)
  TIME: [
    { id: 'time_7d', name: 'Novato', description: 'Membro por 1 semana', icon: '📅', days: 7, rarity: 'common' as const },
    { id: 'time_30d', name: 'Membro', description: 'Membro por 1 mes', icon: '🗓️', days: 30, rarity: 'common' as const },
    { id: 'time_90d', name: 'Fiel', description: 'Membro por 3 meses', icon: '📆', days: 90, rarity: 'uncommon' as const },
    { id: 'time_180d', name: 'Antigo', description: 'Membro por 6 meses', icon: '🏛️', days: 180, rarity: 'rare' as const },
    { id: 'time_365d', name: 'Fundador', description: 'Membro por 1 ano', icon: '🏆', days: 365, rarity: 'epic' as const },
  ],

  // Achievement badges
  ACHIEVEMENT: [
    { id: 'night_owl', name: 'Madrugador', description: '100 mensagens entre 00h-06h', icon: '🌙', requirement: { type: 'night_messages', value: 100 }, rarity: 'uncommon' as const },
    { id: 'social', name: 'Social', description: '1000 reacoes dadas', icon: '💬', requirement: { type: 'reactions_given', value: 1000 }, rarity: 'uncommon' as const },
    { id: 'popular', name: 'Popular', description: '500 reacoes recebidas', icon: '⭐', requirement: { type: 'reactions_received', value: 500 }, rarity: 'rare' as const },
    { id: 'vocalist', name: 'Vocalista', description: '50 horas em call', icon: '🎤', requirement: { type: 'voice_hours', value: 50 }, rarity: 'rare' as const },
    { id: 'streak_master', name: 'Streak Master', description: '30 dias consecutivos', icon: '🔥', requirement: { type: 'streak', value: 30 }, rarity: 'epic' as const },
    { id: 'top_weekly', name: 'Top Semanal', description: '#1 da semana', icon: '🥇', requirement: { type: 'top_weekly', value: 1 }, rarity: 'rare' as const },
    { id: 'top_monthly', name: 'Top Mensal', description: '#1 do mes', icon: '🏅', requirement: { type: 'top_monthly', value: 1 }, rarity: 'epic' as const },
    { id: 'recruiter', name: 'Recrutador', description: '10 convites validos', icon: '📨', requirement: { type: 'invites', value: 10 }, rarity: 'rare' as const },
    { id: 'early_adopter', name: 'Early Adopter', description: 'Primeiros 100 membros', icon: '🌟', requirement: { type: 'early_member', value: 100 }, rarity: 'legendary' as const },
    { id: 'booster', name: 'Booster', description: 'Dar boost no servidor', icon: '💜', requirement: { type: 'boost', value: 1 }, rarity: 'epic' as const },
    { id: 'chatterbox', name: 'Tagarela', description: '10000 mensagens enviadas', icon: '💭', requirement: { type: 'messages', value: 10000 }, rarity: 'epic' as const },
    { id: 'helper', name: 'Ajudante', description: 'Ajudar 50 membros (manual)', icon: '🤝', requirement: { type: 'manual', value: 0 }, rarity: 'rare' as const },
  ],

  // Special/VIP badges
  SPECIAL: [
    { id: 'staff', name: 'Staff', description: 'Membro da equipe', icon: '🛡️', rarity: 'legendary' as const },
    { id: 'moderator', name: 'Moderador', description: 'Moderador do servidor', icon: '⚔️', rarity: 'epic' as const },
    { id: 'contributor', name: 'Contribuidor', description: 'Contribuiu para comunidade', icon: '💡', rarity: 'rare' as const },
    { id: 'vip', name: 'VIP', description: 'Status especial', icon: '💠', rarity: 'epic' as const },
    { id: 'partner', name: 'Parceiro', description: 'Parceiro oficial', icon: '🤝', rarity: 'legendary' as const },
    { id: 'bug_hunter', name: 'Bug Hunter', description: 'Reportou bug valido', icon: '🐛', rarity: 'rare' as const },
  ],
};

// Level calculation
export const LEVEL_CONFIG = {
  BASE_XP: 100,
  EXPONENT: 1.5,
};

// Colors for embeds
export const COLORS = {
  PRIMARY: 0x5865F2, // Discord Blurple
  SUCCESS: 0x57F287, // Green
  WARNING: 0xFEE75C, // Yellow
  ERROR: 0xED4245, // Red
  XP: 0xFFD700, // Gold
  LEVEL_UP: 0x00FF00, // Bright Green
  BADGE: 0x9B59B6, // Purple
};

// Rarity colors
export const RARITY_COLORS = {
  common: 0x9E9E9E,
  uncommon: 0x4CAF50,
  rare: 0x2196F3,
  epic: 0x9C27B0,
  legendary: 0xFF9800,
};
