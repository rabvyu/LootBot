// Sistema de Conquistas
import {
  AchievementCategory,
  AchievementRarity,
  AchievementRequirement,
  AchievementReward,
} from '../../database/models/Achievement';

// Re-export types
export { AchievementCategory, AchievementRarity };

// Interface para definição de conquista
export interface AchievementData {
  achievementId: string;
  name: string;
  description: string;
  emoji: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  points: number;
  secret: boolean;
  requirement: AchievementRequirement;
  rewards: AchievementReward[];
}

// Cores por raridade
export const RARITY_COLORS: Record<AchievementRarity, number> = {
  common: 0x9E9E9E,
  uncommon: 0x4CAF50,
  rare: 0x2196F3,
  epic: 0x9C27B0,
  legendary: 0xFF9800,
  mythic: 0xE91E63,
};

// Emojis por raridade
export const RARITY_EMOJIS: Record<AchievementRarity, string> = {
  common: '⬜',
  uncommon: '🟢',
  rare: '🔵',
  epic: '🟣',
  legendary: '🟡',
  mythic: '🔴',
};

// ==================== CONQUISTAS ====================

export const ACHIEVEMENTS: AchievementData[] = [
  // ==================== COMBATE ====================
  {
    achievementId: 'first_blood',
    name: 'Primeiro Sangue',
    description: 'Derrote seu primeiro monstro',
    emoji: '🗡️',
    category: 'combat',
    rarity: 'common',
    points: 5,
    secret: false,
    requirement: { type: 'monstersKilled', target: 1, description: 'Derrotar 1 monstro' },
    rewards: [{ type: 'coins', quantity: 100 }, { type: 'xp', quantity: 50 }],
  },
  {
    achievementId: 'monster_hunter',
    name: 'Caçador de Monstros',
    description: 'Derrote 100 monstros',
    emoji: '⚔️',
    category: 'combat',
    rarity: 'uncommon',
    points: 15,
    secret: false,
    requirement: { type: 'monstersKilled', target: 100, description: 'Derrotar 100 monstros' },
    rewards: [{ type: 'coins', quantity: 1000 }, { type: 'xp', quantity: 500 }],
  },
  {
    achievementId: 'monster_slayer',
    name: 'Exterminador',
    description: 'Derrote 1.000 monstros',
    emoji: '💀',
    category: 'combat',
    rarity: 'rare',
    points: 30,
    secret: false,
    requirement: { type: 'monstersKilled', target: 1000, description: 'Derrotar 1.000 monstros' },
    rewards: [
      { type: 'coins', quantity: 10000 },
      { type: 'title', itemId: 'monster_slayer', quantity: 1 },
    ],
  },
  {
    achievementId: 'genocide',
    name: 'Genocida',
    description: 'Derrote 10.000 monstros',
    emoji: '☠️',
    category: 'combat',
    rarity: 'legendary',
    points: 100,
    secret: false,
    requirement: { type: 'monstersKilled', target: 10000, description: 'Derrotar 10.000 monstros' },
    rewards: [
      { type: 'coins', quantity: 100000 },
      { type: 'title', itemId: 'genocide', quantity: 1 },
      { type: 'material', itemId: 'legendary_core', quantity: 1 },
    ],
  },
  {
    achievementId: 'boss_slayer',
    name: 'Mata-Bosses',
    description: 'Derrote 10 bosses',
    emoji: '👹',
    category: 'combat',
    rarity: 'rare',
    points: 25,
    secret: false,
    requirement: { type: 'bossesKilled', target: 10, description: 'Derrotar 10 bosses' },
    rewards: [{ type: 'coins', quantity: 5000 }, { type: 'material', itemId: 'boss_essence', quantity: 5 }],
  },
  {
    achievementId: 'legendary_hunter',
    name: 'Caçador Lendário',
    description: 'Derrote 100 bosses',
    emoji: '🐉',
    category: 'combat',
    rarity: 'legendary',
    points: 75,
    secret: false,
    requirement: { type: 'bossesKilled', target: 100, description: 'Derrotar 100 bosses' },
    rewards: [
      { type: 'coins', quantity: 50000 },
      { type: 'title', itemId: 'legendary_hunter', quantity: 1 },
    ],
  },

  // ==================== PROGRESSÃO ====================
  {
    achievementId: 'level_10',
    name: 'Aventureiro',
    description: 'Alcance o nível 10',
    emoji: '📈',
    category: 'progression',
    rarity: 'common',
    points: 10,
    secret: false,
    requirement: { type: 'maxLevel', target: 10, description: 'Alcançar nível 10' },
    rewards: [{ type: 'coins', quantity: 500 }],
  },
  {
    achievementId: 'level_25',
    name: 'Guerreiro',
    description: 'Alcance o nível 25',
    emoji: '⚔️',
    category: 'progression',
    rarity: 'uncommon',
    points: 20,
    secret: false,
    requirement: { type: 'maxLevel', target: 25, description: 'Alcançar nível 25' },
    rewards: [{ type: 'coins', quantity: 2500 }],
  },
  {
    achievementId: 'level_50',
    name: 'Veterano',
    description: 'Alcance o nível 50',
    emoji: '🛡️',
    category: 'progression',
    rarity: 'rare',
    points: 40,
    secret: false,
    requirement: { type: 'maxLevel', target: 50, description: 'Alcançar nível 50' },
    rewards: [
      { type: 'coins', quantity: 10000 },
      { type: 'title', itemId: 'veteran', quantity: 1 },
    ],
  },
  {
    achievementId: 'level_75',
    name: 'Herói',
    description: 'Alcance o nível 75',
    emoji: '🦸',
    category: 'progression',
    rarity: 'epic',
    points: 60,
    secret: false,
    requirement: { type: 'maxLevel', target: 75, description: 'Alcançar nível 75' },
    rewards: [
      { type: 'coins', quantity: 25000 },
      { type: 'title', itemId: 'hero', quantity: 1 },
    ],
  },
  {
    achievementId: 'level_100',
    name: 'Lenda',
    description: 'Alcance o nível máximo 100',
    emoji: '👑',
    category: 'progression',
    rarity: 'legendary',
    points: 100,
    secret: false,
    requirement: { type: 'maxLevel', target: 100, description: 'Alcançar nível 100' },
    rewards: [
      { type: 'coins', quantity: 100000 },
      { type: 'title', itemId: 'legend', quantity: 1 },
      { type: 'material', itemId: 'legendary_core', quantity: 3 },
    ],
  },

  // ==================== EXPLORAÇÃO ====================
  {
    achievementId: 'first_dungeon',
    name: 'Explorador',
    description: 'Complete sua primeira dungeon',
    emoji: '🏰',
    category: 'exploration',
    rarity: 'common',
    points: 10,
    secret: false,
    requirement: { type: 'dungeonsCompleted', target: 1, description: 'Completar 1 dungeon' },
    rewards: [{ type: 'coins', quantity: 500 }],
  },
  {
    achievementId: 'dungeon_crawler',
    name: 'Dungeon Crawler',
    description: 'Complete 25 dungeons',
    emoji: '🕳️',
    category: 'exploration',
    rarity: 'rare',
    points: 35,
    secret: false,
    requirement: { type: 'dungeonsCompleted', target: 25, description: 'Completar 25 dungeons' },
    rewards: [{ type: 'coins', quantity: 10000 }, { type: 'material', itemId: 'dungeon_key', quantity: 5 }],
  },
  {
    achievementId: 'dungeon_master',
    name: 'Mestre das Dungeons',
    description: 'Complete 100 dungeons',
    emoji: '🏛️',
    category: 'exploration',
    rarity: 'legendary',
    points: 80,
    secret: false,
    requirement: { type: 'dungeonsCompleted', target: 100, description: 'Completar 100 dungeons' },
    rewards: [
      { type: 'coins', quantity: 50000 },
      { type: 'title', itemId: 'dungeon_master', quantity: 1 },
    ],
  },

  // ==================== PVP ====================
  {
    achievementId: 'first_win',
    name: 'Primeira Vitória',
    description: 'Vença sua primeira partida PvP',
    emoji: '🥊',
    category: 'pvp',
    rarity: 'common',
    points: 10,
    secret: false,
    requirement: { type: 'pvpWins', target: 1, description: 'Vencer 1 partida PvP' },
    rewards: [{ type: 'coins', quantity: 500 }],
  },
  {
    achievementId: 'arena_fighter',
    name: 'Lutador da Arena',
    description: 'Vença 25 partidas PvP',
    emoji: '⚔️',
    category: 'pvp',
    rarity: 'uncommon',
    points: 20,
    secret: false,
    requirement: { type: 'pvpWins', target: 25, description: 'Vencer 25 partidas PvP' },
    rewards: [{ type: 'coins', quantity: 5000 }],
  },
  {
    achievementId: 'arena_champion',
    name: 'Campeão da Arena',
    description: 'Vença 100 partidas PvP',
    emoji: '🏆',
    category: 'pvp',
    rarity: 'rare',
    points: 40,
    secret: false,
    requirement: { type: 'pvpWins', target: 100, description: 'Vencer 100 partidas PvP' },
    rewards: [
      { type: 'coins', quantity: 25000 },
      { type: 'title', itemId: 'arena_champion', quantity: 1 },
    ],
  },
  {
    achievementId: 'arena_legend',
    name: 'Lenda da Arena',
    description: 'Vença 500 partidas PvP',
    emoji: '👑',
    category: 'pvp',
    rarity: 'legendary',
    points: 100,
    secret: false,
    requirement: { type: 'pvpWins', target: 500, description: 'Vencer 500 partidas PvP' },
    rewards: [
      { type: 'coins', quantity: 100000 },
      { type: 'title', itemId: 'arena_legend', quantity: 1 },
    ],
  },

  // ==================== CRAFTING ====================
  {
    achievementId: 'first_craft',
    name: 'Artesão Iniciante',
    description: 'Crie seu primeiro item',
    emoji: '🔨',
    category: 'crafting',
    rarity: 'common',
    points: 5,
    secret: false,
    requirement: { type: 'itemsCrafted', target: 1, description: 'Criar 1 item' },
    rewards: [{ type: 'coins', quantity: 200 }],
  },
  {
    achievementId: 'craftsman',
    name: 'Artesão',
    description: 'Crie 50 itens',
    emoji: '⚒️',
    category: 'crafting',
    rarity: 'uncommon',
    points: 20,
    secret: false,
    requirement: { type: 'itemsCrafted', target: 50, description: 'Criar 50 itens' },
    rewards: [{ type: 'coins', quantity: 5000 }],
  },
  {
    achievementId: 'master_craftsman',
    name: 'Mestre Artesão',
    description: 'Crie 250 itens',
    emoji: '🛠️',
    category: 'crafting',
    rarity: 'epic',
    points: 50,
    secret: false,
    requirement: { type: 'itemsCrafted', target: 250, description: 'Criar 250 itens' },
    rewards: [
      { type: 'coins', quantity: 25000 },
      { type: 'title', itemId: 'master_craftsman', quantity: 1 },
    ],
  },
  {
    achievementId: 'first_enchant',
    name: 'Encantador',
    description: 'Aplique seu primeiro encantamento',
    emoji: '✨',
    category: 'crafting',
    rarity: 'common',
    points: 10,
    secret: false,
    requirement: { type: 'enchantmentsApplied', target: 1, description: 'Aplicar 1 encantamento' },
    rewards: [{ type: 'coins', quantity: 500 }],
  },
  {
    achievementId: 'enchantment_master',
    name: 'Mestre dos Encantamentos',
    description: 'Aplique 100 encantamentos',
    emoji: '🌟',
    category: 'crafting',
    rarity: 'epic',
    points: 50,
    secret: false,
    requirement: { type: 'enchantmentsApplied', target: 100, description: 'Aplicar 100 encantamentos' },
    rewards: [
      { type: 'coins', quantity: 30000 },
      { type: 'material', itemId: 'enchantment_dust', quantity: 50 },
    ],
  },

  // ==================== SOCIAL ====================
  {
    achievementId: 'guild_member',
    name: 'Membro de Guilda',
    description: 'Junte-se a uma guilda',
    emoji: '🏰',
    category: 'social',
    rarity: 'common',
    points: 10,
    secret: false,
    requirement: { type: 'guildContribution', target: 1, description: 'Entrar em uma guilda' },
    rewards: [{ type: 'coins', quantity: 500 }],
  },
  {
    achievementId: 'guild_contributor',
    name: 'Contribuidor da Guilda',
    description: 'Contribua 10.000 XP para sua guilda',
    emoji: '💪',
    category: 'social',
    rarity: 'rare',
    points: 30,
    secret: false,
    requirement: { type: 'guildContribution', target: 10000, description: 'Contribuir 10.000 XP' },
    rewards: [{ type: 'coins', quantity: 10000 }],
  },
  {
    achievementId: 'guild_hero',
    name: 'Herói da Guilda',
    description: 'Contribua 100.000 XP para sua guilda',
    emoji: '🦸',
    category: 'social',
    rarity: 'legendary',
    points: 75,
    secret: false,
    requirement: { type: 'guildContribution', target: 100000, description: 'Contribuir 100.000 XP' },
    rewards: [
      { type: 'coins', quantity: 50000 },
      { type: 'title', itemId: 'guild_hero', quantity: 1 },
    ],
  },

  // ==================== EVENTOS ====================
  {
    achievementId: 'event_participant',
    name: 'Participante de Evento',
    description: 'Participe de um evento mundial',
    emoji: '🌍',
    category: 'events',
    rarity: 'common',
    points: 10,
    secret: false,
    requirement: { type: 'eventsParticipated', target: 1, description: 'Participar de 1 evento' },
    rewards: [{ type: 'coins', quantity: 500 }],
  },
  {
    achievementId: 'event_veteran',
    name: 'Veterano de Eventos',
    description: 'Participe de 25 eventos mundiais',
    emoji: '🎪',
    category: 'events',
    rarity: 'rare',
    points: 35,
    secret: false,
    requirement: { type: 'eventsParticipated', target: 25, description: 'Participar de 25 eventos' },
    rewards: [{ type: 'coins', quantity: 15000 }],
  },

  // ==================== COLEÇÃO ====================
  {
    achievementId: 'coin_collector',
    name: 'Colecionador de Moedas',
    description: 'Acumule 100.000 coins',
    emoji: '💰',
    category: 'collection',
    rarity: 'uncommon',
    points: 20,
    secret: false,
    requirement: { type: 'coinsEarned', target: 100000, description: 'Ganhar 100.000 coins' },
    rewards: [{ type: 'coins', quantity: 5000 }],
  },
  {
    achievementId: 'wealthy',
    name: 'Rico',
    description: 'Acumule 1.000.000 coins',
    emoji: '💎',
    category: 'collection',
    rarity: 'epic',
    points: 50,
    secret: false,
    requirement: { type: 'coinsEarned', target: 1000000, description: 'Ganhar 1.000.000 coins' },
    rewards: [
      { type: 'coins', quantity: 50000 },
      { type: 'title', itemId: 'wealthy', quantity: 1 },
    ],
  },
  {
    achievementId: 'millionaire',
    name: 'Milionário',
    description: 'Acumule 10.000.000 coins',
    emoji: '🤑',
    category: 'collection',
    rarity: 'legendary',
    points: 100,
    secret: false,
    requirement: { type: 'coinsEarned', target: 10000000, description: 'Ganhar 10.000.000 coins' },
    rewards: [
      { type: 'coins', quantity: 500000 },
      { type: 'title', itemId: 'millionaire', quantity: 1 },
    ],
  },

  // ==================== ESPECIAIS / SECRETAS ====================
  {
    achievementId: 'lucky_one',
    name: 'O Sortudo',
    description: '???',
    emoji: '🍀',
    category: 'special',
    rarity: 'mythic',
    points: 50,
    secret: true,
    requirement: { type: 'special_lucky', target: 1, description: 'Tenha muita sorte...' },
    rewards: [
      { type: 'coins', quantity: 77777 },
      { type: 'title', itemId: 'lucky_one', quantity: 1 },
    ],
  },
  {
    achievementId: 'early_bird',
    name: 'Pássaro Madrugador',
    description: '???',
    emoji: '🌅',
    category: 'special',
    rarity: 'rare',
    points: 25,
    secret: true,
    requirement: { type: 'special_early_bird', target: 1, description: 'Jogue às 5 da manhã' },
    rewards: [
      { type: 'coins', quantity: 5000 },
      { type: 'title', itemId: 'early_bird', quantity: 1 },
    ],
  },
  {
    achievementId: 'night_owl',
    name: 'Coruja Noturna',
    description: '???',
    emoji: '🦉',
    category: 'special',
    rarity: 'rare',
    points: 25,
    secret: true,
    requirement: { type: 'special_night_owl', target: 1, description: 'Jogue às 3 da manhã' },
    rewards: [
      { type: 'coins', quantity: 5000 },
      { type: 'title', itemId: 'night_owl', quantity: 1 },
    ],
  },
  {
    achievementId: 'devoted',
    name: 'Devoto',
    description: 'Faça login por 30 dias consecutivos',
    emoji: '🔥',
    category: 'special',
    rarity: 'epic',
    points: 50,
    secret: false,
    requirement: { type: 'loginStreak', target: 30, description: 'Login por 30 dias seguidos' },
    rewards: [
      { type: 'coins', quantity: 30000 },
      { type: 'title', itemId: 'devoted', quantity: 1 },
    ],
  },
  {
    achievementId: 'eternal_devotion',
    name: 'Devoção Eterna',
    description: 'Faça login por 100 dias consecutivos',
    emoji: '⭐',
    category: 'special',
    rarity: 'mythic',
    points: 150,
    secret: false,
    requirement: { type: 'loginStreak', target: 100, description: 'Login por 100 dias seguidos' },
    rewards: [
      { type: 'coins', quantity: 100000 },
      { type: 'title', itemId: 'eternal_devotion', quantity: 1 },
      { type: 'material', itemId: 'legendary_core', quantity: 5 },
    ],
  },
];

