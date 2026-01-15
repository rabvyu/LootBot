import { Schema, model, Document } from 'mongoose';

export type EventType =
  | 'xp_boost'           // Multiplier on XP gains
  | 'coins_boost'        // Multiplier on coin gains
  | 'double_daily'       // Double daily rewards
  | 'badge_hunt'         // Special badge available during event
  | 'community_goal'     // Server-wide goal
  | 'seasonal';          // Seasonal event with themed rewards

export interface IEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  active: boolean;
  startDate: Date;
  endDate: Date;
  // Boost events
  multiplier?: number;
  // Badge hunt events
  badgeId?: string;
  // Community goal events
  goalType?: 'messages' | 'voice_minutes' | 'reactions' | 'total_xp';
  goalTarget?: number;
  goalProgress?: number;
  goalReward?: {
    xp?: number;
    coins?: number;
    badgeId?: string;
  };
  // Seasonal events
  seasonalTheme?: string;
  // Participants tracking
  participants?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventDocument extends Omit<IEvent, 'id'>, Document {}

const EventSchema = new Schema<EventDocument>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['xp_boost', 'coins_boost', 'double_daily', 'badge_hunt', 'community_goal', 'seasonal']
  },
  active: { type: Boolean, default: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  // Boost events
  multiplier: { type: Number },
  // Badge hunt events
  badgeId: { type: String },
  // Community goal events
  goalType: { type: String, enum: ['messages', 'voice_minutes', 'reactions', 'total_xp'] },
  goalTarget: { type: Number },
  goalProgress: { type: Number, default: 0 },
  goalReward: {
    xp: { type: Number },
    coins: { type: Number },
    badgeId: { type: String },
  },
  // Seasonal events
  seasonalTheme: { type: String },
  // Participants tracking
  participants: [{ type: String }],
  createdBy: { type: String, required: true },
}, { timestamps: true });

// Index for finding active events
EventSchema.index({ active: 1, startDate: 1, endDate: 1 });
EventSchema.index({ type: 1 });

export const Event = model<EventDocument>('Event', EventSchema);
