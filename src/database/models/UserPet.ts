import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPet {
  discordId: string;
  petId: string;
  name: string;
  level: number;
  experience: number;
  isActive: boolean;
  lastFed: Date;
  lastCollected: Date;
  totalCoinsGenerated: number;
  totalXpGenerated: number;
  hunger: number;
  happiness: number;
  acquiredAt: Date;
}

export interface UserPetDocument extends Document {
  discordId: string;
  petId: string;
  name: string;
  level: number;
  experience: number;
  isActive: boolean;
  lastFed: Date;
  lastCollected: Date;
  totalCoinsGenerated: number;
  totalXpGenerated: number;
  hunger: number;
  happiness: number;
  acquiredAt: Date;
}

const UserPetSchema = new Schema<UserPetDocument>({
  discordId: { type: String, required: true, index: true },
  petId: { type: String, required: true },
  name: { type: String, required: true },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false },
  lastFed: { type: Date, default: Date.now },
  lastCollected: { type: Date, default: Date.now },
  totalCoinsGenerated: { type: Number, default: 0 },
  totalXpGenerated: { type: Number, default: 0 },
  hunger: { type: Number, default: 100 },
  happiness: { type: Number, default: 100 },
  acquiredAt: { type: Date, default: Date.now },
}, { timestamps: true });

UserPetSchema.index({ discordId: 1, petId: 1 });
UserPetSchema.index({ discordId: 1, isActive: 1 });

export const UserPet = mongoose.model<UserPetDocument>('UserPet', UserPetSchema);
export default UserPet;
