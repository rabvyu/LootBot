import mongoose, { Schema, Document } from 'mongoose';

// Base classes
export type BaseCharacterClass = 'warrior' | 'mage' | 'archer' | 'paladin';

// Intermediate classes
export type IntermediateCharacterClass =
  | 'berserker' | 'knight'           // Warrior
  | 'elementalist' | 'necromancer'   // Mage
  | 'sniper' | 'hunter'              // Archer
  | 'crusader' | 'guardian';         // Paladin

// Wildcard intermediate classes
export type WildcardIntermediateClass = 'chaos_disciple' | 'light_avatar';

// Advanced classes
export type AdvancedCharacterClass =
  | 'warlord' | 'destroyer'          // Berserker
  | 'dark_paladin' | 'general'       // Knight
  | 'archmage' | 'tempest'           // Elementalist
  | 'lich' | 'soul_lord'             // Necromancer
  | 'assassin' | 'artillerist'       // Sniper
  | 'beast_master' | 'ranger'        // Hunter
  | 'inquisitor' | 'saint'           // Crusader
  | 'titan' | 'divine_protector';    // Guardian

// Wildcard advanced classes
export type WildcardAdvancedClass = 'transcendent' | 'void_walker' | 'inner_demon' | 'legendary_hero';

// All character classes
export type CharacterClass =
  | BaseCharacterClass
  | IntermediateCharacterClass
  | WildcardIntermediateClass
  | AdvancedCharacterClass
  | WildcardAdvancedClass;

// Class tier
export type ClassTier = 'base' | 'intermediate' | 'advanced';

export interface CharacterStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  critChance: number;
  critDamage: number;
}

// Atributos do personagem
export interface CharacterAttributes {
  str: number;  // Força - +2 ATK físico, +0.5% dano crítico
  int: number;  // Inteligência - +2 ATK mágico, +0.3% chance crítico
  vit: number;  // Vitalidade - +10 HP, +1 DEF
  agi: number;  // Agilidade - +1% Evasão, +0.5% Velocidade
  luk: number;  // Sorte - +0.5% Chance crítico, +1% Drop rate
}

// Skill aprendida
export interface LearnedSkill {
  skillId: string;
  level: number;
}

// Buff temporário
export interface ActiveBuff {
  type: string;
  value: number;
  expiresAt: Date;
}

// Compras na loja
export interface ShopPurchase {
  itemId: string;
  count: number;
  lastPurchased: Date;
}

export interface ICharacter {
  discordId: string;
  name: string;
  class: CharacterClass;
  baseClass: BaseCharacterClass;
  classTier: ClassTier;
  level: number;
  experience: number;
  stats: CharacterStats;
  attributes: CharacterAttributes;
  attributePointsAvailable: number;
  attributePointsSpent: number;
  skillPoints: number;
  skillPointsSpent: number;
  bonusSkillPoints: number;
  bonusAttributePoints: number;
  learnedSkills: LearnedSkill[];
  equipment: {
    weapon?: string;
    armor?: string;
    accessory?: string;
  };
  skills: string[];
  activePet?: string;
  activeBuffs: ActiveBuff[];
  shopPurchases: ShopPurchase[];
  permanentBonuses: {
    maxHp: number;
    attack: number;
    defense: number;
  };
  wildcardChanceBonus: number;
  earlyEvolutionLevels: number;
  guaranteeWildcard: boolean;
  battlesWon: number;
  battlesLost: number;
  dungeonClears: number;
  bossKills: number;
  totalDamageDealt: number;
  createdAt: Date;
}

export interface CharacterDocument extends Document {
  discordId: string;
  name: string;
  class: CharacterClass;
  baseClass: BaseCharacterClass;
  classTier: ClassTier;
  level: number;
  experience: number;
  stats: CharacterStats;
  attributes: CharacterAttributes;
  attributePointsAvailable: number;
  attributePointsSpent: number;
  skillPoints: number;
  skillPointsSpent: number;
  bonusSkillPoints: number;
  bonusAttributePoints: number;
  learnedSkills: LearnedSkill[];
  equipment: {
    weapon?: string;
    armor?: string;
    accessory?: string;
  };
  skills: string[];
  activePet?: string;
  activeBuffs: ActiveBuff[];
  shopPurchases: ShopPurchase[];
  permanentBonuses: {
    maxHp: number;
    attack: number;
    defense: number;
  };
  wildcardChanceBonus: number;
  earlyEvolutionLevels: number;
  guaranteeWildcard: boolean;
  battlesWon: number;
  battlesLost: number;
  dungeonClears: number;
  bossKills: number;
  totalDamageDealt: number;
  createdAt: Date;
}

