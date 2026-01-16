// Dados das Dungeons de Guilda
import { DungeonDifficulty } from '../../database/models';

// Monstro de wave
export interface DungeonMonsterData {
  monsterId: string;
  name: string;
  emoji: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  abilities?: string[];
}

// Boss da dungeon
export interface DungeonBossData {
  bossId: string;
  name: string;
  emoji: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  abilities: string[];
  phases: number;
  enrageThreshold: number; // % HP para enrage
}

// Recompensa possível
export interface DungeonReward {
  type: 'coins' | 'xp' | 'item' | 'material' | 'equipment';
  id?: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  chance: number; // 0-100
  rarity?: string;
}

// Definição de uma dungeon
export interface DungeonData {
  dungeonId: string;
  name: string;
  description: string;
  emoji: string;
  difficulty: DungeonDifficulty;
  minLevel: number;
  minPlayers: number;
  maxPlayers: number;
  totalWaves: number;
  cooldownHours: number;
  requiresGuild: boolean;

  // Monstros por wave (escalado pela wave)
  monsters: DungeonMonsterData[];
  monstersPerWave: { min: number; max: number };

  // Boss
  boss: DungeonBossData;

  // Recompensas base (multiplicadas por contribuição)
  baseRewards: DungeonReward[];

  // Bônus de tempo (completar rápido)
  timeBonus: {
    fastMinutes: number;
    bonusPercent: number;
  };
}

// ==================== MONSTROS ====================

const catacombMonsters: DungeonMonsterData[] = [
  { monsterId: 'skeleton_warrior', name: 'Esqueleto Guerreiro', emoji: '💀', baseHp: 200, baseAttack: 50, baseDefense: 20 },
  { monsterId: 'zombie', name: 'Zumbi Putrefato', emoji: '🧟', baseHp: 300, baseAttack: 40, baseDefense: 30 },
  { monsterId: 'ghost', name: 'Espírito Errante', emoji: '👻', baseHp: 150, baseAttack: 60, baseDefense: 10, abilities: ['phase'] },
  { monsterId: 'bone_archer', name: 'Arqueiro de Ossos', emoji: '🏹', baseHp: 120, baseAttack: 70, baseDefense: 15 },
];

const fortressMonsters: DungeonMonsterData[] = [
  { monsterId: 'shadow_knight', name: 'Cavaleiro das Sombras', emoji: '⚔️', baseHp: 500, baseAttack: 100, baseDefense: 60 },
  { monsterId: 'dark_mage', name: 'Mago Sombrio', emoji: '🧙', baseHp: 300, baseAttack: 150, baseDefense: 30, abilities: ['fireball', 'curse'] },
  { monsterId: 'gargoyle', name: 'Gárgula de Pedra', emoji: '🗿', baseHp: 600, baseAttack: 80, baseDefense: 100, abilities: ['stone_skin'] },
  { monsterId: 'shadow_assassin', name: 'Assassino das Sombras', emoji: '🗡️', baseHp: 250, baseAttack: 180, baseDefense: 20, abilities: ['backstab'] },
];

const abyssMonsters: DungeonMonsterData[] = [
  { monsterId: 'chaos_demon', name: 'Demônio do Caos', emoji: '👹', baseHp: 1000, baseAttack: 200, baseDefense: 80 },
  { monsterId: 'void_horror', name: 'Horror do Vazio', emoji: '🕳️', baseHp: 800, baseAttack: 250, baseDefense: 50, abilities: ['void_pulse', 'fear'] },
  { monsterId: 'corrupted_angel', name: 'Anjo Corrompido', emoji: '😈', baseHp: 700, baseAttack: 220, baseDefense: 70, abilities: ['divine_wrath'] },
  { monsterId: 'elemental_lord', name: 'Senhor Elemental', emoji: '🌪️', baseHp: 900, baseAttack: 180, baseDefense: 120, abilities: ['elemental_storm'] },
];

