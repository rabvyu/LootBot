// Serviço de Skill Tree
import { Character, CharacterDocument, LearnedSkill } from '../database/models';
import {
  Skill,
  SkillTree,
  getSkillById,
  getSkillTreeByClass,
  getAllSkillsByClass,
  canLearnSkill,
  calculateSkillPoints,
  ATTRIBUTE_EFFECTS,
} from '../data/skills';
import { getClassTier, getClassInfo } from '../data/classes';
import { logger } from '../utils/logger';

export interface SkillLearnResult {
  success: boolean;
  message: string;
  skill?: Skill;
  newLevel?: number;
  pointsRemaining?: number;
}

export interface SkillResetResult {
  success: boolean;
  message: string;
  pointsRefunded?: number;
}

export interface SkillTreeView {
  classId: string;
  className: string;
  totalPoints: number;
  pointsAvailable: number;
  pointsSpent: number;
  branches: {
    [key: string]: {
      name: string;
      pointsSpent: number;
      skills: Array<{
        skill: Skill;
        learned: boolean;
        level: number;
        canLearn: boolean;
        reason?: string;
      }>;
    };
  };
}

class SkillTreeService {
  // Calcular total de pontos de skill disponíveis para um nível
  calculateTotalSkillPoints(level: number, bonusPoints: number = 0): number {
    return calculateSkillPoints(level) + bonusPoints;
  }

  // Obter pontos de skill disponíveis de um personagem
  async getAvailableSkillPoints(discordId: string): Promise<number> {
    const character = await Character.findOne({ discordId });
    if (!character) return 0;

    const totalPoints = this.calculateTotalSkillPoints(character.level, character.bonusSkillPoints || 0);
    const spentPoints = character.skillPointsSpent || 0;
    return totalPoints - spentPoints;
  }

  // Aprender ou melhorar uma skill
  async learnSkill(discordId: string, skillId: string): Promise<SkillLearnResult> {
    const character = await Character.findOne({ discordId });
    if (!character) {
      return { success: false, message: 'Personagem não encontrado.' };
    }

    // Encontrar a skill
    const skill = getSkillById(skillId);
    if (!skill) {
      return { success: false, message: 'Skill não encontrada.' };
    }

    // Verificar se a skill é da classe correta
    const characterBaseClass = character.baseClass || character.class;
    const skillTree = getSkillTreeByClass(characterBaseClass);
    if (!skillTree) {
      return { success: false, message: 'Skill tree não encontrada para sua classe.' };
    }

    const classSkills = getAllSkillsByClass(characterBaseClass);
    if (!classSkills.find(s => s.id === skillId)) {
      return { success: false, message: 'Esta skill não pertence à sua classe.' };
    }

    // Calcular pontos disponíveis
    const totalPoints = this.calculateTotalSkillPoints(character.level, character.bonusSkillPoints || 0);
    const spentPoints = character.skillPointsSpent || 0;
    const availablePoints = totalPoints - spentPoints;

    // Verificar skills aprendidas
    const learnedSkills = character.learnedSkills || [];
    const learnedSkillIds = learnedSkills.map(s => s.skillId);
    const skillLevels: Record<string, number> = {};
    learnedSkills.forEach(s => {
      skillLevels[s.skillId] = s.level;
    });

    // Verificar se pode aprender
    const canLearn = canLearnSkill(skill, availablePoints, learnedSkillIds, skillLevels);
    if (!canLearn.canLearn) {
      return { success: false, message: canLearn.reason || 'Não pode aprender esta skill.' };
    }

    // Aprender/melhorar a skill
    const existingSkill = learnedSkills.find(s => s.skillId === skillId);
    let newLevel = 1;

    if (existingSkill) {
      // Melhorar skill existente
      existingSkill.level += 1;
      newLevel = existingSkill.level;
    } else {
      // Aprender nova skill
      learnedSkills.push({ skillId, level: 1 });
    }

    // Atualizar personagem
    character.learnedSkills = learnedSkills;
    character.skillPointsSpent = spentPoints + skill.pointsCost;
    await character.save();

    const pointsRemaining = availablePoints - skill.pointsCost;

    logger.info(`User ${discordId} learned skill ${skillId} (level ${newLevel}), ${pointsRemaining} points remaining`);

    return {
      success: true,
      message: `${skill.emoji} **${skill.name}** aprendida! (Nível ${newLevel})`,
      skill,
      newLevel,
      pointsRemaining,
    };
  }

  // Resetar todas as skills
  async resetSkills(discordId: string, hasResetItem: boolean = false): Promise<SkillResetResult> {
    const character = await Character.findOne({ discordId });
    if (!character) {
      return { success: false, message: 'Personagem não encontrado.' };
    }

    if (!hasResetItem) {
      return { success: false, message: 'Você precisa de um Pergaminho de Reset de Skills.' };
    }

    const pointsRefunded = character.skillPointsSpent || 0;

    character.learnedSkills = [];
    character.skillPointsSpent = 0;
    await character.save();

    logger.info(`User ${discordId} reset skills, ${pointsRefunded} points refunded`);

    return {
      success: true,
      message: `Skills resetadas! ${pointsRefunded} pontos devolvidos.`,
      pointsRefunded,
    };
  }

