// Classes - Index
export * from './baseClasses';
export * from './intermediateClasses';
export * from './advancedClasses';
export * from './wildcardClasses';

import { BaseClassName, baseClasses } from './baseClasses';
import { IntermediateClassName, intermediateClasses } from './intermediateClasses';
import { AdvancedClassName, advancedClasses } from './advancedClasses';
import {
  WildcardIntermediateClassName,
  WildcardAdvancedClassName,
  wildcardIntermediateClasses,
  wildcardAdvancedClasses,
} from './wildcardClasses';

// Tipo unificado para qualquer classe
export type AnyClassName =
  | BaseClassName
  | IntermediateClassName
  | AdvancedClassName
  | WildcardIntermediateClassName
  | WildcardAdvancedClassName;

// Tipo para tier de classe
export type ClassTier = 'base' | 'intermediate' | 'advanced' | 'wildcard_intermediate' | 'wildcard_advanced';

// Interface genérica para informações de classe
export interface ClassInfo {
  id: string;
  name: string;
  emoji: string;
  tier: ClassTier;
  description: string;
}

// Obter informações de qualquer classe pelo ID
export const getClassInfo = (classId: string): ClassInfo | null => {
  // Check base classes
  if (classId in baseClasses) {
    const c = baseClasses[classId as BaseClassName];
    return { id: c.id, name: c.name, emoji: c.emoji, tier: 'base', description: c.description };
  }

  // Check intermediate classes
  if (classId in intermediateClasses) {
    const c = intermediateClasses[classId as IntermediateClassName];
    return { id: c.id, name: c.name, emoji: c.emoji, tier: 'intermediate', description: c.description };
  }

  // Check advanced classes
  if (classId in advancedClasses) {
    const c = advancedClasses[classId as AdvancedClassName];
    return { id: c.id, name: c.name, emoji: c.emoji, tier: 'advanced', description: c.description };
  }

  // Check wildcard intermediate
  if (classId in wildcardIntermediateClasses) {
    const c = wildcardIntermediateClasses[classId as WildcardIntermediateClassName];
    return { id: c.id, name: c.name, emoji: c.emoji, tier: 'wildcard_intermediate', description: c.description };
  }

  // Check wildcard advanced
  if (classId in wildcardAdvancedClasses) {
    const c = wildcardAdvancedClasses[classId as WildcardAdvancedClassName];
    return { id: c.id, name: c.name, emoji: c.emoji, tier: 'wildcard_advanced', description: c.description };
  }

  return null;
};

// Obter tier de uma classe
export const getClassTier = (classId: string): ClassTier | null => {
  if (classId in baseClasses) return 'base';
  if (classId in intermediateClasses) return 'intermediate';
  if (classId in advancedClasses) return 'advanced';
  if (classId in wildcardIntermediateClasses) return 'wildcard_intermediate';
  if (classId in wildcardAdvancedClasses) return 'wildcard_advanced';
  return null;
};

// Constantes de níveis de evolução
export const CLASS_EVOLUTION_LEVELS = {
  INTERMEDIATE: 30,
  ADVANCED: 60,
};

// Obter multiplicador de stats de uma classe
export const getClassStatMultiplier = (classId: string): number => {
  // Base classes have 1.0 multiplier
  if (classId in baseClasses) return 1.0;

  // Intermediate classes
  if (classId in intermediateClasses) {
    const c = intermediateClasses[classId as IntermediateClassName];
    return (c.statMultipliers.attack + c.statMultipliers.defense + c.statMultipliers.hp) / 3;
  }

  // Advanced classes
  if (classId in advancedClasses) {
    const c = advancedClasses[classId as AdvancedClassName];
    return (c.statMultipliers.attack + c.statMultipliers.defense + c.statMultipliers.hp) / 3;
  }

  // Wildcard intermediate (uses statBonus)
  if (classId in wildcardIntermediateClasses) {
    const c = wildcardIntermediateClasses[classId as WildcardIntermediateClassName];
    return c.statBonus;
  }

  // Wildcard advanced (uses statBonus)
  if (classId in wildcardAdvancedClasses) {
    const c = wildcardAdvancedClasses[classId as WildcardAdvancedClassName];
    return c.statBonus;
  }

  return 1.0;
};

// Contagem total de classes
export const CLASS_COUNTS = {
  base: Object.keys(baseClasses).length,
  intermediate: Object.keys(intermediateClasses).length,
  advanced: Object.keys(advancedClasses).length,
  wildcardIntermediate: Object.keys(wildcardIntermediateClasses).length,
  wildcardAdvanced: Object.keys(wildcardAdvancedClasses).length,
  get total() {
    return this.base + this.intermediate + this.advanced + this.wildcardIntermediate + this.wildcardAdvanced;
  },
};