const throneMonsters: DungeonMonsterData[] = [
  { monsterId: 'arch_demon', name: 'Arquidemônio', emoji: '👿', baseHp: 2000, baseAttack: 350, baseDefense: 150 },
  { monsterId: 'hellfire_giant', name: 'Gigante do Fogo Infernal', emoji: '🔥', baseHp: 3000, baseAttack: 280, baseDefense: 200, abilities: ['hellfire'] },
  { monsterId: 'death_knight', name: 'Cavaleiro da Morte', emoji: '☠️', baseHp: 1800, baseAttack: 400, baseDefense: 180, abilities: ['death_strike', 'undead_army'] },
  { monsterId: 'soul_devourer', name: 'Devorador de Almas', emoji: '💀', baseHp: 1500, baseAttack: 450, baseDefense: 100, abilities: ['soul_drain', 'terror'] },
];

// ==================== BOSSES ====================

const catacombBoss: DungeonBossData = {
  bossId: 'lich_king',
  name: 'Rei Lich',
  emoji: '👑💀',
  baseHp: 5000,
  baseAttack: 120,
  baseDefense: 50,
  abilities: ['frost_nova', 'summon_skeletons', 'death_coil'],
  phases: 2,
  enrageThreshold: 30,
};

const fortressBoss: DungeonBossData = {
  bossId: 'shadow_lord',
  name: 'Senhor das Sombras',
  emoji: '🌑⚔️',
  baseHp: 15000,
  baseAttack: 250,
  baseDefense: 100,
  abilities: ['shadow_strike', 'dark_barrier', 'summon_shadows', 'eclipse'],
  phases: 3,
  enrageThreshold: 25,
};

const abyssBoss: DungeonBossData = {
  bossId: 'chaos_hydra',
  name: 'Hidra do Caos',
  emoji: '🐉👹',
  baseHp: 40000,
  baseAttack: 400,
  baseDefense: 150,
  abilities: ['multi_head_attack', 'regeneration', 'chaos_breath', 'head_spawn'],
  phases: 4,
  enrageThreshold: 20,
};

const throneBoss: DungeonBossData = {
  bossId: 'demon_king',
  name: 'Rei Demônio Abaddon',
  emoji: '👑👿🔥',
  baseHp: 100000,
  baseAttack: 600,
  baseDefense: 250,
  abilities: ['infernal_blast', 'summon_legion', 'death_sentence', 'apocalypse', 'ultimate_form'],
  phases: 5,
  enrageThreshold: 15,
};

// ==================== DUNGEONS ====================

