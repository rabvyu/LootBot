// Model de Notificações
import mongoose, { Schema, Document } from 'mongoose';

// Tipos de notificação
export type NotificationType =
  | 'level_up'
  | 'badge_earned'
  | 'quest_complete'
  | 'quest_available'
  | 'daily_reminder'
  | 'weekly_reset'
  | 'auction_outbid'
  | 'auction_won'
  | 'auction_sold'
  | 'trade_request'
  | 'trade_complete'
  | 'guild_invite'
  | 'guild_event'
  | 'raid_available'
  | 'boss_spawned'
  | 'pvp_challenge'
  | 'season_end'
  | 'battle_pass_reward'
  | 'housing_harvest'
  | 'crafting_complete'
  | 'loan_due'
  | 'achievement_progress'
  | 'friend_online'
  | 'custom';

// Canais de entrega
export type DeliveryChannel = 'dm' | 'server' | 'both';

// Status da notificação
export type NotificationStatus = 'pending' | 'sent' | 'read' | 'failed' | 'dismissed';

// Interface de preferências de notificação
export interface INotificationPreferences extends Document {
  odiscordId: string;
  enabled: boolean;
  channels: {
    dm: boolean;
    server: boolean;
  };
  types: {
    [key in NotificationType]?: {
      enabled: boolean;
      channel: DeliveryChannel;
      sound: boolean;
    };
  };
  quietHours: {
    enabled: boolean;
    start: number; // Hora (0-23)
    end: number;
  };
  frequency: {
    maxPerHour: number;
    bundleNotifications: boolean;
    bundleDelay: number; // minutos
  };
  createdAt: Date;
  updatedAt: Date;
}

// Interface de notificação individual
export interface INotification extends Document {
  notificationId: string;
  odiscordId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: NotificationStatus;
  channel: DeliveryChannel;
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
  groupId?: string; // Para agrupar notificações relacionadas
  createdAt: Date;
}

// Interface de template de notificação
export interface INotificationTemplate extends Document {
  templateId: string;
  type: NotificationType;
  title: string;
  messageTemplate: string; // Suporta placeholders como {{username}}, {{level}}
  defaultPriority: 'low' | 'normal' | 'high' | 'urgent';
  defaultChannel: DeliveryChannel;
  icon?: string;
  color?: string;
  isActive: boolean;
}

// Schema de preferências
const NotificationPreferencesSchema = new Schema<INotificationPreferences>({
  odiscordId: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: true },
  channels: {
    dm: { type: Boolean, default: true },
    server: { type: Boolean, default: true },
  },
  types: { type: Schema.Types.Mixed, default: {} },
  quietHours: {
    enabled: { type: Boolean, default: false },
    start: { type: Number, default: 22 },
    end: { type: Number, default: 8 },
  },
  frequency: {
    maxPerHour: { type: Number, default: 20 },
    bundleNotifications: { type: Boolean, default: true },
    bundleDelay: { type: Number, default: 5 },
  },
}, { timestamps: true });

// Schema de notificação
const NotificationSchema = new Schema<INotification>({
  notificationId: { type: String, required: true, unique: true, index: true },
  odiscordId: { type: String, required: true, index: true },
  type: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  status: { type: String, enum: ['pending', 'sent', 'read', 'failed', 'dismissed'], default: 'pending', index: true },
  channel: { type: String, enum: ['dm', 'server', 'both'], default: 'dm' },
  scheduledFor: { type: Date },
  sentAt: { type: Date },
  readAt: { type: Date },
  expiresAt: { type: Date, index: true },
  actionUrl: { type: String },
  actionLabel: { type: String },
  groupId: { type: String, index: true },
}, { timestamps: true });

// Schema de template
const NotificationTemplateSchema = new Schema<INotificationTemplate>({
  templateId: { type: String, required: true, unique: true },
  type: { type: String, required: true, index: true },
  title: { type: String, required: true },
  messageTemplate: { type: String, required: true },
  defaultPriority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  defaultChannel: { type: String, enum: ['dm', 'server', 'both'], default: 'dm' },
  icon: { type: String },
  color: { type: String },
  isActive: { type: Boolean, default: true },
});

// Índices compostos
NotificationSchema.index({ odiscordId: 1, status: 1 });
NotificationSchema.index({ odiscordId: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, scheduledFor: 1 });

export const NotificationPreferences = mongoose.model<INotificationPreferences>('NotificationPreferences', NotificationPreferencesSchema);
export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export const NotificationTemplate = mongoose.model<INotificationTemplate>('NotificationTemplate', NotificationTemplateSchema);

export type NotificationPreferencesDocument = INotificationPreferences;
export type NotificationDocument = INotification;
export type NotificationTemplateDocument = INotificationTemplate;