const CharacterStatsSchema = new Schema({
  hp: { type: Number, required: true },
  maxHp: { type: Number, required: true },
  attack: { type: Number, required: true },
  defense: { type: Number, required: true },
  critChance: { type: Number, default: 5 },
  critDamage: { type: Number, default: 150 },
}, { _id: false });

const CharacterAttributesSchema = new Schema({
  str: { type: Number, default: 0 },
  int: { type: Number, default: 0 },
  vit: { type: Number, default: 0 },
  agi: { type: Number, default: 0 },
  luk: { type: Number, default: 0 },
}, { _id: false });

const LearnedSkillSchema = new Schema({
  skillId: { type: String, required: true },
  level: { type: Number, default: 1 },
}, { _id: false });

const ActiveBuffSchema = new Schema({
  type: { type: String, required: true },
  value: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
}, { _id: false });

const ShopPurchaseSchema = new Schema({
  itemId: { type: String, required: true },
  count: { type: Number, default: 1 },
  lastPurchased: { type: Date, default: Date.now },
}, { _id: false });

const PermanentBonusesSchema = new Schema({
  maxHp: { type: Number, default: 0 },
  attack: { type: Number, default: 0 },
  defense: { type: Number, default: 0 },
}, { _id: false });

// All valid class names
const allClassNames = [
  // Base
  'warrior', 'mage', 'archer', 'paladin',
  // Intermediate
  'berserker', 'knight', 'elementalist', 'necromancer', 'sniper', 'hunter', 'crusader', 'guardian',
  // Wildcard Intermediate
  'chaos_disciple', 'light_avatar',
  // Advanced
  'warlord', 'destroyer', 'dark_paladin', 'general', 'archmage', 'tempest',
  'lich', 'soul_lord', 'assassin', 'artillerist', 'beast_master', 'ranger',
  'inquisitor', 'saint', 'titan', 'divine_protector',
  // Wildcard Advanced
  'transcendent', 'void_walker', 'inner_demon', 'legendary_hero',
];

const CharacterSchema = new Schema<CharacterDocument>({
  discordId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  class: {
    type: String,
    required: true,
    enum: allClassNames,
  },
  baseClass: {
    type: String,
    required: true,
    enum: ['warrior', 'mage', 'archer', 'paladin'],
  },
  classTier: {
    type: String,
    default: 'base',
    enum: ['base', 'intermediate', 'advanced'],
  },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  stats: { type: CharacterStatsSchema, required: true },
  attributes: { type: CharacterAttributesSchema, default: () => ({}) },
  attributePointsAvailable: { type: Number, default: 0 },
  attributePointsSpent: { type: Number, default: 0 },
  skillPoints: { type: Number, default: 0 },
  skillPointsSpent: { type: Number, default: 0 },
  bonusSkillPoints: { type: Number, default: 0 },
  bonusAttributePoints: { type: Number, default: 0 },
  learnedSkills: [LearnedSkillSchema],
  equipment: {
    weapon: { type: String, default: null },
    armor: { type: String, default: null },
    accessory: { type: String, default: null },
  },
  skills: [{ type: String }],
  activePet: { type: String, default: null },
  activeBuffs: [ActiveBuffSchema],
  shopPurchases: [ShopPurchaseSchema],
  permanentBonuses: { type: PermanentBonusesSchema, default: () => ({}) },
  wildcardChanceBonus: { type: Number, default: 0 },
  earlyEvolutionLevels: { type: Number, default: 0 },
  guaranteeWildcard: { type: Boolean, default: false },
  battlesWon: { type: Number, default: 0 },
  battlesLost: { type: Number, default: 0 },
  dungeonClears: { type: Number, default: 0 },
  bossKills: { type: Number, default: 0 },
  totalDamageDealt: { type: Number, default: 0 },
}, { timestamps: true });

export const Character = mongoose.model<CharacterDocument>('Character', CharacterSchema);
export default Character;
