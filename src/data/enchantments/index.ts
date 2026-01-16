// Sistema de Encantamentos
import { EquipmentSlot } from '../../database/models';

// Tipo de encantamento
export type EnchantmentType = 'fury' | 'protection' | 'vampiric' | 'precision' | 'speed' | 'vitality' | 'fortune' | 'destruction';

// Stat afetada pelo encantamento
export type EnchantmentStat = 'attack' | 'defense' | 'hp' | 'critChance' | 'critDamage' | 'evasion' | 'lifesteal' | 'dropRate';

// Material necessário para encantamento
export interface EnchantmentMaterial {
  materialId: string;
  materialName: string;
  baseQuantity: number; // Quantidade por nível
}

// Definição de encantamento
export interface EnchantmentData {
  enchantmentId: EnchantmentType;
  name: string;
  description: string;
  emoji: string;
  stat: EnchantmentStat;
  baseValue: number; // Valor base no nível 1
  valuePerLevel: number; // Aumento por nível (multiplicado)
  isPercent: boolean; // Se o valor é porcentagem
  maxLevel: number;
  material: EnchantmentMaterial;
  baseCost: number; // Custo em coins
  applicableSlots: EquipmentSlot[];
}

// Resultado de tentativa de encantamento
export interface EnchantmentResult {
  success: boolean;
  destroyed: boolean;
  newLevel: number;
  message: string;
}

// ==================== ENCANTAMENTOS ====================

export const ENCHANTMENTS: Record<EnchantmentType, EnchantmentData> = {
  fury: {
    enchantmentId: 'fury',
    name: 'Fúria',
    description: 'Aumenta o dano de ataque.',
    emoji: '🔥',
    stat: 'attack',
    baseValue: 15,
    valuePerLevel: 1.5, // 15%, 22.5%, 33.75%, 50.6%, 75.9%
    isPercent: true,
    maxLevel: 5,
    material: {
      materialId: 'fury_essence',
      materialName: 'Essência de Fúria',
      baseQuantity: 3,
    },
    baseCost: 5000,
    applicableSlots: ['weapon'],
  },

  protection: {
    enchantmentId: 'protection',
    name: 'Proteção',
    description: 'Aumenta a defesa.',
    emoji: '🛡️',
    stat: 'defense',
    baseValue: 10,
    valuePerLevel: 1.5,
    isPercent: true,
    maxLevel: 5,
    material: {
      materialId: 'dragon_scale',
      materialName: 'Escama de Dragão',
      baseQuantity: 2,
    },
    baseCost: 4000,
    applicableSlots: ['armor', 'helmet', 'boots', 'gloves'],
  },

  vampiric: {
    enchantmentId: 'vampiric',
    name: 'Vampírico',
    description: 'Rouba vida ao atacar.',
    emoji: '🩸',
    stat: 'lifesteal',
    baseValue: 5,
    valuePerLevel: 1.4,
    isPercent: true,
    maxLevel: 5,
    material: {
      materialId: 'cursed_blood',
      materialName: 'Sangue Amaldiçoado',
      baseQuantity: 4,
    },
    baseCost: 8000,
    applicableSlots: ['weapon', 'ring'],
  },

  precision: {
    enchantmentId: 'precision',
    name: 'Precisão',
    description: 'Aumenta a chance de crítico.',
    emoji: '🎯',
    stat: 'critChance',
    baseValue: 8,
    valuePerLevel: 1.4,
    isPercent: true,
    maxLevel: 5,
    material: {
      materialId: 'eagle_eye',
      materialName: 'Olho de Águia',
      baseQuantity: 2,
    },
    baseCost: 6000,
    applicableSlots: ['weapon', 'helmet', 'ring'],
  },

  speed: {
    enchantmentId: 'speed',
    name: 'Velocidade',
    description: 'Aumenta a chance de evasão.',
    emoji: '💨',
    stat: 'evasion',
    baseValue: 10,
    valuePerLevel: 1.4,
    isPercent: true,
    maxLevel: 5,
    material: {
      materialId: 'phoenix_feather',
      materialName: 'Pena de Fênix',
      baseQuantity: 2,
    },
    baseCost: 7000,
    applicableSlots: ['boots', 'gloves', 'ring'],
  },

  vitality: {
    enchantmentId: 'vitality',
    name: 'Vitalidade',
    description: 'Aumenta o HP máximo.',
    emoji: '❤️',
    stat: 'hp',
    baseValue: 100,
    valuePerLevel: 1.5,
    isPercent: false,
    maxLevel: 5,
    material: {
      materialId: 'life_crystal',
      materialName: 'Cristal da Vida',
      baseQuantity: 3,
    },
    baseCost: 4000,
    applicableSlots: ['armor', 'helmet', 'amulet'],
  },

  fortune: {
    enchantmentId: 'fortune',
    name: 'Fortuna',
    description: 'Aumenta a taxa de drop.',
    emoji: '🍀',
    stat: 'dropRate',
    baseValue: 5,
    valuePerLevel: 1.3,
    isPercent: true,
    maxLevel: 5,
    material: {
      materialId: 'lucky_coin',
      materialName: 'Moeda da Sorte',
      baseQuantity: 5,
    },
    baseCost: 10000,
    applicableSlots: ['ring', 'amulet'],
  },

  destruction: {
    enchantmentId: 'destruction',
    name: 'Destruição',
    description: 'Aumenta o dano crítico.',
    emoji: '💥',
    stat: 'critDamage',
    baseValue: 20,
    valuePerLevel: 1.5,
    isPercent: true,
    maxLevel: 5,
    material: {
      materialId: 'chaos_fragment',
      materialName: 'Fragmento do Caos',
      baseQuantity: 3,
    },
    baseCost: 8000,
    applicableSlots: ['weapon', 'ring'],
  },
};

