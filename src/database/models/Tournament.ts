import mongoose, { Document, Schema } from 'mongoose';

// Tournament types
export type TournamentType = 'pvp' | 'fishing' | 'mining' | 'crafting' | 'xp';
export type TournamentStatus = 'registration' | 'in_progress' | 'completed' | 'cancelled';

export interface TournamentParticipant {
  discordId: string;
  username: string;
  seed: number;
  eliminated: boolean;
  eliminatedRound?: number;
  wins: number;
  losses: number;
  score: number; // For non-bracket tournaments
  registeredAt: Date;
}

export interface TournamentMatch {
  matchId: string;
  round: number;
  bracketPosition: number;
  player1Id?: string;
  player2Id?: string;
  player1Score: number;
  player2Score: number;
  winnerId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'bye';
  startedAt?: Date;
  completedAt?: Date;
}

export interface ITournament extends Document {
  name: string;
  description: string;
  type: TournamentType;
  guildId: string;
  channelId: string;
  createdBy: string;

  // Tournament settings
  maxParticipants: number;
  minParticipants: number;
  entryFee: number;
  prizePool: number;
  isBracket: boolean; // true = elimination bracket, false = score-based

  // Status
  status: TournamentStatus;
  currentRound: number;
  totalRounds: number;

  // Participants and matches
  participants: TournamentParticipant[];
  matches: TournamentMatch[];

  // Results
  winnerId?: string;
  secondPlaceId?: string;
  thirdPlaceId?: string;

  // Rewards (distributed at end)
  rewards: {
    first: { coins: number; xp: number };
    second: { coins: number; xp: number };
    third: { coins: number; xp: number };
    participation: { coins: number; xp: number };
  };

  // Timing
  registrationEndsAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

const TournamentParticipantSchema = new Schema<TournamentParticipant>({
  discordId: { type: String, required: true },
  username: { type: String, required: true },
  seed: { type: Number, default: 0 },
  eliminated: { type: Boolean, default: false },
  eliminatedRound: Number,
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  registeredAt: { type: Date, default: Date.now },
}, { _id: false });

const TournamentMatchSchema = new Schema<TournamentMatch>({
  matchId: { type: String, required: true },
  round: { type: Number, required: true },
  bracketPosition: { type: Number, required: true },
  player1Id: String,
  player2Id: String,
  player1Score: { type: Number, default: 0 },
  player2Score: { type: Number, default: 0 },
  winnerId: String,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'bye'],
    default: 'pending',
  },
  startedAt: Date,
  completedAt: Date,
}, { _id: false });

const TournamentSchema = new Schema<ITournament>({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  type: {
    type: String,
    enum: ['pvp', 'fishing', 'mining', 'crafting', 'xp'],
    required: true,
  },
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  createdBy: { type: String, required: true },

  maxParticipants: { type: Number, default: 16 },
  minParticipants: { type: Number, default: 4 },
  entryFee: { type: Number, default: 0 },
  prizePool: { type: Number, default: 0 },
  isBracket: { type: Boolean, default: true },

  status: {
    type: String,
    enum: ['registration', 'in_progress', 'completed', 'cancelled'],
    default: 'registration',
  },
  currentRound: { type: Number, default: 0 },
  totalRounds: { type: Number, default: 0 },

  participants: [TournamentParticipantSchema],
  matches: [TournamentMatchSchema],

  winnerId: String,
  secondPlaceId: String,
  thirdPlaceId: String,

  rewards: {
    first: {
      coins: { type: Number, default: 5000 },
      xp: { type: Number, default: 1000 },
    },
    second: {
      coins: { type: Number, default: 2500 },
      xp: { type: Number, default: 500 },
    },
    third: {
      coins: { type: Number, default: 1000 },
      xp: { type: Number, default: 250 },
    },
    participation: {
      coins: { type: Number, default: 100 },
      xp: { type: Number, default: 50 },
    },
  },

  registrationEndsAt: { type: Date, required: true },
  startedAt: Date,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

// Indexes
TournamentSchema.index({ guildId: 1, status: 1 });
TournamentSchema.index({ status: 1, registrationEndsAt: 1 });
TournamentSchema.index({ 'participants.discordId': 1 });

export const Tournament = mongoose.model<ITournament>('Tournament', TournamentSchema);
export default Tournament;
