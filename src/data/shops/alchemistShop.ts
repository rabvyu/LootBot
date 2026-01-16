// Loja do Alquimista

export type AlchemistItemRarity = 'common' | 'rare' | 'legendary';

export interface AlchemistItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: AlchemistItemRarity;
  price: number;
  effect: {
    type: string;
    value: number;
    duration?: number; // Duração em batalhas ou horas
    isPermanent?: boolean;
  };
  appearChance?: number; // Chance de aparecer no estoque (para raros/lendários)
  maxStock?: number; // Quantidade máxima em estoque
  cooldown?: number; // Cooldown de uso em horas
}

// Poções Comuns (sempre disponíveis)
export const commonItems: AlchemistItem[] = [
  {
    id: 'minor_health_potion',
    name: 'Poção de Cura Menor',
    emoji: '🧪',
    description: 'Cura 100 HP durante batalha.',
    rarity: 'common',
    price: 50,
    effect: { type: 'heal', value: 100 },
    maxStock: 99,
  },
  {
    id: 'health_potion',
    name: 'Poção de Cura',
    emoji: '🧪',
    description: 'Cura 300 HP durante batalha.',
    rarity: 'common',
    price: 150,
    effect: { type: 'heal', value: 300 },
    maxStock: 50,
  },
  {
    id: 'major_health_potion',
    name: 'Poção de Cura Maior',
    emoji: '🧪',
    description: 'Cura 800 HP durante batalha.',
    rarity: 'common',
    price: 400,
    effect: { type: 'heal', value: 800 },
    maxStock: 20,
  },
  {
    id: 'supreme_health_potion',
    name: 'Poção de Cura Suprema',
    emoji: '💊',
    description: 'Restaura todo HP durante batalha.',
    rarity: 'common',
    price: 1000,
    effect: { type: 'heal_percent', value: 100 },
    maxStock: 10,
  },
  {
    id: 'mana_potion',
    name: 'Poção de Mana',
    emoji: '💙',
    description: 'Restaura mana para usar habilidades.',
    rarity: 'common',
    price: 200,
    effect: { type: 'restore_mana', value: 50 },
    maxStock: 30,
  },
  {
    id: 'antidote',
    name: 'Antídoto',
    emoji: '💚',
    description: 'Remove efeitos de veneno.',
    rarity: 'common',
    price: 100,
    effect: { type: 'cure_poison', value: 1 },
    maxStock: 30,
  },
  {
    id: 'strength_potion',
    name: 'Poção de Força',
    emoji: '💪',
    description: '+20% ATK por 1 batalha.',
    rarity: 'common',
    price: 300,
    effect: { type: 'attack_boost', value: 20, duration: 1 },
    maxStock: 20,
  },
  {
    id: 'iron_potion',
    name: 'Poção de Ferro',
    emoji: '🛡️',
    description: '+20% DEF por 1 batalha.',
    rarity: 'common',
    price: 300,
    effect: { type: 'defense_boost', value: 20, duration: 1 },
    maxStock: 20,
  },
];

// Itens Raros (aparecem aleatoriamente, refresh a cada 6 horas)
export const rareItems: AlchemistItem[] = [
  {
    id: 'elixir_of_life',
    name: 'Elixir da Vida',
    emoji: '❤️',
    description: '+100 HP máximo permanente.',
    rarity: 'rare',
    price: 5000,
    effect: { type: 'max_hp_bonus', value: 100, isPermanent: true },
    appearChance: 10,
    maxStock: 1,
  },
  {
    id: 'elixir_of_power',
    name: 'Elixir do Poder',
    emoji: '⚔️',
    description: '+5 ATK permanente.',
    rarity: 'rare',
    price: 5000,
    effect: { type: 'attack_bonus', value: 5, isPermanent: true },
    appearChance: 10,
    maxStock: 1,
  },
  {
    id: 'elixir_of_protection',
    name: 'Elixir da Proteção',
    emoji: '🛡️',
    description: '+5 DEF permanente.',
    rarity: 'rare',
    price: 5000,
    effect: { type: 'defense_bonus', value: 5, isPermanent: true },
    appearChance: 10,
    maxStock: 1,
  },
  {
    id: 'luck_potion',
    name: 'Poção da Sorte',
    emoji: '🍀',
    description: '+10% drop rate por 24h.',
    rarity: 'rare',
    price: 3000,
    effect: { type: 'drop_rate_boost', value: 10, duration: 24 },
    appearChance: 15,
    maxStock: 2,
  },
  {
    id: 'rare_essence',
    name: 'Essência Rara',
    emoji: '✨',
    description: 'Material para crafting lendário.',
    rarity: 'rare',
    price: 10000,
    effect: { type: 'crafting_material', value: 1 },
    appearChance: 5,
    maxStock: 1,
  },
  {
    id: 'phoenix_tear',
    name: 'Lágrima de Fênix',
    emoji: '🔥',
    description: 'Revive automaticamente 1x com 50% HP.',
    rarity: 'rare',
    price: 8000,
    effect: { type: 'auto_revive', value: 50 },
    appearChance: 8,
    maxStock: 1,
    cooldown: 24,
  },
  {
    id: 'transcendence_potion',
    name: 'Poção de Transcendência',
    emoji: '🌟',
    description: 'Ganha +1 nível instantaneamente.',
    rarity: 'rare',
    price: 20000,
    effect: { type: 'level_up', value: 1 },
    appearChance: 3,
    maxStock: 1,
  },
  {
    id: 'temporal_crystal',
    name: 'Cristal Temporal',
    emoji: '💎',
    description: 'Reseta todos os cooldowns.',
    rarity: 'rare',
    price: 15000,
    effect: { type: 'reset_cooldowns', value: 1 },
    appearChance: 5,
    maxStock: 1,
  },
];