// ==================== FUNÇÕES AUXILIARES ====================

// Obter conquista por ID
export const getAchievementById = (achievementId: string): AchievementData | undefined => {
  return ACHIEVEMENTS.find(a => a.achievementId === achievementId);
};

// Obter conquistas por categoria
export const getAchievementsByCategory = (category: AchievementCategory): AchievementData[] => {
  return ACHIEVEMENTS.filter(a => a.category === category);
};

// Obter conquistas por raridade
export const getAchievementsByRarity = (rarity: AchievementRarity): AchievementData[] => {
  return ACHIEVEMENTS.filter(a => a.rarity === rarity);
};

// Obter todas as conquistas (não secretas)
export const getPublicAchievements = (): AchievementData[] => {
  return ACHIEVEMENTS.filter(a => !a.secret);
};

// Obter todas as conquistas
export const getAllAchievements = (): AchievementData[] => {
  return ACHIEVEMENTS;
};

// Calcular total de pontos possíveis
export const getTotalPossiblePoints = (): number => {
  return ACHIEVEMENTS.reduce((sum, a) => sum + a.points, 0);
};

// Formatar nome da categoria
export const getCategoryName = (category: AchievementCategory): string => {
  const names: Record<AchievementCategory, string> = {
    combat: 'Combate',
    progression: 'Progressão',
    social: 'Social',
    crafting: 'Criação',
    exploration: 'Exploração',
    collection: 'Coleção',
    pvp: 'PvP',
    events: 'Eventos',
    special: 'Especial',
  };
  return names[category];
};

// Formatar nome da raridade
export const getRarityName = (rarity: AchievementRarity): string => {
  const names: Record<AchievementRarity, string> = {
    common: 'Comum',
    uncommon: 'Incomum',
    rare: 'Raro',
    epic: 'Épico',
    legendary: 'Lendário',
    mythic: 'Mítico',
  };
  return names[rarity];
};

export default ACHIEVEMENTS;
