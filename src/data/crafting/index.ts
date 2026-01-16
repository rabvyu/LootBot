// Sistema de Crafting Avançado
import { EquipmentSlot, EquipmentRarity } from '../../database/models';

// Ingrediente de receita
export interface CraftingIngredient {
  materialId: string;
  materialName: string;
  quantity: number;
}

// Receita de crafting
export interface CraftingRecipe {
  recipeId: string;
  name: string;
  description: string;
  emoji: string;
  category: 'equipment' | 'consumable' | 'material' | 'special';

  // Requisitos
  requiredLevel: number;
  requiredCoins: number;
  ingredients: CraftingIngredient[];

  // Resultado
  result: {
    type: 'equipment' | 'consumable' | 'material';
    itemId: string;
    quantity: number;
    // Para equipamentos
    slot?: EquipmentSlot;
    tier?: number;
    rarity?: EquipmentRarity;
    stats?: {
      attack?: number;
      defense?: number;
      hp?: number;
      critChance?: number;
      critDamage?: number;
      evasion?: number;
      lifesteal?: number;
    };
  };

  // Crafting
  craftingTime: number; // segundos
  successRate: number; // 0-100

  // Bônus de guilda
  guildBonus?: {
    successRateBonus: number;
    costReduction: number;
  };
}

// ==================== MATERIAIS ====================

export const MATERIALS: Record<string, { name: string; emoji: string; tier: number; rarity: string }> = {
  // Tier 1-3 (Básicos)
  bone_fragment: { name: 'Fragmento de Osso', emoji: '🦴', tier: 1, rarity: 'common' },
  iron_ore: { name: 'Minério de Ferro', emoji: '�ite', tier: 1, rarity: 'common' },
  leather: { name: 'Couro', emoji: '🟤', tier: 1, rarity: 'common' },
  wood: { name: 'Madeira', emoji: '🪵', tier: 1, rarity: 'common' },
  cloth: { name: 'Tecido', emoji: '🧵', tier: 1, rarity: 'common' },

  // Tier 4-5 (Intermediários)
  steel_ingot: { name: 'Lingote de Aço', emoji: '🔩', tier: 4, rarity: 'uncommon' },
  enchanted_leather: { name: 'Couro Encantado', emoji: '✨🟤', tier: 4, rarity: 'uncommon' },
  ectoplasm: { name: 'Ectoplasma', emoji: '👻', tier: 4, rarity: 'uncommon' },
  ancient_rune: { name: 'Runa Antiga', emoji: '🔮', tier: 5, rarity: 'rare' },
  magic_crystal: { name: 'Cristal Mágico', emoji: '💎', tier: 5, rarity: 'rare' },

  // Tier 6-7 (Avançados)
  shadow_essence: { name: 'Essência Sombria', emoji: '🌑', tier: 6, rarity: 'rare' },
  dark_crystal: { name: 'Cristal Negro', emoji: '🖤💎', tier: 6, rarity: 'rare' },
  cursed_metal: { name: 'Metal Amaldiçoado', emoji: '⛓️', tier: 7, rarity: 'epic' },
  dragon_scale: { name: 'Escama de Dragão', emoji: '🐉', tier: 7, rarity: 'epic' },

  // Tier 8-9 (Raros)
  chaos_fragment: { name: 'Fragmento do Caos', emoji: '🌀', tier: 8, rarity: 'epic' },
  void_crystal: { name: 'Cristal do Vazio', emoji: '🕳️', tier: 8, rarity: 'epic' },
  primordial_essence: { name: 'Essência Primordial', emoji: '✨', tier: 9, rarity: 'legendary' },
  phoenix_feather: { name: 'Pena de Fênix', emoji: '🔥🪶', tier: 9, rarity: 'legendary' },

  // Tier 10 (Lendários)
  demonic_core: { name: 'Núcleo Demoníaco', emoji: '👿', tier: 10, rarity: 'legendary' },
  infernal_gem: { name: 'Gema Infernal', emoji: '🔥💎', tier: 10, rarity: 'legendary' },
  soul_shard: { name: 'Fragmento de Alma', emoji: '👻💎', tier: 10, rarity: 'mythic' },
  divine_essence: { name: 'Essência Divina', emoji: '✨☀️', tier: 10, rarity: 'mythic' },
};

// ==================== RECEITAS DE EQUIPAMENTOS ====================

