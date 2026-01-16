import mongoose, { Document, Schema } from 'mongoose';

// Interface para Season de Arena
export interface IArenaSeason extends Document {
  seasonId: string;
  seasonNumber: number;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  rewards: {
    rank: string;
    minRating: number;
    coins: number;
    materials: Array<{ materialId: string; quantity: number }>;
    title?: string;
  }[];
  topPlayers: Array<{
    discordId: string;
    username: string;
    finalRating: number;
    rank: string;
    position: number;
  }>;
}

// Interface para Ranking de Jogador na Arena
export interface IArenaPlayer extends Document {
  discordId: string;
  seasonId: string;
  rating: number;
  rank: string;
  wins: number;
  losses: number;
  winStreak: number;
  bestWinStreak: number;
  matchesPlayed: number;
  lastMatchAt: Date;
  peakRating: number;
  rewardsClaimable: boolean;
  rewardsClaimed: boolean;
}

// Interface para Match de Arena
export interface IArenaMatch extends Document {
  matchId: string;
  seasonId: string;
  player1: {
    discordId: string;
    username: string;
    ratingBefore: number;
    ratingAfter: number;
    character: {
      class: string;
      level: number;
      totalStats: {
        attack: number;
        defense: number;
        hp: number;
        critChance: number;
        critDamage: number;
        evasion: number;
        lifesteal: number;
      };
    };
  };
  player2: {
    discordId: string;
    username: string;
    ratingBefore: number;
    ratingAfter: number;
    character: {
      class: string;
      level: number;
      totalStats: {
        attack: number;
        defense: number;
        hp: number;
        critChance: number;
        critDamage: number;
        evasion: number;
        lifesteal: number;
      };
    };
  };
  winnerId: string;
  loserId: string;
  rounds: Array<{
    roundNumber: number;
    attacker: string;
    defender: string;
    damage: number;
    isCrit: boolean;
    wasEvaded: boolean;
    lifestealHealed: number;
    attackerHpAfter: number;
    defenderHpAfter: number;
  }>;
  totalRounds: number;
  ratingChange: number;
  duration: number; // em ms
  createdAt: Date;
}

// Schema para Arena Season
const ArenaSeasonSchema = new Schema<IArenaSeason>({
  seasonId: { type: String, required: true, unique: true },
  seasonNumber: { type: Number, required: true },
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false },
  rewards: [{
    rank: { type: String, required: true },
    minRating: { type: Number, required: true },
    coins: { type: Number, required: true },
    materials: [{
      materialId: { type: String, required: true },
      quantity: { type: Number, required: true },
    }],
    title: String,
  }],
  topPlayers: [{
    discordId: { type: String, required: true },
    username: { type: String, required: true },
    finalRating: { type: Number, required: true },
    rank: { type: String, required: true },
    position: { type: Number, required: true },
  }],
}, { timestamps: true });

// Schema para Arena Player
const ArenaPlayerSchema = new Schema<IArenaPlayer>({
  discordId: { type: String, required: true },
  seasonId: { type: String, required: true },
  rating: { type: Number, default: 1000 },
  rank: { type: String, default: 'bronze' },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  winStreak: { type: Number, default: 0 },
  bestWinStreak: { type: Number, default: 0 },
  matchesPlayed: { type: Number, default: 0 },
  lastMatchAt: { type: Date },
  peakRating: { type: Number, default: 1000 },
  rewardsClaimable: { type: Boolean, default: false },
  rewardsClaimed: { type: Boolean, default: false },
}, { timestamps: true });

ArenaPlayerSchema.index({ discordId: 1, seasonId: 1 }, { unique: true });
ArenaPlayerSchema.index({ seasonId: 1, rating: -1 });

// Schema para Arena Match
const ArenaMatchSchema = new Schema<IArenaMatch>({
  matchId: { type: String, required: true, unique: true },
  seasonId: { type: String, required: true },
  player1: {
    discordId: { type: String, required: true },
    username: { type: String, required: true },
    ratingBefore: { type: Number, required: true },
    ratingAfter: { type: Number, required: true },
    character: {
      class: { type: String, required: true },
      level: { type: Number, required: true },
      totalStats: {
        attack: Number,
        defense: Number,
        hp: Number,
        critChance: Number,
        critDamage: Number,
        evasion: Number,
        lifesteal: Number,
      },
    },
  },
  player2: {
    discordId: { type: String, required: true },
    username: { type: String, required: true },
    ratingBefore: { type: Number, required: true },
    ratingAfter: { type: Number, required: true },
    character: {
      class: { type: String, required: true },
      level: { type: Number, required: true },
      totalStats: {
        attack: Number,
        defense: Number,
        hp: Number,
        critChance: Number,
        critDamage: Number,
        evasion: Number,
        lifesteal: Number,
      },
    },
  },
  winnerId: { type: String, required: true },
  loserId: { type: String, required: true },
  rounds: [{
    roundNumber: Number,
    attacker: String,
    defender: String,
    damage: Number,
    isCrit: Boolean,
    wasEvaded: Boolean,
    lifestealHealed: Number,
    attackerHpAfter: Number,
    defenderHpAfter: Number,
  }],
  totalRounds: { type: Number, required: true },
  ratingChange: { type: Number, required: true },
  duration: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

ArenaMatchSchema.index({ seasonId: 1, createdAt: -1 });
ArenaMatchSchema.index({ 'player1.discordId': 1 });
ArenaMatchSchema.index({ 'player2.discordId': 1 });

export const ArenaSeason = mongoose.model<IArenaSeason>('ArenaSeason', ArenaSeasonSchema);
export const ArenaPlayer = mongoose.model<IArenaPlayer>('ArenaPlayer', ArenaPlayerSchema);
export const ArenaMatch = mongoose.model<IArenaMatch>('ArenaMatch', ArenaMatchSchema);
