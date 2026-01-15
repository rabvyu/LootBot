import mongoose, { Schema, Document } from 'mongoose';

export type CharacterClass = 'warrior' | 'mage' | 'archer' | 'paladin';

export interface CharacterStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  critChance: number;
  critDamage: number;
}

export interface ICharacter {
  discordId: string;
  name: string;
  class: CharacterClass;
  level: number;
  experience: number;
  stats: CharacterStats;
  equipment: {
    weapon?: string;
    armor?: string;
    accessory?: string;
  };
  skills: string[];
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
  level: number;
  experience: number;
  stats: CharacterStats;
  equipment: {
    weapon?: string;
    armor?: string;
    accessory?: string;
  };
  skills: string[];
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

const CharacterSchema = new Schema<CharacterDocument>({
  discordId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  class: {
    type: String,
    required: true,
    enum: ['warrior', 'mage', 'archer', 'paladin'],
  },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  stats: { type: CharacterStatsSchema, required: true },
  equipment: {
    weapon: { type: String, default: null },
    armor: { type: String, default: null },
    accessory: { type: String, default: null },
  },
  skills: [{ type: String }],
  battlesWon: { type: Number, default: 0 },
  battlesLost: { type: Number, default: 0 },
  dungeonClears: { type: Number, default: 0 },
  bossKills: { type: Number, default: 0 },
  totalDamageDealt: { type: Number, default: 0 },
}, { timestamps: true });

export const Character = mongoose.model<CharacterDocument>('Character', CharacterSchema);
export default Character;