  // Obter visão completa da skill tree
  async getSkillTreeView(discordId: string): Promise<SkillTreeView | null> {
    const character = await Character.findOne({ discordId });
    if (!character) return null;

    const characterBaseClass = character.baseClass || character.class;
    const skillTree = getSkillTreeByClass(characterBaseClass);
    if (!skillTree) return null;

    const classInfo = getClassInfo(characterBaseClass);
    const totalPoints = this.calculateTotalSkillPoints(character.level, character.bonusSkillPoints || 0);
    const spentPoints = character.skillPointsSpent || 0;
    const availablePoints = totalPoints - spentPoints;

    const learnedSkills = character.learnedSkills || [];
    const learnedSkillIds = learnedSkills.map(s => s.skillId);
    const skillLevels: Record<string, number> = {};
    learnedSkills.forEach(s => {
      skillLevels[s.skillId] = s.level;
    });

    // Calcular pontos gastos por branch
    const branchNames: Record<string, string> = {
      offensive: 'Ofensiva',
      defensive: 'Defensiva',
      utility: 'Utilidade',
      ultimate: 'Ultimate',
    };

    const branches: SkillTreeView['branches'] = {};

    for (const [branchKey, branchSkills] of Object.entries(skillTree.branches)) {
      let branchPointsSpent = 0;
      const skills = branchSkills.map(skill => {
        const learned = learnedSkillIds.includes(skill.id);
        const level = skillLevels[skill.id] || 0;

        if (learned) {
          branchPointsSpent += level * skill.pointsCost;
        }

        const canLearnResult = canLearnSkill(skill, availablePoints, learnedSkillIds, skillLevels);

        return {
          skill,
          learned,
          level,
          canLearn: canLearnResult.canLearn,
          reason: canLearnResult.reason,
        };
      });

      branches[branchKey] = {
        name: branchNames[branchKey] || branchKey,
        pointsSpent: branchPointsSpent,
        skills,
      };
    }

    return {
      classId: characterBaseClass,
      className: classInfo?.name || characterBaseClass,
      totalPoints,
      pointsAvailable: availablePoints,
      pointsSpent: spentPoints,
      branches,
    };
  }

  // Obter todas as skills aprendidas de um personagem
  async getLearnedSkills(discordId: string): Promise<Array<{ skill: Skill; level: number }>> {
    const character = await Character.findOne({ discordId });
    if (!character) return [];

    const learnedSkills = character.learnedSkills || [];
    const result: Array<{ skill: Skill; level: number }> = [];

    for (const ls of learnedSkills) {
      const skill = getSkillById(ls.skillId);
      if (skill) {
        result.push({ skill, level: ls.level });
      }
    }

    return result;
  }

  // Calcular bônus de atributos
  calculateAttributeBonuses(character: CharacterDocument): {
    physicalAttack: number;
    magicAttack: number;
    hp: number;
    defense: number;
    evasion: number;
    critChance: number;
    critDamage: number;
    dropRate: number;
  } {
    const attributes = character.attributes || { str: 0, int: 0, vit: 0, agi: 0, luk: 0 };

    return {
      physicalAttack: attributes.str * ATTRIBUTE_EFFECTS.str.physicalAttack,
      magicAttack: attributes.int * ATTRIBUTE_EFFECTS.int.magicAttack,
      hp: attributes.vit * ATTRIBUTE_EFFECTS.vit.hp,
      defense: attributes.vit * ATTRIBUTE_EFFECTS.vit.defense,
      evasion: attributes.agi * ATTRIBUTE_EFFECTS.agi.evasion,
      critChance: (attributes.int * ATTRIBUTE_EFFECTS.int.critChance) + (attributes.luk * ATTRIBUTE_EFFECTS.luk.critChance),
      critDamage: attributes.str * ATTRIBUTE_EFFECTS.str.critDamage,
      dropRate: attributes.luk * ATTRIBUTE_EFFECTS.luk.dropRate,
    };
  }

  // Calcular bônus passivos das skills
  async calculateSkillBonuses(discordId: string): Promise<{
    damageBonus: number;
    defenseBonus: number;
    hpBonus: number;
    critBonus: number;
    critDamageBonus: number;
    lifesteal: number;
    evasion: number;
    xpBonus: number;
    dropBonus: number;
  }> {
    const learnedSkills = await this.getLearnedSkills(discordId);

    let damageBonus = 0;
    let defenseBonus = 0;
    let hpBonus = 0;
    let critBonus = 0;
    let critDamageBonus = 0;
    let lifesteal = 0;
    let evasion = 0;
    let xpBonus = 0;
    let dropBonus = 0;

    for (const { skill, level } of learnedSkills) {
      if (!skill.isPassive) continue;

      for (const effect of skill.effects) {
        const value = effect.value * level;

        switch (effect.type) {
          case 'damage_bonus':
            damageBonus += value;
            break;
          case 'defense_bonus':
            defenseBonus += value;
            break;
          case 'hp_bonus':
            hpBonus += value;
            break;
          case 'crit_bonus':
            critBonus += value;
            break;
          case 'crit_damage_bonus':
            critDamageBonus += value;
            break;
          case 'lifesteal':
            lifesteal += value;
            break;
          case 'evasion':
            evasion += value;
            break;
          case 'xp_bonus':
            xpBonus += value;
            break;
          case 'drop_bonus':
            dropBonus += value;
            break;
        }
      }
    }

    return {
      damageBonus,
      defenseBonus,
      hpBonus,
      critBonus,
      critDamageBonus,
      lifesteal,
      evasion,
      xpBonus,
      dropBonus,
    };
  }
}

export const skillTreeService = new SkillTreeService();
export default skillTreeService;
