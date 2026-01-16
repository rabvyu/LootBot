// Classes Wildcard - Classes especiais obtidas por sorte

export type WildcardIntermediateClassName = 'chaos_disciple' | 'light_avatar';
export type WildcardAdvancedClassName = 'transcendent' | 'void_walker' | 'inner_demon' | 'legendary_hero';

export interface WildcardClass {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tier: 'intermediate' | 'advanced';
  dropChance: number; // Porcentagem (5% ou 1%)
  statBonus: number; // Multiplicador de todos os stats (1.15 = +15%)
  specialAbilities: string[];
  ultimateSkill: string;
  bonusStats: {
    hp: number;
    attack: number;
    defense: number;
  };
}

// Classes Intermediárias Wildcard (5% chance)
export const wildcardIntermediateClasses: Record<WildcardIntermediateClassName, WildcardClass> = {
  chaos_disciple: {
    id: 'chaos_disciple',
    name: 'Discípulo do Caos',
    emoji: '🌀',
    description: 'Mestre do caos com habilidades de todas as classes intermediárias.',
    tier: 'intermediate',
    dropChance: 5,
    statBonus: 1.15,
    specialAbilities: [
      'Acesso a habilidades de TODAS classes intermediárias (50% efetividade)',
      'Caos Aleatório: Efeito aleatório a cada turno',
      'Adaptação: +10% stats contra cada tipo diferente',
    ],
    ultimateSkill: 'Explosão do Caos: Dano aleatório 300-600% + efeito aleatório',
    bonusStats: { hp: 100, attack: 20, defense: 15 },
  },
  light_avatar: {
    id: 'light_avatar',
    name: 'Avatar da Luz',
    emoji: '🌟',
    description: 'Ser de luz pura com cura e dano sagrado combinados.',
    tier: 'intermediate',
    dropChance: 5,
    statBonus: 1.15,
    specialAbilities: [
      'Forma de Luz: +20% dano sagrado, +20% cura',
      'Pureza: Imune a debuffs',
      'Benção Solar: Ataques curam 15% do dano',
    ],
    ultimateSkill: 'Luz Suprema: 400% dano sagrado + cura total aliados',
    bonusStats: { hp: 120, attack: 18, defense: 18 },
  },
};

// Classes Avançadas Wildcard (1% chance)
export const wildcardAdvancedClasses: Record<WildcardAdvancedClassName, WildcardClass> = {
  transcendent: {
    id: 'transcendent',
    name: 'Transcendente',
    emoji: '💎',
    description: 'Ser além da mortalidade com acesso a múltiplas skill trees.',
    tier: 'advanced',
    dropChance: 1,
    statBonus: 1.20,
    specialAbilities: [
      'Acesso a 2 skill trees de classes diferentes',
      'Transcendência: Stats escalam com HP E mana',
      'Forma Etérea: 30% chance de ignorar dano',
    ],
    ultimateSkill: 'Convergência: Usa ultimate de 2 classes ao mesmo tempo',
    bonusStats: { hp: 150, attack: 30, defense: 20 },
  },
  void_walker: {
    id: 'void_walker',
    name: 'Void Walker',
    emoji: '🌌',
    description: 'Manipulador dimensional que transcende o espaço-tempo.',
    tier: 'advanced',
    dropChance: 1,
    statBonus: 1.20,
    specialAbilities: [
      'Portal: Pode fugir e voltar a qualquer batalha',
      'Distorção: 25% chance de repetir ataque',
      'Fase: Pode ignorar 1 ataque por batalha',
    ],
    ultimateSkill: 'Colapso Dimensional: 500% dano + remove inimigo por 3 turnos',
    bonusStats: { hp: 120, attack: 35, defense: 15 },
  },
  inner_demon: {
    id: 'inner_demon',
    name: 'Demônio Interior',
    emoji: '👹',
    description: 'Forma demoníaca com poder destrutivo massivo.',
    tier: 'advanced',
    dropChance: 1,
    statBonus: 1.25, // +25% ataque, +15% outros aplicado manualmente
    specialAbilities: [
      'Forma Demoníaca: +50% ATK, -20% DEF por 5 turnos',
      'Drenar Almas: 25% lifesteal',
      'Aura do Medo: -20% ATK inimigos',
    ],
    ultimateSkill: 'Possessão Total: +200% ATK por 3 turnos, perde controle',
    bonusStats: { hp: 80, attack: 50, defense: 10 },
  },
  legendary_hero: {
    id: 'legendary_hero',
    name: 'Herói Lendário',
    emoji: '🏆',
    description: 'O herói definitivo com todas as habilidades passivas.',
    tier: 'advanced',
    dropChance: 1,
    statBonus: 1.15,
    specialAbilities: [
      'Lenda Viva: Todas habilidades passivas de todas classes',
      'Inspiração: Aliados +30% stats',
      'Destino: Primeiro ataque sempre crítico',
    ],
    ultimateSkill: 'Momento Lendário: Por 5 turnos: +100% stats, imune a morte',
    bonusStats: { hp: 200, attack: 25, defense: 25 },
  },
};

// Funções auxiliares
export const getWildcardIntermediateClass = (id: WildcardIntermediateClassName): WildcardClass | undefined => {
  return wildcardIntermediateClasses[id];
};

export const getWildcardAdvancedClass = (id: WildcardAdvancedClassName): WildcardClass | undefined => {
  return wildcardAdvancedClasses[id];
};

export const getAllWildcardIntermediateClasses = (): WildcardClass[] => {
  return Object.values(wildcardIntermediateClasses);
};

export const getAllWildcardAdvancedClasses = (): WildcardClass[] => {
  return Object.values(wildcardAdvancedClasses);
};

// Rolar para classe wildcard
export const rollForWildcard = (tier: 'intermediate' | 'advanced'): WildcardClass | null => {
  const roll = Math.random() * 100;

  if (tier === 'intermediate') {
    // 5% chance total para wildcards intermediárias
    if (roll < 5) {
      const wildcards = Object.values(wildcardIntermediateClasses);
      return wildcards[Math.floor(Math.random() * wildcards.length)];
    }
  } else {
    // 1% chance total para wildcards avançadas
    if (roll < 1) {
      const wildcards = Object.values(wildcardAdvancedClasses);
      return wildcards[Math.floor(Math.random() * wildcards.length)];
    }
  }

  return null;
};

// Verificar se uma classe é wildcard
export const isWildcardClass = (classId: string): boolean => {
  return classId in wildcardIntermediateClasses || classId in wildcardAdvancedClasses;
};