export const DUNGEONS: Record<string, DungeonData> = {
  // 1. Catacumbas Antigas - Normal
  catacombs: {
    dungeonId: 'catacombs',
    name: 'Catacumbas Antigas',
    description: 'Antigas catacumbas infestadas de mortos-vivos. Ideal para aventureiros iniciantes em grupo.',
    emoji: '🏚️',
    difficulty: 'normal',
    minLevel: 15,
    minPlayers: 3,
    maxPlayers: 5,
    totalWaves: 5,
    cooldownHours: 4,
    requiresGuild: false,
    monsters: catacombMonsters,
    monstersPerWave: { min: 2, max: 4 },
    boss: catacombBoss,
    baseRewards: [
      { type: 'coins', name: 'Coins', minAmount: 2000, maxAmount: 5000, chance: 100 },
      { type: 'xp', name: 'XP', minAmount: 500, maxAmount: 1500, chance: 100 },
      { type: 'material', id: 'bone_fragment', name: 'Fragmento de Osso', minAmount: 3, maxAmount: 8, chance: 80 },
      { type: 'material', id: 'ectoplasm', name: 'Ectoplasma', minAmount: 1, maxAmount: 3, chance: 50 },
      { type: 'material', id: 'ancient_rune', name: 'Runa Antiga', minAmount: 1, maxAmount: 2, chance: 25 },
      { type: 'equipment', id: 'catacombs_ring', name: 'Anel das Catacumbas', minAmount: 1, maxAmount: 1, chance: 10, rarity: 'rare' },
    ],
    timeBonus: { fastMinutes: 15, bonusPercent: 25 },
  },

  // 2. Fortaleza Sombria - Difícil
  shadow_fortress: {
    dungeonId: 'shadow_fortress',
    name: 'Fortaleza Sombria',
    description: 'Uma fortaleza corrompida pela escuridão. Requer coordenação e poder significativo.',
    emoji: '🏰',
    difficulty: 'hard',
    minLevel: 35,
    minPlayers: 5,
    maxPlayers: 8,
    totalWaves: 7,
    cooldownHours: 8,
    requiresGuild: true,
    monsters: fortressMonsters,
    monstersPerWave: { min: 3, max: 5 },
    boss: fortressBoss,
    baseRewards: [
      { type: 'coins', name: 'Coins', minAmount: 8000, maxAmount: 15000, chance: 100 },
      { type: 'xp', name: 'XP', minAmount: 2000, maxAmount: 5000, chance: 100 },
      { type: 'material', id: 'shadow_essence', name: 'Essência Sombria', minAmount: 3, maxAmount: 6, chance: 70 },
      { type: 'material', id: 'dark_crystal', name: 'Cristal Negro', minAmount: 1, maxAmount: 3, chance: 40 },
      { type: 'material', id: 'cursed_metal', name: 'Metal Amaldiçoado', minAmount: 2, maxAmount: 5, chance: 50 },
      { type: 'equipment', id: 'shadow_blade', name: 'Lâmina Sombria', minAmount: 1, maxAmount: 1, chance: 15, rarity: 'epic' },
      { type: 'equipment', id: 'fortress_armor', name: 'Armadura da Fortaleza', minAmount: 1, maxAmount: 1, chance: 12, rarity: 'epic' },
    ],
    timeBonus: { fastMinutes: 25, bonusPercent: 30 },
  },

  // 3. Abismo do Caos - Extremo
  chaos_abyss: {
    dungeonId: 'chaos_abyss',
    name: 'Abismo do Caos',
    description: 'O vazio entre dimensões, onde criaturas impossíveis habitam. Apenas os mais poderosos sobrevivem.',
    emoji: '🌀',
    difficulty: 'extreme',
    minLevel: 55,
    minPlayers: 8,
    maxPlayers: 12,
    totalWaves: 10,
    cooldownHours: 16,
    requiresGuild: true,
    monsters: abyssMonsters,
    monstersPerWave: { min: 4, max: 6 },
    boss: abyssBoss,
    baseRewards: [
      { type: 'coins', name: 'Coins', minAmount: 25000, maxAmount: 50000, chance: 100 },
      { type: 'xp', name: 'XP', minAmount: 8000, maxAmount: 15000, chance: 100 },
      { type: 'material', id: 'chaos_fragment', name: 'Fragmento do Caos', minAmount: 2, maxAmount: 5, chance: 60 },
      { type: 'material', id: 'void_crystal', name: 'Cristal do Vazio', minAmount: 1, maxAmount: 3, chance: 35 },
      { type: 'material', id: 'primordial_essence', name: 'Essência Primordial', minAmount: 1, maxAmount: 2, chance: 20 },
      { type: 'equipment', id: 'chaos_weapon', name: 'Arma do Caos', minAmount: 1, maxAmount: 1, chance: 10, rarity: 'legendary' },
      { type: 'equipment', id: 'abyss_armor', name: 'Armadura do Abismo', minAmount: 1, maxAmount: 1, chance: 8, rarity: 'legendary' },
      { type: 'item', id: 'hydra_scale', name: 'Escama de Hidra', minAmount: 1, maxAmount: 1, chance: 25, rarity: 'legendary' },
    ],
    timeBonus: { fastMinutes: 40, bonusPercent: 35 },
  },

  // 4. Trono do Demônio - Impossível
  demon_throne: {
    dungeonId: 'demon_throne',
    name: 'Trono do Demônio',
    description: 'O coração do inferno, onde o Rei Demônio aguarda. Apenas as guildas mais poderosas ousam entrar.',
    emoji: '👑🔥',
    difficulty: 'impossible',
    minLevel: 75,
    minPlayers: 10,
    maxPlayers: 15,
    totalWaves: 12,
    cooldownHours: 48,
    requiresGuild: true,
    monsters: throneMonsters,
    monstersPerWave: { min: 5, max: 8 },
    boss: throneBoss,
    baseRewards: [
      { type: 'coins', name: 'Coins', minAmount: 100000, maxAmount: 200000, chance: 100 },
      { type: 'xp', name: 'XP', minAmount: 30000, maxAmount: 50000, chance: 100 },
      { type: 'material', id: 'demonic_core', name: 'Núcleo Demoníaco', minAmount: 1, maxAmount: 3, chance: 50 },
      { type: 'material', id: 'infernal_gem', name: 'Gema Infernal', minAmount: 1, maxAmount: 2, chance: 30 },
      { type: 'material', id: 'soul_shard', name: 'Fragmento de Alma', minAmount: 1, maxAmount: 1, chance: 15 },
      { type: 'equipment', id: 'demon_slayer', name: 'Matador de Demônios', minAmount: 1, maxAmount: 1, chance: 5, rarity: 'mythic' },
      { type: 'equipment', id: 'infernal_crown', name: 'Coroa Infernal', minAmount: 1, maxAmount: 1, chance: 3, rarity: 'mythic' },
      { type: 'item', id: 'demon_heart', name: 'Coração do Rei Demônio', minAmount: 1, maxAmount: 1, chance: 10, rarity: 'mythic' },
      { type: 'item', id: 'throne_fragment', name: 'Fragmento do Trono', minAmount: 1, maxAmount: 1, chance: 20, rarity: 'legendary' },
    ],
    timeBonus: { fastMinutes: 60, bonusPercent: 50 },
  },
};

