// Classes Base - Nível 1
export type BaseClassName = 'warrior' | 'mage' | 'archer' | 'paladin';

export interface BaseClass {
  id: BaseClassName;
  name: string;
  emoji: string;
  description: string;
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    critChance: number;
    critDamage: number;
  };
  primaryAttribute: 'str' | 'int' | 'vit' | 'agi' | 'luk';
  evolutionLevel: number; // Nível para evoluir (30)
}

export const baseClasses: Record<BaseClassName, BaseClass> = {
  warrior: {
    id: 'warrior',
    name: 'Guerreiro',
    emoji: '⚔️',
    description: 'Mestre do combate corpo a corpo. Alta força e resistência.',
    baseStats: {
      hp: 150,
      attack: 20,
      defense: 15,
      critChance: 5,
      critDamage: 150,
    },
    primaryAttribute: 'str',
    evolutionLevel: 30,
  },
  mage: {
    id: 'mage',
    name: 'Mago',
    emoji: '🔮',
    description: 'Domina as artes arcanas. Alto dano mágico e utilidade.',
    baseStats: {
      hp: 100,
      attack: 25,
      defense: 8,
      critChance: 10,
      critDamage: 180,
    },
    primaryAttribute: 'int',
    evolutionLevel: 30,
  },
  archer: {
    id: 'archer',
    name: 'Arqueiro',
    emoji: '🏹',
    description: 'Especialista em ataques à distância. Alta precisão e crítico.',
    baseStats: {
      hp: 110,
      attack: 22,
      defense: 10,
      critChance: 15,
      critDamage: 200,
    },
    primaryAttribute: 'agi',
    evolutionLevel: 30,
  },
  paladin: {
    id: 'paladin',
    name: 'Paladino',
    emoji: '🛡️',
    description: 'Guerreiro sagrado. Equilibrado entre defesa e suporte.',
    baseStats: {
      hp: 140,
      attack: 18,
      defense: 18,
      critChance: 5,
      critDamage: 150,
    },
    primaryAttribute: 'vit',
    evolutionLevel: 30,
  },
};

export const getBaseClass = (classId: BaseClassName): BaseClass | undefined => {
  return baseClasses[classId];
};

export const getAllBaseClasses = (): BaseClass[] => {
  return Object.values(baseClasses);
};
