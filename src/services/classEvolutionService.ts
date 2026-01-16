// Serviço de Evolução de Classes
import { Character, CharacterDocument, BaseCharacterClass, ClassTier } from '../database/models';
import {
  getBaseClass,
  getIntermediateClassesForBase,
  getAdvancedClassesForIntermediate,
  IntermediateClass,
  AdvancedClass,
  CLASS_EVOLUTION_LEVELS,
  getClassInfo,
  IntermediateClassName,
} from '../data/classes';
import {
  rollForWildcard,
  WildcardClass,
  getAllWildcardIntermediateClasses,
  getAllWildcardAdvancedClasses,
} from '../data/classes/wildcardClasses';
import { logger } from '../utils/logger';

export interface EvolutionOption {
  id: string;
  name: string;
  emoji: string;
  description: string;
  specialAbility?: string;
  isWildcard: boolean;
}

export interface EvolutionResult {
  success: boolean;
  message: string;
  newClass?: string;
  newClassName?: string;
  isWildcard?: boolean;
  statChanges?: {
    hp: number;
    attack: number;
    defense: number;
  };
}

export interface EvolutionStatus {
  canEvolve: boolean;
  reason?: string;
  currentClass: string;
  currentTier: ClassTier;
  requiredLevel: number;
  currentLevel: number;
  availableOptions: EvolutionOption[];
  wildcardChance: number;
}

class ClassEvolutionService {
  // Verificar se personagem pode evoluir
  async getEvolutionStatus(discordId: string): Promise<EvolutionStatus | null> {
    const character = await Character.findOne({ discordId });
    if (!character) return null;

    const currentTier = character.classTier || 'base';
    const currentLevel = character.level;
    const earlyEvolution = character.earlyEvolutionLevels || 0;
    const wildcardBonus = character.wildcardChanceBonus || 0;

    let requiredLevel: number;
    let availableOptions: EvolutionOption[] = [];
    let wildcardChance: number;

    if (currentTier === 'base') {
      requiredLevel = CLASS_EVOLUTION_LEVELS.INTERMEDIATE - earlyEvolution;
      wildcardChance = 5 + wildcardBonus;

      // Obter opções de classes intermediárias
      const baseClass = character.baseClass || character.class as BaseCharacterClass;
      const intermediateOptions = getIntermediateClassesForBase(baseClass);

      availableOptions = intermediateOptions.map(ic => ({
        id: ic.id,
        name: ic.name,
        emoji: ic.emoji,
        description: ic.description,
        specialAbility: ic.specialAbility,
        isWildcard: false,
      }));

      // Adicionar opção de wildcard
      availableOptions.push({
        id: 'wildcard_roll',
        name: 'Deixe a sorte rolar...',
        emoji: '🎲',
        description: `${wildcardChance}% de chance de conseguir uma classe Wildcard especial (+15% todos atributos)!`,
        isWildcard: true,
      });

    } else if (currentTier === 'intermediate') {
      requiredLevel = CLASS_EVOLUTION_LEVELS.ADVANCED - earlyEvolution;
      wildcardChance = 1 + (wildcardBonus / 5); // Wildcard avançado é mais difícil

      // Obter opções de classes avançadas
      const currentClass = character.class as IntermediateClassName;
      const advancedOptions = getAdvancedClassesForIntermediate(currentClass);

      availableOptions = advancedOptions.map(ac => ({
        id: ac.id,
        name: ac.name,
        emoji: ac.emoji,
        description: ac.description,
        specialAbility: ac.specialAbilities.join(', '),
        isWildcard: false,
      }));

      // Adicionar opção de wildcard
      availableOptions.push({
        id: 'wildcard_roll',
        name: 'Deixe a sorte rolar...',
        emoji: '🎲',
        description: `${wildcardChance.toFixed(1)}% de chance de conseguir uma classe Wildcard lendária (+20-25% atributos)!`,
        isWildcard: true,
      });

    } else {
      // Já está no nível máximo
      return {
        canEvolve: false,
        reason: 'Você já alcançou a evolução máxima!',
        currentClass: character.class,
        currentTier,
        requiredLevel: 0,
        currentLevel,
        availableOptions: [],
        wildcardChance: 0,
      };
    }

    const canEvolve = currentLevel >= requiredLevel;
    const reason = canEvolve ? undefined : `Precisa de nível ${requiredLevel} para evoluir (atual: ${currentLevel})`;

    return {
      canEvolve,
      reason,
      currentClass: character.class,
      currentTier,
      requiredLevel,
      currentLevel,
      availableOptions,
      wildcardChance,
    };
  }

