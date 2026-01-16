import mongoose, { Schema, Document } from 'mongoose';

export interface IPvpStats extends Document {
  discordId: string;
  username: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestWinStreak: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalBetsWon: number;
  totalBetsLost: number;
  lastDuelAt?: Date;
  seasonWins: number;
  seasonLosses: number;
  seasonElo: number;
  rank: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster';
  createdAt: Date;
  updatedAt: Date;
}

const PvpStatsSchema = new Schema<IPvpStats>({
  discordId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  elo: { type: Number, default: 1000 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  winStreak: { type: Number, default: 0 },
  bestWinStreak: { type: Number, default: 0 },
  totalDamageDealt: { type: Number, default: 0 },
  totalDamageTaken: { type: Number, default: 0 },
  totalBetsWon: { type: Number, default: 0 },
  totalBetsLost: { type: Number, default: 0 },
  lastDuelAt: { type: Date },
  seasonWins: { type: Number, default: 0 },
  seasonLosses: { type: Number, default: 0 },
  seasonElo: { type: Number, default: 1000 },
  rank: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster'],
    default: 'bronze'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index for leaderboard
PvpStatsSchema.index({ elo: -1 });
PvpStatsSchema.index({ seasonElo: -1 });
PvpStatsSchema.index({ wins: -1 });

// Calculate rank based on ELO
PvpStatsSchema.methods.calculateRank = function(): string {
  const elo = this.elo;
  if (elo >= 2400) return 'grandmaster';
  if (elo >= 2100) return 'master';
  if (elo >= 1800) return 'diamond';
  if (elo >= 1500) return 'platinum';
  if (elo >= 1200) return 'gold';
  if (elo >= 900) return 'silver';
  return 'bronze';
};

export const PvpStats = mongoose.model<IPvpStats>('PvpStats', PvpStatsSchema);

// Rank info for display
export const RANK_INFO: Record<string, { emoji: string; name: string; minElo: number }> = {
  bronze: { emoji: '🥉', name: 'Bronze', minElo: 0 },
  silver: { emoji: '⚪', name: 'Prata', minElo: 900 },
  gold: { emoji: '🥇', name: 'Ouro', minElo: 1200 },
  platinum: { emoji: '💠', name: 'Platina', minElo: 1500 },
  diamond: { emoji: '💎', name: 'Diamante', minElo: 1800 },
  master: { emoji: '🔮', name: 'Mestre', minElo: 2100 },
  grandmaster: { emoji: '👑', name: 'Grão-Mestre', minElo: 2400 },
};