// Materiais de encantamento
export const ENCHANTMENT_MATERIALS: Record<string, { name: string; emoji: string; tier: number }> = {
  fury_essence: { name: 'Essência de Fúria', emoji: '🔥', tier: 6 },
  dragon_scale: { name: 'Escama de Dragão', emoji: '🐉', tier: 7 },
  cursed_blood: { name: 'Sangue Amaldiçoado', emoji: '🩸', tier: 7 },
  eagle_eye: { name: 'Olho de Águia', emoji: '👁️', tier: 6 },
  phoenix_feather: { name: 'Pena de Fênix', emoji: '🪶', tier: 9 },
  life_crystal: { name: 'Cristal da Vida', emoji: '💎❤️', tier: 6 },
  lucky_coin: { name: 'Moeda da Sorte', emoji: '🪙', tier: 8 },
  chaos_fragment: { name: 'Fragmento do Caos', emoji: '🌀', tier: 8 },
};

// ==================== FUNÇÕES AUXILIARES ====================

export const getEnchantmentById = (enchantmentId: EnchantmentType): EnchantmentData | undefined => {
  return ENCHANTMENTS[enchantmentId];
};

export const getAllEnchantments = (): EnchantmentData[] => {
  return Object.values(ENCHANTMENTS);
};

export const getEnchantmentsForSlot = (slot: EquipmentSlot): EnchantmentData[] => {
  return Object.values(ENCHANTMENTS).filter(e => e.applicableSlots.includes(slot));
};

// Calcular valor do encantamento para um nível
export const calculateEnchantmentValue = (enchantment: EnchantmentData, level: number): number => {
  if (level <= 0) return 0;
  return Math.floor(enchantment.baseValue * Math.pow(enchantment.valuePerLevel, level - 1));
};

// Calcular custo para encantar
export const calculateEnchantmentCost = (enchantment: EnchantmentData, targetLevel: number): {
  coins: number;
  materials: number;
} => {
  // Custo aumenta exponencialmente com o nível
  const levelMultiplier = Math.pow(2, targetLevel - 1);
  return {
    coins: Math.floor(enchantment.baseCost * levelMultiplier),
    materials: enchantment.material.baseQuantity * targetLevel,
  };
};

// Calcular chance de sucesso
export const calculateSuccessRate = (targetLevel: number): number => {
  // Nível 1: 100%, Nível 2: 85%, Nível 3: 65%, Nível 4: 45%, Nível 5: 25%
  const rates = [100, 85, 65, 45, 25];
  return rates[targetLevel - 1] || 10;
};

// Calcular chance de destruição em caso de falha
export const calculateDestructionRate = (targetLevel: number): number => {
  // Nível 1: 0%, Nível 2: 5%, Nível 3: 15%, Nível 4: 30%, Nível 5: 50%
  const rates = [0, 5, 15, 30, 50];
  return rates[targetLevel - 1] || 50;
};

// Formatar valor do encantamento
export const formatEnchantmentValue = (enchantment: EnchantmentData, level: number): string => {
  const value = calculateEnchantmentValue(enchantment, level);
  return enchantment.isPercent ? `+${value}%` : `+${value}`;
};

// Obter nome do nível em romano
export const getLevelNumeral = (level: number): string => {
  const numerals = ['I', 'II', 'III', 'IV', 'V'];
  return numerals[level - 1] || `${level}`;
};

export default ENCHANTMENTS;
