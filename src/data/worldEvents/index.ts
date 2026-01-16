// Sistema de Eventos Mundiais
import { WorldEventType } from '../../database/models/WorldEvent';

// Interface para template de evento
export interface WorldEventTemplate {
  type: WorldEventType;
  name: string;
  description: string;
  emoji: string;
  durationHours: number;
  minLevel: number;
  cooldownHours: number;
  maxParticipants?: number;
  objectives: Array<{
    objectiveId: string;
    description: string;
    target: number;
    rewards: Array<{
      type: 'coins' | 'xp' | 'material' | 'equipment' | 'title';
      itemId?: string;
      quantity: number;
      tier?: number;
    }>;
  }>;
  globalRewards: Array<{
    type: 'coins' | 'xp' | 'material' | 'equipment' | 'title';
    itemId?: string;
    quantity: number;
    tier?: number;
  }>;
  topContributorRewards: {
    top1: Array<{ type: string; itemId?: string; quantity: number; tier?: number }>;
    top3: Array<{ type: string; itemId?: string; quantity: number; tier?: number }>;
    top10: Array<{ type: string; itemId?: string; quantity: number; tier?: number }>;
  };
  // Configurações específicas por tipo
  bossConfig?: {
    name: string;
    hp: number;
    attack: number;
    defense: number;
  };
  invasionConfig?: {
    totalWaves: number;
    monstersPerWave: number;
  };
  treasureConfig?: {
    totalTreasures: number;
    clues: string[];
  };
}