export const EQUIPMENT_RECIPES: CraftingRecipe[] = [
  // ===== TIER 8 - EPIC =====
  {
    recipeId: 'chaos_blade',
    name: 'Lâmina do Caos',
    description: 'Uma espada forjada com fragmentos do próprio caos.',
    emoji: '⚔️🌀',
    category: 'equipment',
    requiredLevel: 55,
    requiredCoins: 25000,
    ingredients: [
      { materialId: 'chaos_fragment', materialName: 'Fragmento do Caos', quantity: 5 },
      { materialId: 'cursed_metal', materialName: 'Metal Amaldiçoado', quantity: 8 },
      { materialId: 'dark_crystal', materialName: 'Cristal Negro', quantity: 3 },
    ],
    result: {
      type: 'equipment',
      itemId: 'chaos_blade',
      quantity: 1,
      slot: 'weapon',
      tier: 8,
      rarity: 'epic',
      stats: { attack: 180, critChance: 12, critDamage: 25 },
    },
    craftingTime: 300,
    successRate: 75,
    guildBonus: { successRateBonus: 10, costReduction: 15 },
  },
  {
    recipeId: 'void_armor',
    name: 'Armadura do Vazio',
    description: 'Armadura que absorve dano no vazio entre dimensões.',
    emoji: '🛡️🕳️',
    category: 'equipment',
    requiredLevel: 55,
    requiredCoins: 30000,
    ingredients: [
      { materialId: 'void_crystal', materialName: 'Cristal do Vazio', quantity: 4 },
      { materialId: 'shadow_essence', materialName: 'Essência Sombria', quantity: 6 },
      { materialId: 'dragon_scale', materialName: 'Escama de Dragão', quantity: 5 },
    ],
    result: {
      type: 'equipment',
      itemId: 'void_armor',
      quantity: 1,
      slot: 'armor',
      tier: 8,
      rarity: 'epic',
      stats: { defense: 150, hp: 500, evasion: 8 },
    },
    craftingTime: 360,
    successRate: 70,
    guildBonus: { successRateBonus: 10, costReduction: 15 },
  },
  {
    recipeId: 'chaos_helm',
    name: 'Elmo do Caos',
    description: 'Um elmo que confere visão além do véu da realidade.',
    emoji: '⛑️🌀',
    category: 'equipment',
    requiredLevel: 55,
    requiredCoins: 20000,
    ingredients: [
      { materialId: 'chaos_fragment', materialName: 'Fragmento do Caos', quantity: 3 },
      { materialId: 'cursed_metal', materialName: 'Metal Amaldiçoado', quantity: 5 },
      { materialId: 'magic_crystal', materialName: 'Cristal Mágico', quantity: 4 },
    ],
    result: {
      type: 'equipment',
      itemId: 'chaos_helm',
      quantity: 1,
      slot: 'helmet',
      tier: 8,
      rarity: 'epic',
      stats: { defense: 80, hp: 300, critChance: 5 },
    },
    craftingTime: 240,
    successRate: 80,
    guildBonus: { successRateBonus: 10, costReduction: 15 },
  },

  // ===== TIER 9 - LEGENDARY =====
  {
    recipeId: 'primordial_sword',
    name: 'Espada Primordial',
    description: 'Forjada na aurora dos tempos, carrega o poder da criação.',
    emoji: '⚔️✨',
    category: 'equipment',
    requiredLevel: 70,
    requiredCoins: 75000,
    ingredients: [
      { materialId: 'primordial_essence', materialName: 'Essência Primordial', quantity: 3 },
      { materialId: 'chaos_fragment', materialName: 'Fragmento do Caos', quantity: 8 },
      { materialId: 'void_crystal', materialName: 'Cristal do Vazio', quantity: 5 },
      { materialId: 'phoenix_feather', materialName: 'Pena de Fênix', quantity: 2 },
    ],
    result: {
      type: 'equipment',
      itemId: 'primordial_sword',
      quantity: 1,
      slot: 'weapon',
      tier: 9,
      rarity: 'legendary',
      stats: { attack: 280, critChance: 18, critDamage: 40, lifesteal: 5 },
    },
    craftingTime: 600,
    successRate: 55,
    guildBonus: { successRateBonus: 15, costReduction: 20 },
  },
  {
    recipeId: 'phoenix_armor',
    name: 'Armadura da Fênix',
    description: 'Armadura abençoada pelo fogo eterno da fênix.',
    emoji: '🛡️🔥',
    category: 'equipment',
    requiredLevel: 70,
    requiredCoins: 80000,
    ingredients: [
      { materialId: 'phoenix_feather', materialName: 'Pena de Fênix', quantity: 4 },
      { materialId: 'primordial_essence', materialName: 'Essência Primordial', quantity: 2 },
      { materialId: 'dragon_scale', materialName: 'Escama de Dragão', quantity: 10 },
      { materialId: 'infernal_gem', materialName: 'Gema Infernal', quantity: 2 },
    ],
    result: {
      type: 'equipment',
      itemId: 'phoenix_armor',
      quantity: 1,
      slot: 'armor',
      tier: 9,
      rarity: 'legendary',
      stats: { defense: 220, hp: 800, lifesteal: 8 },
    },
    craftingTime: 720,
    successRate: 50,
    guildBonus: { successRateBonus: 15, costReduction: 20 },
  },
  {
    recipeId: 'void_ring',
    name: 'Anel do Vazio',
    description: 'Um anel que conecta o usuário ao vazio infinito.',
    emoji: '💍🕳️',
    category: 'equipment',
    requiredLevel: 65,
    requiredCoins: 50000,
    ingredients: [
      { materialId: 'void_crystal', materialName: 'Cristal do Vazio', quantity: 6 },
      { materialId: 'primordial_essence', materialName: 'Essência Primordial', quantity: 1 },
      { materialId: 'dark_crystal', materialName: 'Cristal Negro', quantity: 5 },
    ],
    result: {
      type: 'equipment',
      itemId: 'void_ring',
      quantity: 1,
      slot: 'ring',
      tier: 9,
      rarity: 'legendary',
      stats: { attack: 50, defense: 50, evasion: 15, critChance: 10 },
    },
    craftingTime: 480,
    successRate: 60,
    guildBonus: { successRateBonus: 15, costReduction: 20 },
  },

  // ===== TIER 10 - MYTHIC =====
  {
    recipeId: 'demon_slayer_blade',
    name: 'Matador de Demônios',
    description: 'A lâmina definitiva contra as forças do inferno.',
    emoji: '⚔️👿',
    category: 'equipment',
    requiredLevel: 80,
    requiredCoins: 200000,
    ingredients: [
      { materialId: 'demonic_core', materialName: 'Núcleo Demoníaco', quantity: 3 },
      { materialId: 'soul_shard', materialName: 'Fragmento de Alma', quantity: 2 },
      { materialId: 'divine_essence', materialName: 'Essência Divina', quantity: 1 },
      { materialId: 'primordial_essence', materialName: 'Essência Primordial', quantity: 5 },
      { materialId: 'infernal_gem', materialName: 'Gema Infernal', quantity: 4 },
    ],
    result: {
      type: 'equipment',
      itemId: 'demon_slayer_blade',
      quantity: 1,
      slot: 'weapon',
      tier: 10,
      rarity: 'legendary',
      stats: { attack: 450, critChance: 25, critDamage: 60, lifesteal: 10 },
    },
    craftingTime: 1800,
    successRate: 35,
    guildBonus: { successRateBonus: 20, costReduction: 25 },
  },
  {
    recipeId: 'divine_armor',
    name: 'Armadura Divina',
    description: 'Armadura abençoada pelos deuses, quase indestrutível.',
    emoji: '🛡️☀️',
    category: 'equipment',
    requiredLevel: 80,
    requiredCoins: 250000,
    ingredients: [
      { materialId: 'divine_essence', materialName: 'Essência Divina', quantity: 2 },
      { materialId: 'soul_shard', materialName: 'Fragmento de Alma', quantity: 3 },
      { materialId: 'phoenix_feather', materialName: 'Pena de Fênix', quantity: 6 },
      { materialId: 'primordial_essence', materialName: 'Essência Primordial', quantity: 4 },
      { materialId: 'dragon_scale', materialName: 'Escama de Dragão', quantity: 15 },
    ],
    result: {
      type: 'equipment',
      itemId: 'divine_armor',
      quantity: 1,
      slot: 'armor',
      tier: 10,
      rarity: 'legendary',
      stats: { defense: 350, hp: 1500, evasion: 10, lifesteal: 5 },
    },
    craftingTime: 2400,
    successRate: 30,
    guildBonus: { successRateBonus: 20, costReduction: 25 },
  },
  {
    recipeId: 'soul_crown',
    name: 'Coroa das Almas',
    description: 'Uma coroa forjada com fragmentos de almas poderosas.',
    emoji: '👑👻',
    category: 'equipment',
    requiredLevel: 80,
    requiredCoins: 180000,
    ingredients: [
      { materialId: 'soul_shard', materialName: 'Fragmento de Alma', quantity: 4 },
      { materialId: 'demonic_core', materialName: 'Núcleo Demoníaco', quantity: 2 },
      { materialId: 'void_crystal', materialName: 'Cristal do Vazio', quantity: 8 },
      { materialId: 'infernal_gem', materialName: 'Gema Infernal', quantity: 3 },
    ],
    result: {
      type: 'equipment',
      itemId: 'soul_crown',
      quantity: 1,
      slot: 'helmet',
      tier: 10,
      rarity: 'legendary',
      stats: { defense: 180, hp: 600, critChance: 15, critDamage: 30 },
    },
    craftingTime: 1200,
    successRate: 40,
    guildBonus: { successRateBonus: 20, costReduction: 25 },
  },
];