// Itens Lendários (aparecem muito raramente)
export const legendaryItems: AlchemistItem[] = [
  {
    id: 'dragon_heart',
    name: 'Coração de Dragão',
    emoji: '🐉',
    description: '+500 HP máximo permanente.',
    rarity: 'legendary',
    price: 100000,
    effect: { type: 'max_hp_bonus', value: 500, isPermanent: true },
    appearChance: 1,
    maxStock: 1,
  },
  {
    id: 'cursed_blade_essence',
    name: 'Essência da Lâmina Amaldiçoada',
    emoji: '🗡️',
    description: '+30 ATK permanente, -50 HP máx.',
    rarity: 'legendary',
    price: 100000,
    effect: { type: 'cursed_attack', value: 30, isPermanent: true },
    appearChance: 1,
    maxStock: 1,
  },
  {
    id: 'divine_shield_essence',
    name: 'Essência do Escudo dos Deuses',
    emoji: '🛡️',
    description: '+30 DEF permanente.',
    rarity: 'legendary',
    price: 100000,
    effect: { type: 'defense_bonus', value: 30, isPermanent: true },
    appearChance: 1,
    maxStock: 1,
  },
  {
    id: 'ancient_rune',
    name: 'Runa Antiga',
    emoji: '🔮',
    description: '+3 pontos de skill permanentes.',
    rarity: 'legendary',
    price: 150000,
    effect: { type: 'skill_points_bonus', value: 3, isPermanent: true },
    appearChance: 0.5,
    maxStock: 1,
  },
  {
    id: 'dimensional_fragment',
    name: 'Fragmento Dimensional',
    emoji: '🌌',
    description: 'Garante que próxima evolução seja wildcard.',
    rarity: 'legendary',
    price: 200000,
    effect: { type: 'guarantee_wildcard', value: 1 },
    appearChance: 0.3,
    maxStock: 1,
  },
];

// Todos os itens
export const allAlchemistItems: AlchemistItem[] = [
  ...commonItems,
  ...rareItems,
  ...legendaryItems,
];

// Funções auxiliares
export const getAlchemistItemById = (id: string): AlchemistItem | undefined => {
  return allAlchemistItems.find(item => item.id === id);
};

export const getAlchemistItemsByRarity = (rarity: AlchemistItemRarity): AlchemistItem[] => {
  return allAlchemistItems.filter(item => item.rarity === rarity);
};

// Gerar estoque do alquimista (chamado a cada 6 horas)
export const generateAlchemistStock = (): AlchemistItem[] => {
  const stock: AlchemistItem[] = [...commonItems];

  // Rolar para itens raros
  for (const item of rareItems) {
    const roll = Math.random() * 100;
    if (roll < (item.appearChance || 0)) {
      stock.push(item);
    }
  }

  // Rolar para itens lendários
  for (const item of legendaryItems) {
    const roll = Math.random() * 100;
    if (roll < (item.appearChance || 0)) {
      stock.push(item);
    }
  }

  return stock;
};

// Verificar se pode comprar item
export const canPurchaseAlchemistItem = (
  item: AlchemistItem,
  userCoins: number,
  currentStock: number,
  lastUsed?: Date
): { canPurchase: boolean; reason?: string } => {
  if (userCoins < item.price) {
    return { canPurchase: false, reason: `Precisa de ${item.price} coins (tem ${userCoins})` };
  }

  if (currentStock <= 0) {
    return { canPurchase: false, reason: 'Item fora de estoque' };
  }

  if (item.cooldown && lastUsed) {
    const hoursSinceUse = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60);
    if (hoursSinceUse < item.cooldown) {
      const remaining = Math.ceil(item.cooldown - hoursSinceUse);
      return { canPurchase: false, reason: `Em cooldown (${remaining}h restantes)` };
    }
  }

  return { canPurchase: true };
};

// Constantes
export const ALCHEMIST_REFRESH_HOURS = 6;
