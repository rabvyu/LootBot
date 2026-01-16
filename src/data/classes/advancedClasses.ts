// Classes Avançadas - Nível 60
import { IntermediateClassName } from './intermediateClasses';

export type AdvancedClassName =
  // Berserker evolutions
  | 'warlord' | 'destroyer'
  // Knight evolutions
  | 'dark_paladin' | 'general'
  // Elementalist evolutions
  | 'archmage' | 'tempest'
  // Necromancer evolutions
  | 'lich' | 'soul_lord'
  // Sniper evolutions
  | 'assassin' | 'artillerist'
  // Hunter evolutions
  | 'beast_master' | 'ranger'
  // Crusader evolutions
  | 'inquisitor' | 'saint'
  // Guardian evolutions
  | 'titan' | 'divine_protector';

export interface AdvancedClass {
  id: AdvancedClassName;
  name: string;
  emoji: string;
  description: string;
  parentClass: IntermediateClassName;
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
  specialAbilities: string[];
  ultimateSkill: string;
}

export const advancedClasses: Record<AdvancedClassName, AdvancedClass> = {
  // === BERSERKER EVOLUTIONS ===
  warlord: {
    id: 'warlord',
    name: 'Senhor da Guerra',
    emoji: '⚔️🔥',
    description: 'Líder de batalha com dano AoE devastador e buffs de grupo.',
    parentClass: 'berserker',
    statMultipliers: { hp: 1.3, attack: 1.5, defense: 1.1, critChance: 1.3, critDamage: 1.4 },
    bonusStats: { hp: 100, attack: 25, defense: 10 },
    specialAbilities: ['Grito de Guerra: +20% dano grupo', 'Massacre: Ataque AoE'],
    ultimateSkill: 'Fúria do Senhor da Guerra: +150% dano por 5 turnos',
  },
  destroyer: {
    id: 'destroyer',
    name: 'Destruidor',
    emoji: '💥',
    description: 'Glass cannon com dano máximo, mas defesa reduzida.',
    parentClass: 'berserker',
    statMultipliers: { hp: 0.9, attack: 2.0, defense: 0.7, critChance: 1.5, critDamage: 1.8 },
    bonusStats: { hp: 0, attack: 40, defense: 0 },
    specialAbilities: ['Execução: +100% dano em <30% HP', 'Raiva: +2% dano por 1% HP perdido'],
    ultimateSkill: 'Aniquilação: 500% dano, perde 50% HP',
  },

  // === KNIGHT EVOLUTIONS ===
  dark_paladin: {
    id: 'dark_paladin',
    name: 'Paladino Negro',
    emoji: '🖤',
    description: 'Híbrido entre dano e defesa com habilidades sombrias.',
    parentClass: 'knight',
    statMultipliers: { hp: 1.2, attack: 1.3, defense: 1.3, critChance: 1.2, critDamage: 1.3 },
    bonusStats: { hp: 80, attack: 20, defense: 15 },
    specialAbilities: ['Golpe Sombrio: Dano + Lifesteal', 'Armadura das Trevas: +25% defesa'],
    ultimateSkill: 'Pacto Sombrio: +100% stats, -10% HP/turno',
  },
  general: {
    id: 'general',
    name: 'General',
    emoji: '👑',
    description: 'Comandante supremo com poderosos buffs de grupo.',
    parentClass: 'knight',
    statMultipliers: { hp: 1.4, attack: 1.1, defense: 1.4, critChance: 1.0, critDamage: 1.1 },
    bonusStats: { hp: 120, attack: 10, defense: 20 },
    specialAbilities: ['Comando: Aliados +15% stats', 'Formação: Grupo +30% defesa'],
    ultimateSkill: 'Exército Unido: Todos atacam juntos (200% dano total)',
  },

  // === ELEMENTALIST EVOLUTIONS ===
  archmage: {
    id: 'archmage',
    name: 'Arquimago',
    emoji: '🌟',
    description: 'Mestre absoluto de todos os elementos.',
    parentClass: 'elementalist',
    statMultipliers: { hp: 1.1, attack: 1.6, defense: 1.0, critChance: 1.4, critDamage: 1.5 },
    bonusStats: { hp: 50, attack: 30, defense: 5 },
    specialAbilities: ['Mestre dos Elementos: +40% dano elemental', 'Fusão: Combina 2 elementos'],
    ultimateSkill: 'Apocalipse Elemental: Dano de todos elementos (600%)',
  },
  tempest: {
    id: 'tempest',
    name: 'Tempestade',
    emoji: '⛈️',
    description: 'Controlador de tempestades com dano AoE devastador.',
    parentClass: 'elementalist',
    statMultipliers: { hp: 1.0, attack: 1.7, defense: 0.9, critChance: 1.5, critDamage: 1.4 },
    bonusStats: { hp: 30, attack: 35, defense: 0 },
    specialAbilities: ['Tempestade: AoE a cada turno', 'Raio em Cadeia: Atinge múltiplos alvos'],
    ultimateSkill: 'Fúria dos Céus: AoE 400% + paralisia',
  },

  // === NECROMANCER EVOLUTIONS ===
  lich: {
    id: 'lich',
    name: 'Lich',
    emoji: '👻',
    description: 'Morto-vivo poderoso com imortalidade temporária.',
    parentClass: 'necromancer',
    statMultipliers: { hp: 1.3, attack: 1.4, defense: 1.2, critChance: 1.2, critDamage: 1.3 },
    bonusStats: { hp: 100, attack: 25, defense: 10 },
    specialAbilities: ['Forma Etérea: Imune 1 turno', 'Toque da Morte: Dano + slow'],
    ultimateSkill: 'Imortalidade: Não pode morrer por 3 turnos',
  },
  soul_lord: {
    id: 'soul_lord',
    name: 'Senhor das Almas',
    emoji: '💫',
    description: 'Comandante de um exército de mortos-vivos.',
    parentClass: 'necromancer',
    statMultipliers: { hp: 1.2, attack: 1.3, defense: 1.1, critChance: 1.3, critDamage: 1.2 },
    bonusStats: { hp: 80, attack: 20, defense: 8 },
    specialAbilities: ['Invocar: Cria 3 esqueletos', 'Absorver Almas: Cura ao matar'],
    ultimateSkill: 'Exército dos Mortos: 10 invocações atacam (50% dano cada)',
  },

  // === SNIPER EVOLUTIONS ===
  assassin: {
    id: 'assassin',
    name: 'Sniper Assassino',
    emoji: '🔫',
    description: 'Mestre do one-shot com invisibilidade.',
    parentClass: 'sniper',
    statMultipliers: { hp: 0.8, attack: 1.8, defense: 0.7, critChance: 2.0, critDamage: 2.0 },
    bonusStats: { hp: 0, attack: 35, defense: 0 },
    specialAbilities: ['Invisibilidade: 2 turnos sem dano', 'Execução: +150% dano em <25% HP'],
    ultimateSkill: 'Tiro Fatal: 1000% dano, sempre crítico (CD: 5)',
  },
  artillerist: {
    id: 'artillerist',
    name: 'Artilheiro',
    emoji: '💣',
    description: 'Especialista em explosivos e dano em área.',
    parentClass: 'sniper',
    statMultipliers: { hp: 1.1, attack: 1.5, defense: 1.0, critChance: 1.3, critDamage: 1.4 },
    bonusStats: { hp: 50, attack: 25, defense: 5 },
    specialAbilities: ['Bomba: AoE 200% dano', 'Chuva de Mísseis: 5 ataques aleatórios'],
    ultimateSkill: 'Bombardeio Total: AoE 500% + queimadura',
  },

  // === HUNTER EVOLUTIONS ===
  beast_master: {
    id: 'beast_master',
    name: 'Mestre das Feras',
    emoji: '🦁',
    description: 'Comandante de criaturas com pets supremos.',
    parentClass: 'hunter',
    statMultipliers: { hp: 1.2, attack: 1.2, defense: 1.1, critChance: 1.3, critDamage: 1.2 },
    bonusStats: { hp: 60, attack: 15, defense: 8 },
    specialAbilities: ['Pets +50% stats', 'Pode ter 2 pets ativos', 'Pets revivem após batalha'],
    ultimateSkill: 'Investida das Feras: Todos os pets atacam (100% dano cada)',
  },
  ranger: {
    id: 'ranger',
    name: 'Ranger',
    emoji: '🌲',
    description: 'Guardião da natureza com venenos e cura natural.',
    parentClass: 'hunter',
    statMultipliers: { hp: 1.2, attack: 1.3, defense: 1.1, critChance: 1.4, critDamage: 1.3 },
    bonusStats: { hp: 70, attack: 18, defense: 10 },
    specialAbilities: ['Veneno Mortal: 8% HP/turno', 'Cura Natural: +5% HP/turno'],
    ultimateSkill: 'Fúria da Natureza: AoE 400% + veneno + slow',
  },

  // === CRUSADER EVOLUTIONS ===
  inquisitor: {
    id: 'inquisitor',
    name: 'Inquisidor',
    emoji: '⚖️',
    description: 'Juiz divino com dano sagrado máximo.',
    parentClass: 'crusader',
    statMultipliers: { hp: 1.2, attack: 1.5, defense: 1.2, critChance: 1.3, critDamage: 1.4 },
    bonusStats: { hp: 80, attack: 25, defense: 12 },
    specialAbilities: ['Julgamento: +100% dano vs evil', 'Purificação: Remove buffs inimigos'],
    ultimateSkill: 'Ira Divina: 600% dano sagrado + purifica aliados',
  },
  saint: {
    id: 'saint',
    name: 'Santo',
    emoji: '😇',
    description: 'Curandeiro supremo com ressurreição.',
    parentClass: 'crusader',
    statMultipliers: { hp: 1.3, attack: 1.1, defense: 1.3, critChance: 1.0, critDamage: 1.1 },
    bonusStats: { hp: 100, attack: 10, defense: 15 },
    specialAbilities: ['Cura Suprema: 60% HP', 'Ressurreição: Revive aliado com 50%'],
    ultimateSkill: 'Milagre: Cura total + revive todos + imunidade 2 turnos',
  },

  // === GUARDIAN EVOLUTIONS ===
  titan: {
    id: 'titan',
    name: 'Titã',
    emoji: '🗿',
    description: 'Colosso indestrutível com imortalidade temporária.',
    parentClass: 'guardian',
    statMultipliers: { hp: 1.6, attack: 0.9, defense: 1.8, critChance: 0.7, critDamage: 1.0 },
    bonusStats: { hp: 250, attack: 0, defense: 30 },
    specialAbilities: ['Fortaleza: -50% dano recebido', 'Regeneração: +8% HP/turno'],
    ultimateSkill: 'Forma de Titã: Imune a dano por 4 turnos',
  },
  divine_protector: {
    id: 'divine_protector',
    name: 'Protetor Divino',
    emoji: '✨',
    description: 'Defensor celestial que protege aliados.',
    parentClass: 'guardian',
    statMultipliers: { hp: 1.5, attack: 1.0, defense: 1.6, critChance: 0.9, critDamage: 1.0 },
    bonusStats: { hp: 180, attack: 5, defense: 25 },
    specialAbilities: ['Escudo de Luz: Absorve dano de aliados', 'Aura: Aliados +25% defesa'],
    ultimateSkill: 'Proteção Divina: Grupo imune a dano por 3 turnos',
  },
};

export const getAdvancedClass = (classId: AdvancedClassName): AdvancedClass | undefined => {
  return advancedClasses[classId];
};

export const getAdvancedClassesForIntermediate = (intermediateClass: IntermediateClassName): AdvancedClass[] => {
  return Object.values(advancedClasses).filter(c => c.parentClass === intermediateClass);
};

export const getAllAdvancedClasses = (): AdvancedClass[] => {
  return Object.values(advancedClasses);
};
