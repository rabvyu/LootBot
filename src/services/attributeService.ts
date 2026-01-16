// Serviço de Atributos
import { Character, CharacterDocument, CharacterAttributes } from '../database/models';
import { calculateAttributePoints, ATTRIBUTE_EFFECTS } from '../data/skills/types';
import { logger } from '../utils/logger';

export type AttributeName = 'str' | 'int' | 'vit' | 'agi' | 'luk';

export interface AttributeInfo {
  name: string;
  emoji: string;
  description: string;
  effects: string[];
}

export const ATTRIBUTE_INFO: Record<AttributeName, AttributeInfo> = {
  str: {
    name: 'Força',
    emoji: '💪',
    description: 'Poder físico bruto',
    effects: ['+2 ATK físico por ponto', '+0.5% dano crítico por ponto'],
  },
  int: {
    name: 'Inteligência',
    emoji: '🧠',
    description: 'Poder mágico e conhecimento',
    effects: ['+2 ATK mágico por ponto', '+0.3% chance crítico por ponto'],
  },
  vit: {
    name: 'Vitalidade',
    emoji: '❤️',
    description: 'Resistência e vida',
    effects: ['+10 HP por ponto', '+1 DEF por ponto'],
  },
  agi: {
    name: 'Agilidade',
    emoji: '⚡',
    description: 'Velocidade e reflexos',
    effects: ['+1% Evasão por ponto', '+0.5% Velocidade por ponto'],
  },
  luk: {
    name: 'Sorte',
    emoji: '🍀',
    description: 'Fortuna e destino',
    effects: ['+0.5% Chance crítico por ponto', '+1% Drop rate por ponto'],
  },
};

export interface AttributeDistributeResult {
  success: boolean;
  message: string;
  newValue?: number;
  pointsRemaining?: number;
  statChanges?: {
    hp?: number;
    attack?: number;
    defense?: number;
    critChance?: number;
    critDamage?: number;
    evasion?: number;
    dropRate?: number;
  };
}

export interface AttributeView {
  attributes: CharacterAttributes;
  totalPoints: number;
  pointsAvailable: number;
  pointsSpent: number;
  calculatedBonuses: {
    physicalAttack: number;
    magicAttack: number;
    hp: number;
    defense: number;
    evasion: number;
    critChance: number;
    critDamage: number;
    dropRate: number;
  };
}

class AttributeService {
  // Calcular total de pontos de atributo disponíveis
  calculateTotalAttributePoints(level: number, bonusPoints: number = 0): number {
    return calculateAttributePoints(level) + bonusPoints;
  }

  // Obter pontos disponíveis
  async getAvailableAttributePoints(discordId: string): Promise<number> {
    const character = await Character.findOne({ discordId });
    if (!character) return 0;

    const totalPoints = this.calculateTotalAttributePoints(
      character.level,
      character.bonusAttributePoints || 0
    );
    const spentPoints = character.attributePointsSpent || 0;
    return totalPoints - spentPoints;
  }

  // Distribuir pontos em um atributo
  async distributePoints(
    discordId: string,
    attribute: AttributeName,
    amount: number
  ): Promise<AttributeDistributeResult> {
    if (amount <= 0) {
      return { success: false, message: 'Quantidade inválida.' };
    }

    if (!ATTRIBUTE_INFO[attribute]) {
      return { success: false, message: 'Atributo inválido.' };
    }

    const character = await Character.findOne({ discordId });
    if (!character) {
      return { success: false, message: 'Personagem não encontrado.' };
    }

    const availablePoints = await this.getAvailableAttributePoints(discordId);
    if (amount > availablePoints) {
      return {
        success: false,
        message: `Pontos insuficientes. Disponível: ${availablePoints}`,
      };
    }

    // Inicializar atributos se necessário
    if (!character.attributes) {
      character.attributes = { str: 0, int: 0, vit: 0, agi: 0, luk: 0 };
    }

    // Calcular mudanças de stats
    const statChanges = this.calculateStatChanges(attribute, amount);

    // Aplicar atributos
    character.attributes[attribute] += amount;
    character.attributePointsSpent = (character.attributePointsSpent || 0) + amount;

    // Aplicar stats baseados no atributo
    if (statChanges.hp) {
      character.stats.maxHp += statChanges.hp;
      character.stats.hp += statChanges.hp;
    }
    if (statChanges.defense) {
      character.stats.defense += statChanges.defense;
    }
    if (statChanges.critChance) {
      character.stats.critChance += statChanges.critChance;
    }
    if (statChanges.critDamage) {
      character.stats.critDamage += statChanges.critDamage;
    }

    await character.save();

    const info = ATTRIBUTE_INFO[attribute];
    const pointsRemaining = availablePoints - amount;

    logger.info(`User ${discordId} distributed ${amount} points to ${attribute}`);

    return {
      success: true,
      message: `${info.emoji} **${info.name}** +${amount}!\n` +
        `Novo valor: ${character.attributes[attribute]}\n` +
        `Pontos restantes: ${pointsRemaining}`,
      newValue: character.attributes[attribute],
      pointsRemaining,
      statChanges,
    };
  }