  // Evoluir para uma classe específica
  async evolveToClass(discordId: string, targetClassId: string): Promise<EvolutionResult> {
    const character = await Character.findOne({ discordId });
    if (!character) {
      return { success: false, message: 'Personagem não encontrado.' };
    }

    const status = await this.getEvolutionStatus(discordId);
    if (!status) {
      return { success: false, message: 'Erro ao verificar status de evolução.' };
    }

    if (!status.canEvolve) {
      return { success: false, message: status.reason || 'Não pode evoluir ainda.' };
    }

    // Verificar se a opção é válida
    const selectedOption = status.availableOptions.find(o => o.id === targetClassId);
    if (!selectedOption) {
      return { success: false, message: 'Classe de evolução inválida.' };
    }

    // Se for wildcard roll
    if (targetClassId === 'wildcard_roll') {
      return this.rollWildcardEvolution(character, status);
    }

    // Evolução normal
    return this.performNormalEvolution(character, targetClassId, status.currentTier);
  }

  // Rolar para classe wildcard
  private async rollWildcardEvolution(
    character: CharacterDocument,
    status: EvolutionStatus
  ): Promise<EvolutionResult> {
    const currentTier = status.currentTier;
    const targetTier = currentTier === 'base' ? 'intermediate' : 'advanced';

    // Verificar se tem garantia de wildcard
    if (character.guaranteeWildcard) {
      const wildcardClass = this.getRandomWildcard(targetTier);
      if (wildcardClass) {
        return this.applyWildcardEvolution(character, wildcardClass, true);
      }
    }

    // Rolar normalmente
    const wildcardResult = rollForWildcard(targetTier);

    if (wildcardResult) {
      return this.applyWildcardEvolution(character, wildcardResult, false);
    }

    // Não conseguiu wildcard - dar uma classe aleatória normal
    const normalOptions = status.availableOptions.filter(o => !o.isWildcard);
    const randomOption = normalOptions[Math.floor(Math.random() * normalOptions.length)];

    if (!randomOption) {
      return { success: false, message: 'Erro ao selecionar classe.' };
    }

    const result = await this.performNormalEvolution(character, randomOption.id, currentTier);
    result.message = `🎲 A sorte não estava do seu lado...\n${result.message}`;
    return result;
  }

  // Obter uma classe wildcard aleatória
  private getRandomWildcard(tier: 'intermediate' | 'advanced'): WildcardClass | null {
    const wildcards = tier === 'intermediate'
      ? getAllWildcardIntermediateClasses()
      : getAllWildcardAdvancedClasses();

    if (wildcards.length === 0) return null;
    return wildcards[Math.floor(Math.random() * wildcards.length)];
  }

  // Aplicar evolução wildcard
  private async applyWildcardEvolution(
    character: CharacterDocument,
    wildcardClass: WildcardClass,
    usedGuarantee: boolean
  ): Promise<EvolutionResult> {
    const newTier: ClassTier = wildcardClass.tier === 'intermediate' ? 'intermediate' : 'advanced';

    // Calcular bônus de stats
    const statMultiplier = wildcardClass.statBonus;
    const hpBonus = Math.floor(character.stats.maxHp * (statMultiplier - 1)) + wildcardClass.bonusStats.hp;
    const attackBonus = Math.floor(character.stats.attack * (statMultiplier - 1)) + wildcardClass.bonusStats.attack;
    const defenseBonus = Math.floor(character.stats.defense * (statMultiplier - 1)) + wildcardClass.bonusStats.defense;

    // Atualizar personagem
    character.class = wildcardClass.id as any;
    character.classTier = newTier;
    character.stats.maxHp += hpBonus;
    character.stats.hp = character.stats.maxHp;
    character.stats.attack += attackBonus;
    character.stats.defense += defenseBonus;

    if (usedGuarantee) {
      character.guaranteeWildcard = false;
    }

    await character.save();

    logger.info(`User ${character.discordId} evolved to WILDCARD class ${wildcardClass.id}!`);

    return {
      success: true,
      message: `🌟 **CLASSE WILDCARD DESBLOQUEADA!** 🌟\n\n` +
        `${wildcardClass.emoji} Você se tornou um **${wildcardClass.name}**!\n\n` +
        `*${wildcardClass.description}*\n\n` +
        `**Bônus de Stats (+${Math.floor((statMultiplier - 1) * 100)}%):**\n` +
        `❤️ HP: +${hpBonus}\n` +
        `⚔️ ATK: +${attackBonus}\n` +
        `🛡️ DEF: +${defenseBonus}\n\n` +
        `**Habilidades Especiais:**\n${wildcardClass.specialAbilities.map(a => `• ${a}`).join('\n')}`,
      newClass: wildcardClass.id,
      newClassName: wildcardClass.name,
      isWildcard: true,
      statChanges: { hp: hpBonus, attack: attackBonus, defense: defenseBonus },
    };
  }