// Templates de eventos
export const WORLD_EVENT_TEMPLATES: Record<string, WorldEventTemplate> = {
  // ==================== INVASÃO DE MONSTROS ====================
  goblin_invasion: {
    type: 'invasion',
    name: 'Invasão Goblin',
    description: 'Uma horda de goblins está atacando! Defenda a cidade!',
    emoji: '👺',
    durationHours: 2,
    minLevel: 5,
    cooldownHours: 1,
    objectives: [
      {
        objectiveId: 'kill_goblins',
        description: 'Derrotar goblins',
        target: 500,
        rewards: [
          { type: 'coins', quantity: 10000 },
          { type: 'xp', quantity: 500 },
        ],
      },
      {
        objectiveId: 'kill_elite',
        description: 'Derrotar Goblins Elite',
        target: 50,
        rewards: [
          { type: 'material', itemId: 'goblin_heart', quantity: 10 },
        ],
      },
    ],
    globalRewards: [
      { type: 'coins', quantity: 5000 },
      { type: 'xp', quantity: 200 },
    ],
    topContributorRewards: {
      top1: [
        { type: 'coins', quantity: 50000 },
        { type: 'material', itemId: 'goblin_king_crown', quantity: 1 },
      ],
      top3: [
        { type: 'coins', quantity: 25000 },
        { type: 'material', itemId: 'rare_goblin_loot', quantity: 3 },
      ],
      top10: [
        { type: 'coins', quantity: 10000 },
        { type: 'material', itemId: 'goblin_treasure', quantity: 5 },
      ],
    },
    invasionConfig: {
      totalWaves: 10,
      monstersPerWave: 50,
    },
  },

  demon_invasion: {
    type: 'invasion',
    name: 'Invasão Demoníaca',
    description: 'Demônios emergem dos portais do inferno! O mundo está em perigo!',
    emoji: '👿',
    durationHours: 3,
    minLevel: 30,
    cooldownHours: 2,
    objectives: [
      {
        objectiveId: 'kill_demons',
        description: 'Derrotar demônios',
        target: 300,
        rewards: [
          { type: 'coins', quantity: 50000 },
          { type: 'xp', quantity: 2000 },
        ],
      },
      {
        objectiveId: 'close_portals',
        description: 'Fechar portais demoníacos',
        target: 10,
        rewards: [
          { type: 'material', itemId: 'chaos_fragment', quantity: 5 },
        ],
      },
    ],
    globalRewards: [
      { type: 'coins', quantity: 25000 },
      { type: 'xp', quantity: 1000 },
      { type: 'material', itemId: 'cursed_blood', quantity: 2 },
    ],
    topContributorRewards: {
      top1: [
        { type: 'coins', quantity: 200000 },
        { type: 'material', itemId: 'demon_lord_essence', quantity: 1 },
        { type: 'title', itemId: 'demon_slayer', quantity: 1 },
      ],
      top3: [
        { type: 'coins', quantity: 100000 },
        { type: 'material', itemId: 'chaos_fragment', quantity: 10 },
      ],
      top10: [
        { type: 'coins', quantity: 50000 },
        { type: 'material', itemId: 'cursed_blood', quantity: 5 },
      ],
    },
    invasionConfig: {
      totalWaves: 15,
      monstersPerWave: 20,
    },
  },

  // ==================== BOSS MUNDIAL ====================
  ancient_dragon: {
    type: 'boss_world',
    name: 'Dragão Ancião Desperta',
    description: 'O lendário Dragão Ancião despertou de seu sono milenar!',
    emoji: '🐲',
    durationHours: 4,
    minLevel: 20,
    cooldownHours: 2,
    objectives: [
      {
        objectiveId: 'damage_dragon',
        description: 'Causar dano ao dragão',
        target: 10000000,
        rewards: [
          { type: 'coins', quantity: 100000 },
          { type: 'material', itemId: 'dragon_scale', quantity: 20 },
        ],
      },
    ],
    globalRewards: [
      { type: 'coins', quantity: 30000 },
      { type: 'xp', quantity: 1500 },
      { type: 'material', itemId: 'dragon_scale', quantity: 3 },
    ],
    topContributorRewards: {
      top1: [
        { type: 'coins', quantity: 500000 },
        { type: 'material', itemId: 'dragon_heart', quantity: 1 },
        { type: 'title', itemId: 'dragon_slayer', quantity: 1 },
      ],
      top3: [
        { type: 'coins', quantity: 200000 },
        { type: 'material', itemId: 'dragon_scale', quantity: 15 },
      ],
      top10: [
        { type: 'coins', quantity: 100000 },
        { type: 'material', itemId: 'dragon_scale', quantity: 8 },
      ],
    },
    bossConfig: {
      name: 'Dragão Ancião Ignis',
      hp: 10000000,
      attack: 5000,
      defense: 3000,
    },
  },

  void_titan: {
    type: 'boss_world',
    name: 'Titã do Vazio',
    description: 'Uma criatura do vazio invadiu nosso mundo!',
    emoji: '🌑',
    durationHours: 3,
    minLevel: 40,
    cooldownHours: 2,
    objectives: [
      {
        objectiveId: 'damage_titan',
        description: 'Causar dano ao Titã',
        target: 25000000,
        rewards: [
          { type: 'coins', quantity: 250000 },
          { type: 'material', itemId: 'void_essence', quantity: 10 },
        ],
      },
    ],
    globalRewards: [
      { type: 'coins', quantity: 50000 },
      { type: 'xp', quantity: 3000 },
      { type: 'material', itemId: 'chaos_fragment', quantity: 3 },
    ],
    topContributorRewards: {
      top1: [
        { type: 'coins', quantity: 1000000 },
        { type: 'material', itemId: 'void_core', quantity: 1 },
        { type: 'title', itemId: 'void_conqueror', quantity: 1 },
      ],
      top3: [
        { type: 'coins', quantity: 500000 },
        { type: 'material', itemId: 'void_essence', quantity: 20 },
      ],
      top10: [
        { type: 'coins', quantity: 200000 },
        { type: 'material', itemId: 'void_essence', quantity: 10 },
      ],
    },
    bossConfig: {
      name: 'Titã do Vazio Eternus',
      hp: 25000000,
      attack: 8000,
      defense: 5000,
    },
  },

  // ==================== CAÇA AO TESOURO ====================
  pirate_treasure: {
    type: 'treasure_hunt',
    name: 'Tesouro dos Piratas',
    description: 'Um antigo mapa do tesouro foi encontrado! Siga as pistas!',
    emoji: '🏴‍☠️',
    durationHours: 2,
    minLevel: 10,
    cooldownHours: 1,
    objectives: [
      {
        objectiveId: 'find_treasures',
        description: 'Encontrar baús de tesouro',
        target: 100,
        rewards: [
          { type: 'coins', quantity: 50000 },
        ],
      },
      {
        objectiveId: 'find_legendary',
        description: 'Encontrar o tesouro lendário',
        target: 1,
        rewards: [
          { type: 'material', itemId: 'legendary_core', quantity: 1 },
        ],
      },
    ],
    globalRewards: [
      { type: 'coins', quantity: 15000 },
      { type: 'material', itemId: 'lucky_coin', quantity: 2 },
    ],
    topContributorRewards: {
      top1: [
        { type: 'coins', quantity: 150000 },
        { type: 'material', itemId: 'pirate_king_treasure', quantity: 1 },
      ],
      top3: [
        { type: 'coins', quantity: 75000 },
        { type: 'material', itemId: 'lucky_coin', quantity: 10 },
      ],
      top10: [
        { type: 'coins', quantity: 30000 },
        { type: 'material', itemId: 'lucky_coin', quantity: 5 },
      ],
    },
    treasureConfig: {
      totalTreasures: 100,
      clues: [
        'Procure onde o sol nasce sobre as montanhas...',
        'O tesouro repousa onde as águas encontram a terra...',
        'Sob a árvore mais antiga da floresta...',
        'Nas ruínas do castelo esquecido...',
        'No coração da caverna dos cristais...',
      ],
    },
  },

  // ==================== EVENTOS DE BÔNUS ====================
  double_xp_weekend: {
    type: 'double_xp',
    name: 'Fim de Semana de XP Dobrado',
    description: 'XP dobrado em todas as atividades!',
    emoji: '⚡',
    durationHours: 48,
    minLevel: 1,
    cooldownHours: 0,
    objectives: [
      {
        objectiveId: 'gain_xp',
        description: 'XP coletivo ganho pela comunidade',
        target: 10000000,
        rewards: [
          { type: 'coins', quantity: 10000 },
        ],
      },
    ],
    globalRewards: [
      { type: 'xp', quantity: 1000 },
    ],
    topContributorRewards: {
      top1: [
        { type: 'coins', quantity: 100000 },
        { type: 'title', itemId: 'xp_champion', quantity: 1 },
      ],
      top3: [
        { type: 'coins', quantity: 50000 },
      ],
      top10: [
        { type: 'coins', quantity: 20000 },
      ],
    },
  },

  meteor_shower: {
    type: 'meteor_shower',
    name: 'Chuva de Meteoros',
    description: 'Meteoros cheios de materiais raros estão caindo do céu!',
    emoji: '☄️',
    durationHours: 1,
    minLevel: 15,
    cooldownHours: 0.5,
    objectives: [
      {
        objectiveId: 'collect_meteors',
        description: 'Coletar fragmentos de meteoro',
        target: 500,
        rewards: [
          { type: 'coins', quantity: 30000 },
          { type: 'material', itemId: 'meteor_fragment', quantity: 10 },
        ],
      },
    ],
    globalRewards: [
      { type: 'material', itemId: 'meteor_fragment', quantity: 3 },
      { type: 'coins', quantity: 5000 },
    ],
    topContributorRewards: {
      top1: [
        { type: 'material', itemId: 'meteor_core', quantity: 1 },
        { type: 'coins', quantity: 100000 },
      ],
      top3: [
        { type: 'material', itemId: 'meteor_fragment', quantity: 20 },
        { type: 'coins', quantity: 50000 },
      ],
      top10: [
        { type: 'material', itemId: 'meteor_fragment', quantity: 10 },
        { type: 'coins', quantity: 20000 },
      ],
    },
  },
};