// ==================== RECEITAS DE CONSUMÍVEIS ====================

export const CONSUMABLE_RECIPES: CraftingRecipe[] = [
  {
    recipeId: 'greater_health_potion',
    name: 'Poção de Vida Maior',
    description: 'Restaura uma grande quantidade de HP.',
    emoji: '❤️',
    category: 'consumable',
    requiredLevel: 30,
    requiredCoins: 500,
    ingredients: [
      { materialId: 'ectoplasm', materialName: 'Ectoplasma', quantity: 2 },
      { materialId: 'magic_crystal', materialName: 'Cristal Mágico', quantity: 1 },
    ],
    result: {
      type: 'consumable',
      itemId: 'greater_health_potion',
      quantity: 3,
    },
    craftingTime: 60,
    successRate: 95,
  },
  {
    recipeId: 'power_elixir',
    name: 'Elixir de Poder',
    description: 'Aumenta o ataque temporariamente.',
    emoji: '💪',
    category: 'consumable',
    requiredLevel: 40,
    requiredCoins: 1500,
    ingredients: [
      { materialId: 'shadow_essence', materialName: 'Essência Sombria', quantity: 2 },
      { materialId: 'ancient_rune', materialName: 'Runa Antiga', quantity: 1 },
      { materialId: 'magic_crystal', materialName: 'Cristal Mágico', quantity: 2 },
    ],
    result: {
      type: 'consumable',
      itemId: 'power_elixir',
      quantity: 2,
    },
    craftingTime: 120,
    successRate: 85,
  },
  {
    recipeId: 'phoenix_tears',
    name: 'Lágrimas de Fênix',
    description: 'Revive automaticamente ao morrer.',
    emoji: '🔥💧',
    category: 'consumable',
    requiredLevel: 60,
    requiredCoins: 10000,
    ingredients: [
      { materialId: 'phoenix_feather', materialName: 'Pena de Fênix', quantity: 1 },
      { materialId: 'primordial_essence', materialName: 'Essência Primordial', quantity: 1 },
      { materialId: 'magic_crystal', materialName: 'Cristal Mágico', quantity: 5 },
    ],
    result: {
      type: 'consumable',
      itemId: 'phoenix_tears',
      quantity: 1,
    },
    craftingTime: 300,
    successRate: 70,
    guildBonus: { successRateBonus: 10, costReduction: 15 },
  },
];

