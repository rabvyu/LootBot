// Model de Favoritos e Builds
import mongoose, { Schema, Document } from 'mongoose';

// Tipos de favoritos
export type FavoriteType =
  | 'item'
  | 'quest'
  | 'dungeon'
  | 'raid'
  | 'recipe'
  | 'location'
  | 'npc'
  | 'skill'
  | 'build';

// Interface de item favorito
export interface IFavoriteItem {
  favoriteId: string;
  type: FavoriteType;
  targetId: string;
  targetName: string;
  note?: string;
  tags?: string[];
  addedAt: Date;
}

// Interface de lista de favoritos
export interface IFavoriteList extends Document {
  odiscordId: string;
  favorites: IFavoriteItem[];
  maxFavorites: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface de build/loadout
export interface IBuild extends Document {
  buildId: string;
  odiscordId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isFavorite: boolean;

  // Equipamentos
  equipment: {
    weapon?: { itemId: string; itemName: string };
    offhand?: { itemId: string; itemName: string };
    helmet?: { itemId: string; itemName: string };
    chest?: { itemId: string; itemName: string };
    gloves?: { itemId: string; itemName: string };
    legs?: { itemId: string; itemName: string };
    boots?: { itemId: string; itemName: string };
    ring1?: { itemId: string; itemName: string };
    ring2?: { itemId: string; itemName: string };
    amulet?: { itemId: string; itemName: string };
    cape?: { itemId: string; itemName: string };
  };

  // Skills/Habilidades
  skills: Array<{
    slotNumber: number;
    skillId: string;
    skillName: string;
  }>;

  // Consumíveis configurados
  consumables: Array<{
    slotNumber: number;
    itemId: string;
    itemName: string;
  }>;

  // Atributos distribuídos
  attributeDistribution?: {
    strength?: number;
    dexterity?: number;
    intelligence?: number;
    vitality?: number;
    luck?: number;
  };

  // Talentos selecionados
  talents?: string[];

  // Stats calculadas (cache)
  calculatedStats?: {
    hp: number;
    mp: number;
    attack: number;
    defense: number;
    speed: number;
    critChance: number;
    critDamage: number;
  };

  // Metadados
  class?: string;
  level?: number;
  tags?: string[];
  likes: number;
  views: number;
  uses: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

// Interface de template de build (pré-definidos)
export interface IBuildTemplate extends Document {
  templateId: string;
  name: string;
  description: string;
  class: string;
  role: 'tank' | 'dps' | 'healer' | 'support' | 'hybrid';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  minLevel: number;
  maxLevel?: number;
  equipment: IBuild['equipment'];
  skills: IBuild['skills'];
  attributeDistribution: IBuild['attributeDistribution'];
  talents?: string[];
  tips?: string[];
  isActive: boolean;
  createdAt: Date;
}

// Interface de build compartilhada
export interface ISharedBuild extends Document {
  shareCode: string;
  buildId: string;
  odiscordId: string;
  username: string;
  buildSnapshot: Partial<IBuild>;
  expiresAt?: Date;
  views: number;
  imports: number;
  createdAt: Date;
}

// Schema de favoritos
const FavoriteListSchema = new Schema<IFavoriteList>({
  odiscordId: { type: String, required: true, unique: true, index: true },
  favorites: [{
    favoriteId: { type: String, required: true },
    type: { type: String, required: true },
    targetId: { type: String, required: true },
    targetName: { type: String, required: true },
    note: { type: String },
    tags: { type: [String], default: [] },
    addedAt: { type: Date, default: Date.now },
  }],
  maxFavorites: { type: Number, default: 50 },
}, { timestamps: true });

// Schema de build
const BuildSchema = new Schema<IBuild>({
  buildId: { type: String, required: true, unique: true, index: true },
  odiscordId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  isPublic: { type: Boolean, default: false, index: true },
  isFavorite: { type: Boolean, default: false },
  equipment: {
    weapon: { itemId: String, itemName: String },
    offhand: { itemId: String, itemName: String },
    helmet: { itemId: String, itemName: String },
    chest: { itemId: String, itemName: String },
    gloves: { itemId: String, itemName: String },
    legs: { itemId: String, itemName: String },
    boots: { itemId: String, itemName: String },
    ring1: { itemId: String, itemName: String },
    ring2: { itemId: String, itemName: String },
    amulet: { itemId: String, itemName: String },
    cape: { itemId: String, itemName: String },
  },
  skills: [{
    slotNumber: { type: Number },
    skillId: { type: String },
    skillName: { type: String },
  }],
  consumables: [{
    slotNumber: { type: Number },
    itemId: { type: String },
    itemName: { type: String },
  }],
  attributeDistribution: {
    strength: { type: Number },
    dexterity: { type: Number },
    intelligence: { type: Number },
    vitality: { type: Number },
    luck: { type: Number },
  },
  talents: { type: [String], default: [] },
  calculatedStats: {
    hp: { type: Number },
    mp: { type: Number },
    attack: { type: Number },
    defense: { type: Number },
    speed: { type: Number },
    critChance: { type: Number },
    critDamage: { type: Number },
  },
  class: { type: String, index: true },
  level: { type: Number },
  tags: { type: [String], default: [], index: true },
  likes: { type: Number, default: 0, index: true },
  views: { type: Number, default: 0 },
  uses: { type: Number, default: 0 },
  lastUsedAt: { type: Date },
}, { timestamps: true });

// Schema de template
const BuildTemplateSchema = new Schema<IBuildTemplate>({
  templateId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  class: { type: String, required: true, index: true },
  role: { type: String, enum: ['tank', 'dps', 'healer', 'support', 'hybrid'], required: true, index: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  minLevel: { type: Number, required: true },
  maxLevel: { type: Number },
  equipment: { type: Schema.Types.Mixed },
  skills: [{
    slotNumber: { type: Number },
    skillId: { type: String },
    skillName: { type: String },
  }],
  attributeDistribution: { type: Schema.Types.Mixed },
  talents: { type: [String] },
  tips: { type: [String] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Schema de build compartilhada
const SharedBuildSchema = new Schema<ISharedBuild>({
  shareCode: { type: String, required: true, unique: true, index: true },
  buildId: { type: String, required: true },
  odiscordId: { type: String, required: true },
  username: { type: String, required: true },
  buildSnapshot: { type: Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, index: true },
  views: { type: Number, default: 0 },
  imports: { type: Number, default: 0 },
}, { timestamps: true });

// Índices compostos
BuildSchema.index({ odiscordId: 1, name: 1 });
BuildSchema.index({ isPublic: 1, likes: -1 });
BuildSchema.index({ class: 1, isPublic: 1 });

export const FavoriteList = mongoose.model<IFavoriteList>('FavoriteList', FavoriteListSchema);
export const Build = mongoose.model<IBuild>('Build', BuildSchema);
export const BuildTemplate = mongoose.model<IBuildTemplate>('BuildTemplate', BuildTemplateSchema);
export const SharedBuild = mongoose.model<ISharedBuild>('SharedBuild', SharedBuildSchema);

export type FavoriteListDocument = IFavoriteList;
export type BuildDocument = IBuild;
export type BuildTemplateDocument = IBuildTemplate;
export type SharedBuildDocument = ISharedBuild;