// ==================== FUNÇÕES AUXILIARES ====================

// Obter template por ID
export const getEventTemplate = (templateId: string): WorldEventTemplate | undefined => {
  return WORLD_EVENT_TEMPLATES[templateId];
};

// Obter todos os templates
export const getAllEventTemplates = (): WorldEventTemplate[] => {
  return Object.values(WORLD_EVENT_TEMPLATES);
};

// Obter templates por tipo
export const getEventTemplatesByType = (type: WorldEventType): WorldEventTemplate[] => {
  return Object.values(WORLD_EVENT_TEMPLATES).filter(t => t.type === type);
};

// Calcular dano ao boss baseado nos stats do jogador
export const calculateBossDamage = (
  playerAttack: number,
  playerLevel: number,
  bossDefense: number
): number => {
  const baseDamage = playerAttack * (1 + playerLevel * 0.02);
  const defenseReduction = bossDefense / (bossDefense + 1000);
  const finalDamage = Math.floor(baseDamage * (1 - defenseReduction));
  return Math.max(1, finalDamage);
};

// Calcular contribuição por ação
export const calculateContribution = (
  actionType: 'attack' | 'kill' | 'collect' | 'objective',
  value: number
): number => {
  const multipliers: Record<string, number> = {
    attack: 1,      // 1 contribuição por dano
    kill: 100,      // 100 contribuição por kill
    collect: 50,    // 50 contribuição por coleta
    objective: 500, // 500 contribuição por objetivo
  };
  return Math.floor(value * (multipliers[actionType] || 1));
};

// Formatar tempo restante
export const formatTimeRemaining = (endDate: Date): string => {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) return 'Encerrado';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Cores por tipo de evento
export const EVENT_COLORS: Record<WorldEventType, number> = {
  invasion: 0xFF0000,      // Vermelho
  treasure_hunt: 0xFFD700, // Dourado
  boss_world: 0x8B0000,    // Vermelho escuro
  double_xp: 0x00FF00,     // Verde
  meteor_shower: 0x9400D3, // Roxo
  guild_war: 0xFF4500,     // Laranja
  tournament: 0x1E90FF,    // Azul
};

export default WORLD_EVENT_TEMPLATES;
