import mongoose, { Schema, Document } from 'mongoose';

// Status do convite
export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';

// Interface do convite
export interface IGuildInvite {
  inviteId: string;
  guildId: string;
  guildName: string;
  inviterId: string;       // Quem convidou
  inviterUsername: string;
  inviteeId: string;       // Quem foi convidado
  inviteeUsername: string;
  status: InviteStatus;
  createdAt: Date;
  expiresAt: Date;
  respondedAt?: Date;
}

export interface GuildInviteDocument extends Document, IGuildInvite {}

const GuildInviteSchema = new Schema<GuildInviteDocument>({
  inviteId: { type: String, required: true, unique: true, index: true },
  guildId: { type: String, required: true, index: true },
  guildName: { type: String, required: true },
  inviterId: { type: String, required: true },
  inviterUsername: { type: String, required: true },
  inviteeId: { type: String, required: true, index: true },
  inviteeUsername: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'expired', 'cancelled'], default: 'pending' },
  expiresAt: { type: Date, required: true },
  respondedAt: { type: Date },
}, { timestamps: true });

// Índice composto para buscar convites pendentes de um usuário
GuildInviteSchema.index({ inviteeId: 1, status: 1 });
// Índice composto para buscar convites de uma guilda
GuildInviteSchema.index({ guildId: 1, status: 1 });
// TTL index para limpar convites antigos automaticamente após 30 dias
GuildInviteSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const GuildInvite = mongoose.model<GuildInviteDocument>('GuildInvite', GuildInviteSchema);
export default GuildInvite;
