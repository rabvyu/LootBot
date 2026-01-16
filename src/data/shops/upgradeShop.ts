// Loja de Melhoria de Personagem

export type UpgradeItemCategory = 'reset' | 'permanent' | 'temporary';

export interface UpgradeShopItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: UpgradeItemCategory;
  price: number;
  effect: {
    type: string;
    value: number;
    duration?: number; // Em horas, se temporário
  };
  maxPurchases?: number; // Limite de compras (undefined = ilimitado)
  requiredLevel?: number;
}

// Itens de Reset
export const resetItems: UpgradeShopItem[] = [
  {
    id: 'skill_reset_scroll',
    name: 'Pergaminho de Reset de Skills',
    emoji: '📜',
    description: 'Reseta todos os pontos de skill, permitindo redistribuição.',
    category: 'reset',
    price: 5000,
    effect: { type: 'reset_skills', value: 1 },
  },
  {
    id: 'attribute_reset_scroll',
    name: 'Pergaminho de Reset de Atributos',
    emoji: '📜',
    description: 'Reseta todos os pontos de atributo, permitindo redistribuição.',
    category: 'reset',
    price: 5000,
    effect: { type: 'reset_attributes', value: 1 },
  },
  {
    id: 'total_reset_scroll',
    name: 'Pergaminho de Reset Total',
    emoji: '📜',
    description: 'Reseta skills E atributos de uma vez.',
    category: 'reset',
    price: 8000,
    effect: { type: 'reset_all', value: 1 },
  },
  {
    id: 'class_change_potion',
    name: 'Poção de Mudança de Classe',
    emoji: '🧪',
    description: 'Permite voltar para a classe base e escolher novamente.',
    category: 'reset',
    price: 25000,
    effect: { type: 'reset_class', value: 1 },
    requiredLevel: 30,
  },
];

// Melhorias Permanentes
export const permanentItems: UpgradeShopItem[] = [
  {
    id: 'tome_of_wisdom',
    name: 'Tomo da Sabedoria',
    emoji: '📕',
    description: 'Concede +5 pontos de skill permanentes.',
    category: 'permanent',
    price: 10000,
    effect: { type: 'bonus_skill_points', value: 5 },
    maxPurchases: 10,
  },
  {
    id: 'tome_of_power',
    name: 'Tomo do Poder',
    emoji: '📗',
    description: 'Concede +10 pontos de atributo permanentes.',
    category: 'permanent',
    price: 10000,
    effect: { type: 'bonus_attribute_points', value: 10 },
    maxPurchases: 10,
  },
  {
    id: 'evolution_crystal',
    name: 'Cristal de Evolução',
    emoji: '💎',
    description: 'Permite evoluir de classe 5 níveis antes do normal.',
    category: 'permanent',
    price: 50000,
    effect: { type: 'early_evolution', value: 5 },
    maxPurchases: 1,
  },
  {
    id: 'wildcard_essence',
    name: 'Essência de Wildcard',
    emoji: '🌀',
    description: 'Aumenta em +5% a chance de conseguir classe wildcard.',
    category: 'permanent',
    price: 100000,
    effect: { type: 'wildcard_chance', value: 5 },
    maxPurchases: 3,
  },
];

// Bônus Temporários
export const temporaryItems: UpgradeShopItem[] = [
  {
    id: 'xp_blessing',
    name: 'Bênção do XP',
    emoji: '✨',
    description: '+50% XP ganho por 24 horas.',
    category: 'temporary',
    price: 1000,
    effect: { type: 'xp_boost', value: 50, duration: 24 },
  },
  {
    id: 'warrior_blessing',
    name: 'Bênção do Guerreiro',
    emoji: '⚔️',
    description: '+20% dano por 24 horas.',
    category: 'temporary',
    price: 2000,
    effect: { type: 'damage_boost', value: 20, duration: 24 },
  },
  {
    id: 'survivor_blessing',
    name: 'Bênção do Sobrevivente',
    emoji: '🛡️',
    description: '+20% defesa por 24 horas.',
    category: 'temporary',
    price: 2000,
    effect: { type: 'defense_boost', value: 20, duration: 24 },
  },
  {
    id: 'complete_blessing',
    name: 'Bênção Completa',
    emoji: '🌟',
    description: '+30% todos stats por 24 horas.',
    category: 'temporary',
    price: 5000,
    effect: { type: 'all_stats_boost', value: 30, duration: 24 },
  },
];

// Todos os itens da loja
export const allUpgradeItems: UpgradeShopItem[] = [
  ...resetItems,
  ...permanentItems,
  ...temporaryItems,
];

// Funções auxiliares
export const getUpgradeItemById = (id: string): UpgradeShopItem | undefined => {
  return allUpgradeItems.find(item => item.id === id);
};

export const getUpgradeItemsByCategory = (category: UpgradeItemCategory): UpgradeShopItem[] => {
  return allUpgradeItems.filter(item => item.category === category);
};

export const canPurchaseUpgradeItem = (
  item: UpgradeShopItem,
  userCoins: number,
  userLevel: number,
  purchaseCount: number
): { canPurchase: boolean; reason?: string } => {
  if (userCoins < item.price) {
    return { canPurchase: false, reason: `Precisa de ${item.price} coins (tem ${userCoins})` };
  }

  if (item.requiredLevel && userLevel < item.requiredLevel) {
    return { canPurchase: false, reason: `Precisa de nível ${item.requiredLevel} (tem ${userLevel})` };
  }

  if (item.maxPurchases && purchaseCount >= item.maxPurchases) {
    return { canPurchase: false, reason: `Limite de compras atingido (${item.maxPurchases})` };
  }

  return { canPurchase: true };
};