// ==================== RECEITAS DE MATERIAIS ====================

export const MATERIAL_RECIPES: CraftingRecipe[] = [
  {
    recipeId: 'steel_ingot_craft',
    name: 'Lingote de Aço',
    description: 'Combina minério de ferro para criar aço.',
    emoji: '🔩',
    category: 'material',
    requiredLevel: 20,
    requiredCoins: 200,
    ingredients: [
      { materialId: 'iron_ore', materialName: 'Minério de Ferro', quantity: 5 },
    ],
    result: {
      type: 'material',
      itemId: 'steel_ingot',
      quantity: 2,
    },
    craftingTime: 30,
    successRate: 100,
  },
  {
    recipeId: 'enchanted_leather_craft',
    name: 'Couro Encantado',
    description: 'Encanta couro comum com cristais mágicos.',
    emoji: '✨🟤',
    category: 'material',
    requiredLevel: 25,
    requiredCoins: 500,
    ingredients: [
      { materialId: 'leather', materialName: 'Couro', quantity: 5 },
      { materialId: 'magic_crystal', materialName: 'Cristal Mágico', quantity: 1 },
    ],
    result: {
      type: 'material',
      itemId: 'enchanted_leather',
      quantity: 3,
    },
    craftingTime: 45,
    successRate: 90,
  },
];

// ==================== FUNÇÕES AUXILIARES ====================

export const ALL_RECIPES: CraftingRecipe[] = [
  ...EQUIPMENT_RECIPES,
  ...CONSUMABLE_RECIPES,
  ...MATERIAL_RECIPES,
];

export const getRecipeById = (recipeId: string): CraftingRecipe | undefined => {
  return ALL_RECIPES.find(r => r.recipeId === recipeId);
};

export const getRecipesByCategory = (category: CraftingRecipe['category']): CraftingRecipe[] => {
  return ALL_RECIPES.filter(r => r.category === category);
};

export const getAvailableRecipes = (playerLevel: number): CraftingRecipe[] => {
  return ALL_RECIPES.filter(r => r.requiredLevel <= playerLevel);
};

export const getMaterialInfo = (materialId: string) => {
  return MATERIALS[materialId];
};

export const getRarityColor = (rarity: string): number => {
  const colors: Record<string, number> = {
    common: 0x95A5A6,
    uncommon: 0x2ECC71,
    rare: 0x3498DB,
    epic: 0x9B59B6,
    legendary: 0xF1C40F,
    mythic: 0xE74C3C,
  };
  return colors[rarity] || 0x95A5A6;
};

export default ALL_RECIPES;