  // Calcular mudanças de stats para um atributo
  private calculateStatChanges(
    attribute: AttributeName,
    amount: number
  ): NonNullable<AttributeDistributeResult['statChanges']> {
    const changes: NonNullable<AttributeDistributeResult['statChanges']> = {};

    switch (attribute) {
      case 'str':
        changes.attack = ATTRIBUTE_EFFECTS.str.physicalAttack * amount;
        changes.critDamage = ATTRIBUTE_EFFECTS.str.critDamage * amount;
        break;
      case 'int':
        changes.attack = ATTRIBUTE_EFFECTS.int.magicAttack * amount;
        changes.critChance = ATTRIBUTE_EFFECTS.int.critChance * amount;
        break;
      case 'vit':
        changes.hp = ATTRIBUTE_EFFECTS.vit.hp * amount;
        changes.defense = ATTRIBUTE_EFFECTS.vit.defense * amount;
        break;
      case 'agi':
        changes.evasion = ATTRIBUTE_EFFECTS.agi.evasion * amount;
        break;
      case 'luk':
        changes.critChance = ATTRIBUTE_EFFECTS.luk.critChance * amount;
        changes.dropRate = ATTRIBUTE_EFFECTS.luk.dropRate * amount;
        break;
    }

    return changes;
  }

  // Obter visão completa dos atributos
  async getAttributeView(discordId: string): Promise<AttributeView | null> {
    const character = await Character.findOne({ discordId });
    if (!character) return null;

    const attributes = character.attributes || { str: 0, int: 0, vit: 0, agi: 0, luk: 0 };
    const totalPoints = this.calculateTotalAttributePoints(
      character.level,
      character.bonusAttributePoints || 0
    );
    const pointsSpent = character.attributePointsSpent || 0;

    const calculatedBonuses = {
      physicalAttack: attributes.str * ATTRIBUTE_EFFECTS.str.physicalAttack,
      magicAttack: attributes.int * ATTRIBUTE_EFFECTS.int.magicAttack,
      hp: attributes.vit * ATTRIBUTE_EFFECTS.vit.hp,
      defense: attributes.vit * ATTRIBUTE_EFFECTS.vit.defense,
      evasion: attributes.agi * ATTRIBUTE_EFFECTS.agi.evasion,
      critChance:
        attributes.int * ATTRIBUTE_EFFECTS.int.critChance +
        attributes.luk * ATTRIBUTE_EFFECTS.luk.critChance,
      critDamage: attributes.str * ATTRIBUTE_EFFECTS.str.critDamage,
      dropRate: attributes.luk * ATTRIBUTE_EFFECTS.luk.dropRate,
    };

    return {
      attributes,
      totalPoints,
      pointsAvailable: totalPoints - pointsSpent,
      pointsSpent,
      calculatedBonuses,
    };
  }

  // Resetar atributos
  async resetAttributes(discordId: string, hasResetItem: boolean = false): Promise<{
    success: boolean;
    message: string;
    pointsRefunded?: number;
  }> {
    const character = await Character.findOne({ discordId });
    if (!character) {
      return { success: false, message: 'Personagem não encontrado.' };
    }

    if (!hasResetItem) {
      return { success: false, message: 'Você precisa de um Pergaminho de Reset de Atributos.' };
    }

    const pointsRefunded = character.attributePointsSpent || 0;

    // Remover bônus de stats dos atributos
    const attributes = character.attributes || { str: 0, int: 0, vit: 0, agi: 0, luk: 0 };

    // Remover HP de VIT
    character.stats.maxHp -= attributes.vit * ATTRIBUTE_EFFECTS.vit.hp;
    character.stats.hp = Math.min(character.stats.hp, character.stats.maxHp);

    // Remover DEF de VIT
    character.stats.defense -= attributes.vit * ATTRIBUTE_EFFECTS.vit.defense;

    // Remover crit chance de INT e LUK
    character.stats.critChance -=
      attributes.int * ATTRIBUTE_EFFECTS.int.critChance +
      attributes.luk * ATTRIBUTE_EFFECTS.luk.critChance;

    // Remover crit damage de STR
    character.stats.critDamage -= attributes.str * ATTRIBUTE_EFFECTS.str.critDamage;

    // Resetar atributos
    character.attributes = { str: 0, int: 0, vit: 0, agi: 0, luk: 0 };
    character.attributePointsSpent = 0;

    await character.save();

    logger.info(`User ${discordId} reset attributes, ${pointsRefunded} points refunded`);

    return {
      success: true,
      message: `Atributos resetados! ${pointsRefunded} pontos devolvidos.`,
      pointsRefunded,
    };
  }

  // Sugerir distribuição de atributos baseada na classe
  getSuggestedDistribution(baseClass: string): Record<AttributeName, number> {
    const suggestions: Record<string, Record<AttributeName, number>> = {
      warrior: { str: 40, int: 5, vit: 35, agi: 15, luk: 5 },
      mage: { str: 5, int: 50, vit: 20, agi: 10, luk: 15 },
      archer: { str: 15, int: 5, vit: 15, agi: 45, luk: 20 },
      paladin: { str: 20, int: 15, vit: 40, agi: 10, luk: 15 },
    };

    return suggestions[baseClass] || { str: 20, int: 20, vit: 20, agi: 20, luk: 20 };
  }
}

export const attributeService = new AttributeService();
export default attributeService;