// Funções auxiliares

export const getDungeonById = (dungeonId: string): DungeonData | undefined => {
  return DUNGEONS[dungeonId];
};

export const getDungeonsByDifficulty = (difficulty: DungeonDifficulty): DungeonData[] => {
  return Object.values(DUNGEONS).filter(d => d.difficulty === difficulty);
};

export const getAvailableDungeons = (playerLevel: number, isInGuild: boolean): DungeonData[] => {
  return Object.values(DUNGEONS).filter(d => {
    if (d.minLevel > playerLevel) return false;
    if (d.requiresGuild && !isInGuild) return false;
    return true;
  });
};

export const getDifficultyColor = (difficulty: DungeonDifficulty): number => {
  const colors: Record<DungeonDifficulty, number> = {
    normal: 0x2ECC71,    // Verde
    hard: 0xF1C40F,      // Amarelo
    extreme: 0xE74C3C,   // Vermelho
    impossible: 0x9B59B6, // Roxo
  };
  return colors[difficulty];
};

export const getDifficultyName = (difficulty: DungeonDifficulty): string => {
  const names: Record<DungeonDifficulty, string> = {
    normal: '⚔️ Normal',
    hard: '🔥 Difícil',
    extreme: '💀 Extremo',
    impossible: '☠️ Impossível',
  };
  return names[difficulty];
};

// Calcular stats de monstro por wave
export const calculateMonsterStats = (
  monster: DungeonMonsterData,
  waveNumber: number,
  difficulty: DungeonDifficulty
): { hp: number; attack: number; defense: number } => {
  const difficultyMultiplier: Record<DungeonDifficulty, number> = {
    normal: 1.0,
    hard: 1.5,
    extreme: 2.0,
    impossible: 3.0,
  };

  const waveMultiplier = 1 + (waveNumber - 1) * 0.15;
  const mult = difficultyMultiplier[difficulty] * waveMultiplier;

  return {
    hp: Math.floor(monster.baseHp * mult),
    attack: Math.floor(monster.baseAttack * mult),
    defense: Math.floor(monster.baseDefense * mult),
  };
};

// Calcular stats do boss
export const calculateBossStats = (
  boss: DungeonBossData,
  difficulty: DungeonDifficulty,
  playerCount: number
): { hp: number; attack: number; defense: number } => {
  const difficultyMultiplier: Record<DungeonDifficulty, number> = {
    normal: 1.0,
    hard: 1.8,
    extreme: 2.5,
    impossible: 4.0,
  };

  const playerMultiplier = 1 + (playerCount - 3) * 0.2;
  const mult = difficultyMultiplier[difficulty] * playerMultiplier;

  return {
    hp: Math.floor(boss.baseHp * mult),
    attack: Math.floor(boss.baseAttack * mult),
    defense: Math.floor(boss.baseDefense * mult),
  };
};

export default DUNGEONS;