  // Realizar evolução normal
  private async performNormalEvolution(
    character: CharacterDocument,
    targetClassId: string,
    currentTier: ClassTier
  ): Promise<EvolutionResult> {
    let classData: IntermediateClass | AdvancedClass | null = null;
    let newTier: ClassTier;

    if (currentTier === 'base') {
      // Evoluindo para intermediária
      const intermediateClasses = getIntermediateClassesForBase(character.baseClass || character.class as BaseCharacterClass);
      classData = intermediateClasses.find(c => c.id === targetClassId) || null;
      newTier = 'intermediate';
    } else {
      // Evoluindo para avançada
      const advancedClasses = getAdvancedClassesForIntermediate(character.class as IntermediateClassName);
      classData = advancedClasses.find(c => c.id === targetClassId) || null;
      newTier = 'advanced';
    }

    if (!classData) {
      return { success: false, message: 'Classe de evolução não encontrada.' };
    }

    // Calcular novos stats
    const multipliers = classData.statMultipliers;
    const bonusStats = classData.bonusStats;

    const hpBonus = Math.floor(character.stats.maxHp * (multipliers.hp - 1)) + bonusStats.hp;
    const attackBonus = Math.floor(character.stats.attack * (multipliers.attack - 1)) + bonusStats.attack;
    const defenseBonus = Math.floor(character.stats.defense * (multipliers.defense - 1)) + bonusStats.defense;
    const critChanceBonus = Math.floor(character.stats.critChance * (multipliers.critChance - 1));
    const critDamageBonus = Math.floor(character.stats.critDamage * (multipliers.critDamage - 1));

    // Atualizar personagem
    character.class = targetClassId as any;
    character.classTier = newTier;
    character.stats.maxHp += hpBonus;
    character.stats.hp = character.stats.maxHp;
    character.stats.attack += attackBonus;
    character.stats.defense += defenseBonus;
    character.stats.critChance += critChanceBonus;
    character.stats.critDamage += critDamageBonus;

    await character.save();

    logger.info(`User ${character.discordId} evolved to class ${targetClassId}`);

    const specialAbility = 'specialAbility' in classData
      ? (classData as IntermediateClass).specialAbility
      : (classData as AdvancedClass).specialAbilities.join(', ');

    return {
      success: true,
      message: `🎉 **EVOLUÇÃO COMPLETA!** 🎉\n\n` +
        `${classData.emoji} Você se tornou um **${classData.name}**!\n\n` +
        `*${classData.description}*\n\n` +
        `**Mudanças de Stats:**\n` +
        `❤️ HP: +${hpBonus}\n` +
        `⚔️ ATK: +${attackBonus}\n` +
        `🛡️ DEF: +${defenseBonus}\n` +
        `🎯 Crítico: +${critChanceBonus}%\n` +
        `💥 Dano Crítico: +${critDamageBonus}%\n\n` +
        `**Habilidade Especial:** ${specialAbility}`,
      newClass: targetClassId,
      newClassName: classData.name,
      isWildcard: false,
      statChanges: { hp: hpBonus, attack: attackBonus, defense: defenseBonus },
    };
  }

  // Resetar classe (voltar para base)
  async resetClass(discordId: string, hasResetItem: boolean = false): Promise<EvolutionResult> {
    const character = await Character.findOne({ discordId });
    if (!character) {
      return { success: false, message: 'Personagem não encontrado.' };
    }

    if (!hasResetItem) {
      return { success: false, message: 'Você precisa de uma Poção de Mudança de Classe.' };
    }

    if (character.classTier === 'base') {
      return { success: false, message: 'Você já está na classe base.' };
    }

    const baseClass = character.baseClass || character.class as BaseCharacterClass;
    const baseClassData = getBaseClass(baseClass);

    if (!baseClassData) {
      return { success: false, message: 'Erro ao encontrar classe base.' };
    }

    // Resetar para stats base
    character.class = baseClass;
    character.classTier = 'base';
    character.stats = {
      hp: baseClassData.baseStats.hp,
      maxHp: baseClassData.baseStats.hp,
      attack: baseClassData.baseStats.attack,
      defense: baseClassData.baseStats.defense,
      critChance: baseClassData.baseStats.critChance,
      critDamage: baseClassData.baseStats.critDamage,
    };

    await character.save();

    logger.info(`User ${discordId} reset class to ${baseClass}`);

    return {
      success: true,
      message: `🔄 Classe resetada para **${baseClassData.name}** ${baseClassData.emoji}!\n\n` +
        `Seus stats voltaram ao nível base. Você pode escolher uma nova evolução ao atingir o nível necessário.`,
      newClass: baseClass,
      newClassName: baseClassData.name,
    };
  }
}

export const classEvolutionService = new ClassEvolutionService();
export default classEvolutionService;
