// Classes Intermediárias - Nível 30
import { BaseClassName } from './baseClasses';

export type IntermediateClassName =
  | 'berserker' | 'knight'           // Warrior
  | 'elementalist' | 'necromancer'   // Mage
  | 'sniper' | 'hunter'              // Archer
  | 'crusader' | 'guardian';         // Paladin

export interface IntermediateClass {
  id: IntermediateClassName;
  name: string;
  emoji: string;
  description: string;
  parentClass: BaseClassName;
  statMultipliers: {
    hp: number;
    attack: number;
    defense: number;
    critChance: number;
    critDamage: number;
  };
  bonusStats: {
    hp: number;
    attack: number;
    defense: number;
  };
  evolutionLevel: number; // Nível para evoluir (60)
  specialAbility: string;
}

export const intermediateClasses: Record<IntermediateClassName, IntermediateClass> = {
  // Warrior evolutions
  berserker: {
    id: 'berserker',
    name: 'Berserker',
    emoji: '🔥',
    description: 'Guerreiro furioso que sacrifica defesa por dano devastador.',
    parentClass: 'warrior',
    statMultipliers: { hp: 1.1, attack: 1.4, defense: 0.9, critChance: 1.2, critDamage: 1.3 },
    bonusStats: { hp: 50, attack: 15, defense: 0 },
    evolutionLevel: 60,
    specialAbility: 'Frenesi: Ganha dano ao perder HP',
  },
  knight: {
    id: 'knight',
    name: 'Cavaleiro',
    emoji: '🐴',
    description: 'Guerreiro honorável com defesa sólida e contra-ataques.',
    parentClass: 'warrior',
    statMultipliers: { hp: 1.3, attack: 1.1, defense: 1.4, critChance: 1.0, critDamage: 1.1 },
    bonusStats: { hp: 100, attack: 5, defense: 15 },
    evolutionLevel: 60,
    specialAbility: 'Contra-ataque: 20% chance de revidar',
  },

  // Mage evolutions
  elementalist: {
    id: 'elementalist',
    name: 'Elementalista',
    emoji: '⚡',
    description: 'Mestre dos elementos que manipula fogo, gelo e raio.',
    parentClass: 'mage',
    statMultipliers: { hp: 1.0, attack: 1.5, defense: 0.9, critChance: 1.3, critDamage: 1.2 },
    bonusStats: { hp: 20, attack: 20, defense: 0 },
    evolutionLevel: 60,
    specialAbility: 'Maestria Elemental: +25% dano elemental',
  },
  necromancer: {
    id: 'necromancer',
    name: 'Necromante',
    emoji: '💀',
    description: 'Mago sombrio que drena vida e invoca mortos-vivos.',
    parentClass: 'mage',
    statMultipliers: { hp: 1.2, attack: 1.3, defense: 1.0, critChance: 1.1, critDamage: 1.2 },
    bonusStats: { hp: 40, attack: 15, defense: 5 },
    evolutionLevel: 60,
    specialAbility: 'Drenar Vida: 15% do dano vira cura',
  },

  // Archer evolutions
  sniper: {
    id: 'sniper',
    name: 'Atirador de Elite',
    emoji: '🎯',
    description: 'Mestre da precisão com dano crítico devastador.',
    parentClass: 'archer',
    statMultipliers: { hp: 0.9, attack: 1.3, defense: 0.8, critChance: 1.8, critDamage: 1.5 },
    bonusStats: { hp: 0, attack: 15, defense: 0 },
    evolutionLevel: 60,
    specialAbility: 'Tiro Certeiro: +30% dano crítico',
  },
  hunter: {
    id: 'hunter',
    name: 'Caçador',
    emoji: '🐾',
    description: 'Especialista em armadilhas e sinergia com pets.',
    parentClass: 'archer',
    statMultipliers: { hp: 1.1, attack: 1.2, defense: 1.0, critChance: 1.3, critDamage: 1.2 },
    bonusStats: { hp: 30, attack: 10, defense: 5 },
    evolutionLevel: 60,
    specialAbility: 'Empatia Animal: Pets +25% stats',
  },

  // Paladin evolutions
  crusader: {
    id: 'crusader',
    name: 'Cruzado',
    emoji: '✝️',
    description: 'Guerreiro sagrado focado em dano sagrado e cura.',
    parentClass: 'paladin',
    statMultipliers: { hp: 1.1, attack: 1.3, defense: 1.1, critChance: 1.2, critDamage: 1.2 },
    bonusStats: { hp: 40, attack: 12, defense: 8 },
    evolutionLevel: 60,
    specialAbility: 'Luz Sagrada: Ataques curam 10% do dano',
  },
  guardian: {
    id: 'guardian',
    name: 'Guardião',
    emoji: '🏰',
    description: 'Defensor supremo com proteção máxima para si e aliados.',
    parentClass: 'paladin',
    statMultipliers: { hp: 1.4, attack: 0.9, defense: 1.6, critChance: 0.8, critDamage: 1.0 },
    bonusStats: { hp: 150, attack: 0, defense: 20 },
    evolutionLevel: 60,
    specialAbility: 'Escudo Divino: -30% dano recebido',
  },
};

export const getIntermediateClass = (classId: IntermediateClassName): IntermediateClass | undefined => {
  return intermediateClasses[classId];
};

export const getIntermediateClassesForBase = (baseClass: BaseClassName): IntermediateClass[] => {
  return Object.values(intermediateClasses).filter(c => c.parentClass === baseClass);
};

export const getAllIntermediateClasses = (): IntermediateClass[] => {
  return Object.values(intermediateClasses);
};
