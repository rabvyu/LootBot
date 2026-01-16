// Tipos base para o sistema de skills

export type SkillTreeBranch = 'offensive' | 'defensive' | 'utility' | 'ultimate';
export type SkillTier = 1 | 2 | 3 | 4; // 4 = ultimate

export interface SkillEffect {
  type: 'damage_bonus' | 'defense_bonus' | 'hp_bonus' | 'crit_bonus' | 'crit_damage_bonus'
    | 'lifesteal' | 'regen' | 'stun_chance' | 'bleed' | 'poison' | 'burn'
    | 'evasion' | 'block_chance' | 'damage_reduction' | 'xp_bonus' | 'drop_bonus'
    | 'aoe_damage' | 'execute' | 'shield' | 'heal' | 'buff_ally' | 'debuff_enemy'
    | 'revive' | 'immunity' | 'special';
  value: number; // Valor do efeito (porcentagem ou valor fixo)
  duration?: number; // Duração em turnos (se aplicável)
  condition?: string; // Condição para ativar (ex: "hp_below_30")
  description: string; // Descrição do efeito
}

export interface Skill {
  id: string;
  name: string;
  emoji: string;
  description: string;
  branch: SkillTreeBranch;
  tier: SkillTier;
  pointsCost: number; // Pontos necessários para aprender (1, 2, 3, 5 ou 10)
  maxLevel: number; // Nível máximo da skill (1-5)
  requiredPoints: number; // Pontos mínimos na árvore para desbloquear
  requiredSkills?: string[]; // Skills que precisam ser aprendidas antes
  effects: SkillEffect[];
  isPassive: boolean; // Se é passiva ou ativa
  cooldown?: number; // Cooldown em turnos (se ativa)
  manaCost?: number; // Custo de mana (se aplicável)
}

export interface SkillTree {
  classId: string;
  className: string;
  branches: {
    offensive: Skill[];
    defensive: Skill[];
    utility: Skill[];
    ultimate: Skill[];
  };
}

// Função para calcular pontos de skill por nível
export const calculateSkillPoints = (level: number): number => {
  // 1 ponto por nível + 2 extras a cada 10 níveis
  const basePoints = level;
  const bonusPoints = Math.floor(level / 10) * 2;
  return basePoints + bonusPoints;
};

// Função para calcular pontos de atributo por nível
export const calculateAttributePoints = (level: number): number => {
  // 3 pontos por nível
  return level * 3;
};

// Atributos do personagem
export interface CharacterAttributes {
  str: number; // Força - +2 ATK físico, +0.5% dano crítico
  int: number; // Inteligência - +2 ATK mágico, +0.3% chance crítico
  vit: number; // Vitalidade - +10 HP, +1 DEF
  agi: number; // Agilidade - +1% Evasão, +0.5% Velocidade
  luk: number; // Sorte - +0.5% Chance crítico, +1% Drop rate
}

// Efeitos dos atributos
export const ATTRIBUTE_EFFECTS = {
  str: { physicalAttack: 2, critDamage: 0.5 },
  int: { magicAttack: 2, critChance: 0.3 },
  vit: { hp: 10, defense: 1 },
  agi: { evasion: 1, attackSpeed: 0.5 },
  luk: { critChance: 0.5, dropRate: 1 },
};
