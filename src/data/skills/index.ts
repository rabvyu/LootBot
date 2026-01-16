// Skills - Index
export * from './types';
export * from './warriorSkills';
export * from './mageSkills';
export * from './archerSkills';
export * from './paladinSkills';

import { Skill, SkillTree } from './types';
import { warriorSkillTree, getAllWarriorSkills } from './warriorSkills';
import { mageSkillTree, getAllMageSkills } from './mageSkills';
import { archerSkillTree, getAllArcherSkills } from './archerSkills';
import { paladinSkillTree, getAllPaladinSkills } from './paladinSkills';

// Todas as skill trees
export const skillTrees: Record<string, SkillTree> = {
  warrior: warriorSkillTree,
  mage: mageSkillTree,
  archer: archerSkillTree,
  paladin: paladinSkillTree,
};

// Obter skill tree por classe
export const getSkillTreeByClass = (classId: string): SkillTree | undefined => {
  return skillTrees[classId];
};

// Obter todas as skills de uma classe
export const getAllSkillsByClass = (classId: string): Skill[] => {
  switch (classId) {
    case 'warrior': return getAllWarriorSkills();
    case 'mage': return getAllMageSkills();
    case 'archer': return getAllArcherSkills();
    case 'paladin': return getAllPaladinSkills();
    default: return [];
  }
};

// Obter skill por ID (de qualquer classe)
export const getSkillById = (skillId: string): Skill | undefined => {
  const allSkills = [
    ...getAllWarriorSkills(),
    ...getAllMageSkills(),
    ...getAllArcherSkills(),
    ...getAllPaladinSkills(),
  ];
  return allSkills.find(s => s.id === skillId);
};

// Obter skills por branch e classe
export const getSkillsByBranch = (classId: string, branch: string): Skill[] => {
  const tree = skillTrees[classId];
  if (!tree) return [];
  return tree.branches[branch as keyof typeof tree.branches] || [];
};

// Verificar se pode aprender uma skill
export const canLearnSkill = (
  skill: Skill,
  currentPoints: number,
  learnedSkills: string[],
  skillLevels: Record<string, number>
): { canLearn: boolean; reason?: string } => {
  // Verificar pontos totais na árvore
  let pointsInTree = 0;
  for (const skillId of learnedSkills) {
    const s = getSkillById(skillId);
    if (s && s.branch === skill.branch) {
      pointsInTree += (skillLevels[skillId] || 1) * s.pointsCost;
    }
  }

  if (pointsInTree < skill.requiredPoints) {
    return {
      canLearn: false,
      reason: `Precisa de ${skill.requiredPoints} pontos na árvore ${skill.branch} (tem ${pointsInTree})`,
    };
  }

  // Verificar skills pré-requisitas
  if (skill.requiredSkills) {
    for (const reqSkill of skill.requiredSkills) {
      if (!learnedSkills.includes(reqSkill)) {
        const req = getSkillById(reqSkill);
        return {
          canLearn: false,
          reason: `Precisa aprender ${req?.name || reqSkill} primeiro`,
        };
      }
    }
  }

  // Verificar se já tem nível máximo
  const currentLevel = skillLevels[skill.id] || 0;
  if (currentLevel >= skill.maxLevel) {
    return {
      canLearn: false,
      reason: `Skill já está no nível máximo (${skill.maxLevel})`,
    };
  }

  // Verificar se tem pontos suficientes
  if (currentPoints < skill.pointsCost) {
    return {
      canLearn: false,
      reason: `Precisa de ${skill.pointsCost} pontos de skill (tem ${currentPoints})`,
    };
  }

  return { canLearn: true };
};

// Contagem de skills
export const SKILL_COUNTS = {
  warrior: getAllWarriorSkills().length,
  mage: getAllMageSkills().length,
  archer: getAllArcherSkills().length,
  paladin: getAllPaladinSkills().length,
  get total() {
    return this.warrior + this.mage + this.archer + this.paladin;
  },
};
