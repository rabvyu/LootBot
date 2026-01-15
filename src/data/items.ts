import { EquipmentSlot, EquipmentRarity, EquipmentStats } from '../database/models/Equipment';

// General consumable items
export interface GeneralItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  effect: { type: string; value: number };
  price: number;
}

export const GENERAL_ITEMS: GeneralItem[] = [
  { id: 'potion_hp_small', name: 'Pocao HP Pequena', emoji: '🧪', description: 'Restaura 50 HP', effect: { type: 'heal', value: 50 }, price: 50 },
  { id: 'potion_hp_medium', name: 'Pocao HP Media', emoji: '🧪', description: 'Restaura 150 HP', effect: { type: 'heal', value: 150 }, price: 150 },
  { id: 'potion_hp_large', name: 'Pocao HP Grande', emoji: '🧪', description: 'Restaura 300 HP', effect: { type: 'heal', value: 300 }, price: 350 },
  { id: 'elixir_atk', name: 'Elixir de Forca', emoji: '💪', description: '+10 ATK por 5 batalhas', effect: { type: 'buff_atk', value: 10 }, price: 200 },
  { id: 'elixir_def', name: 'Elixir de Protecao', emoji: '🛡️', description: '+10 DEF por 5 batalhas', effect: { type: 'buff_def', value: 10 }, price: 200 },
  { id: 'elixir_crit', name: 'Elixir de Precisao', emoji: '🎯', description: '+10% CRIT por 5 batalhas', effect: { type: 'buff_crit', value: 10 }, price: 250 },
  { id: 'scroll_teleport', name: 'Pergaminho de Teleporte', emoji: '📜', description: 'Escape instantaneo da batalha', effect: { type: 'escape', value: 100 }, price: 100 },
  { id: 'food_bread', name: 'Pao', emoji: '🍞', description: 'Restaura 20 HP', effect: { type: 'heal', value: 20 }, price: 15 },
  { id: 'food_meat', name: 'Carne Assada', emoji: '🍖', description: 'Restaura 80 HP', effect: { type: 'heal', value: 80 }, price: 80 },
  { id: 'food_fish', name: 'Peixe Grelhado', emoji: '🐟', description: 'Restaura 60 HP', effect: { type: 'heal', value: 60 }, price: 50 },
  { id: 'revive_feather', name: 'Pena de Fenix', emoji: '🪶', description: 'Revive com 50% HP', effect: { type: 'revive', value: 50 }, price: 500 },
  { id: 'xp_tome', name: 'Tomo de Sabedoria', emoji: '📖', description: '+100 XP instantaneo', effect: { type: 'xp', value: 100 }, price: 300 },
  { id: 'lucky_coin', name: 'Moeda da Sorte', emoji: '🪙', description: '+20% drop por 3 batalhas', effect: { type: 'buff_drop', value: 20 }, price: 400 },
  { id: 'capture_net', name: 'Rede de Captura', emoji: '🕸️', description: '+15% chance captura', effect: { type: 'capture_bonus', value: 15 }, price: 250 },
  { id: 'antidote', name: 'Antidoto', emoji: '💊', description: 'Remove debuffs', effect: { type: 'cleanse', value: 1 }, price: 75 },
];

// Equipment data structure
export interface EquipmentData {
  id: string;
  name: string;
  emoji: string;
  slot: EquipmentSlot;
  rarity: EquipmentRarity;
  tier: number;
  setName?: string;
  stats: EquipmentStats;
  dropChance: number;
}

// Set bonuses: 2 pieces = small bonus, 4 pieces = big bonus
export interface SetBonus {
  name: string;
  twoPiece: EquipmentStats;
  fourPiece: EquipmentStats;
}

export const SET_BONUSES: Record<string, SetBonus> = {
  'Iniciante': { name: 'Iniciante', twoPiece: { hp: 20 }, fourPiece: { attack: 5, defense: 5 } },
  'Ferrugem': { name: 'Ferrugem', twoPiece: { defense: 5 }, fourPiece: { hp: 50, defense: 10 } },
  'Cacador': { name: 'Cacador', twoPiece: { attack: 5 }, fourPiece: { critChance: 5, attack: 10 } },
  'Floresta': { name: 'Floresta', twoPiece: { hp: 30 }, fourPiece: { defense: 8, hp: 60 } },
  'Lobisomem': { name: 'Lobisomem', twoPiece: { attack: 8 }, fourPiece: { critDamage: 15, attack: 15 } },
  'Mineiro': { name: 'Mineiro', twoPiece: { defense: 10 }, fourPiece: { hp: 100, defense: 15 } },
  'Guardiao': { name: 'Guardiao', twoPiece: { defense: 15 }, fourPiece: { hp: 150, defense: 25 } },
  'Assassino': { name: 'Assassino', twoPiece: { critChance: 5 }, fourPiece: { critChance: 10, critDamage: 25 } },
  'Elemental': { name: 'Elemental', twoPiece: { attack: 12 }, fourPiece: { attack: 25, critDamage: 20 } },
  'Vampiro': { name: 'Vampiro', twoPiece: { hp: 50 }, fourPiece: { attack: 20, hp: 100 } },
  'Infernal': { name: 'Infernal', twoPiece: { attack: 20 }, fourPiece: { attack: 40, critChance: 8 } },
  'Abissal': { name: 'Abissal', twoPiece: { defense: 25 }, fourPiece: { hp: 200, defense: 40 } },
  'Celestial': { name: 'Celestial', twoPiece: { critDamage: 15 }, fourPiece: { attack: 35, critDamage: 30 } },
  'Draconico': { name: 'Draconico', twoPiece: { hp: 80, attack: 15 }, fourPiece: { attack: 50, hp: 150, critChance: 10 } },
  'Divino': { name: 'Divino', twoPiece: { attack: 25, defense: 20 }, fourPiece: { attack: 60, defense: 50, hp: 200 } },
  'Caos': { name: 'Caos', twoPiece: { critChance: 10, critDamage: 20 }, fourPiece: { attack: 70, critChance: 15, critDamage: 50 } },
};

// Rarity multipliers for stats
const RARITY_MULT: Record<EquipmentRarity, number> = {
  common: 1.0,
  uncommon: 1.2,
  rare: 1.5,
  epic: 1.8,
  legendary: 2.2,
};

// Drop chance by rarity
const RARITY_DROP: Record<EquipmentRarity, number> = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
};

export function getItemById(id: string): GeneralItem | undefined {
  return GENERAL_ITEMS.find(i => i.id === id);
}

export function getSetBonus(setName: string): SetBonus | undefined {
  return SET_BONUSES[setName];
}

export function calculateSetBonus(setName: string, pieceCount: number): EquipmentStats {
  const set = SET_BONUSES[setName];
  if (!set) return {};

  const bonus: EquipmentStats = {};
  if (pieceCount >= 2) {
    Object.entries(set.twoPiece).forEach(([key, value]) => {
      bonus[key as keyof EquipmentStats] = value;
    });
  }
  if (pieceCount >= 4) {
    Object.entries(set.fourPiece).forEach(([key, value]) => {
      bonus[key as keyof EquipmentStats] = (bonus[key as keyof EquipmentStats] || 0) + (value as number);
    });
  }
  return bonus;
}

export const GENERAL_ITEM_COUNT = GENERAL_ITEMS.length;
