// Serviço de Notificações
import {
  Notification,
  NotificationPreferences,
  NotificationTemplate,
  INotification,
  INotificationPreferences,
  INotificationTemplate,
  NotificationType,
  DeliveryChannel,
  NotificationStatus,
} from '../database/models/Notification';
import { v4 as uuidv4 } from 'uuid';

// Configurações padrão
const DEFAULT_PREFERENCES: Partial<INotificationPreferences> = {
  enabled: true,
  channels: { dm: true, server: true },
  quietHours: { enabled: false, start: 22, end: 8 },
  frequency: { maxPerHour: 20, bundleNotifications: true, bundleDelay: 5 },
};

// Templates padrão para cada tipo
const DEFAULT_TEMPLATES: Record<NotificationType, { title: string; message: string }> = {
  level_up: { title: 'Level Up!', message: 'Parabéns! Você alcançou o nível {{level}}!' },
  badge_earned: { title: 'Nova Badge!', message: 'Você conquistou a badge "{{badgeName}}"!' },
  quest_complete: { title: 'Quest Completa!', message: 'A quest "{{questName}}" foi completada!' },
  quest_available: { title: 'Nova Quest!', message: 'Uma nova quest está disponível: "{{questName}}"' },
  daily_reminder: { title: 'Daily Disponível', message: 'Não esqueça de coletar sua recompensa diária!' },
  weekly_reset: { title: 'Reset Semanal', message: 'As quests semanais foram resetadas!' },
  auction_outbid: { title: 'Lance Superado', message: 'Seu lance no item "{{itemName}}" foi superado!' },
  auction_won: { title: 'Leilão Vencido!', message: 'Você venceu o leilão do item "{{itemName}}"!' },
  auction_sold: { title: 'Item Vendido!', message: 'Seu item "{{itemName}}" foi vendido por {{price}} coins!' },
  trade_request: { title: 'Proposta de Trade', message: '{{username}} quer trocar itens com você!' },
  trade_complete: { title: 'Trade Concluído', message: 'A troca com {{username}} foi concluída!' },
  guild_invite: { title: 'Convite de Guilda', message: 'Você foi convidado para a guilda "{{guildName}}"!' },
  guild_event: { title: 'Evento de Guilda', message: '{{eventName}} começou na sua guilda!' },
  raid_available: { title: 'Raid Disponível', message: 'A raid "{{raidName}}" está disponível!' },
  boss_spawned: { title: 'World Boss!', message: 'O boss "{{bossName}}" apareceu!' },
  pvp_challenge: { title: 'Desafio PvP', message: '{{username}} desafiou você para um duelo!' },
  season_end: { title: 'Fim de Temporada', message: 'A temporada {{seasonNumber}} está terminando!' },
  battle_pass_reward: { title: 'Recompensa BP', message: 'Nova recompensa do Battle Pass disponível!' },
  housing_harvest: { title: 'Colheita Pronta', message: 'Suas plantas estão prontas para colher!' },
  crafting_complete: { title: 'Craft Completo', message: 'O craft de "{{itemName}}" foi concluído!' },
  loan_due: { title: 'Empréstimo Vencendo', message: 'Seu empréstimo vence em {{days}} dias!' },
  achievement_progress: { title: 'Conquista Próxima', message: 'Você está perto de desbloquear "{{achievementName}}"!' },
  friend_online: { title: 'Amigo Online', message: '{{username}} está online!' },
  custom: { title: '{{title}}', message: '{{message}}' },
};

// Obter ou criar preferências do usuário
export async function getPreferences(discordId: string): Promise<INotificationPreferences> {
  let prefs = await NotificationPreferences.findOne({ odiscordId: discordId });

  if (!prefs) {
    prefs = new NotificationPreferences({
      odiscordId: discordId,
      ...DEFAULT_PREFERENCES,
    });
    await prefs.save();
  }

  return prefs;
}

// Atualizar preferências
export async function updatePreferences(
  discordId: string,
  updates: Partial<INotificationPreferences>
): Promise<INotificationPreferences> {
  const prefs = await NotificationPreferences.findOneAndUpdate(
    { odiscordId: discordId },
    { $set: updates },
    { new: true, upsert: true }
  );
  return prefs!;
}

// Configurar preferência de tipo específico
export async function setTypePreference(
  discordId: string,
  type: NotificationType,
  settings: { enabled?: boolean; channel?: DeliveryChannel; sound?: boolean }
): Promise<INotificationPreferences> {
  const prefs = await getPreferences(discordId);

  if (!prefs.types) {
    prefs.types = {};
  }

  prefs.types[type] = {
    enabled: settings.enabled ?? true,
    channel: settings.channel ?? 'dm',
    sound: settings.sound ?? true,
    ...prefs.types[type],
    ...settings,
  };

  await prefs.save();
  return prefs;
}

// Verificar se deve enviar notificação
export async function shouldSendNotification(
  discordId: string,
  type: NotificationType
): Promise<{ shouldSend: boolean; channel: DeliveryChannel; reason?: string }> {
  const prefs = await getPreferences(discordId);

  // Verificar se notificações estão habilitadas
  if (!prefs.enabled) {
    return { shouldSend: false, channel: 'dm', reason: 'Notificações desabilitadas' };
  }

  // Verificar preferência do tipo específico
  const typePrefs = prefs.types?.[type];
  if (typePrefs && !typePrefs.enabled) {
    return { shouldSend: false, channel: 'dm', reason: `Notificações de ${type} desabilitadas` };
  }

  // Verificar horário silencioso
  if (prefs.quietHours?.enabled) {
    const now = new Date();
    const currentHour = now.getHours();
    const { start, end } = prefs.quietHours;

    const inQuietHours = start > end
      ? (currentHour >= start || currentHour < end)
      : (currentHour >= start && currentHour < end);

    if (inQuietHours) {
      return { shouldSend: false, channel: 'dm', reason: 'Horário silencioso ativo' };
    }
  }

  // Verificar limite por hora
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await Notification.countDocuments({
    odiscordId: discordId,
    sentAt: { $gte: oneHourAgo },
  });

  if (recentCount >= (prefs.frequency?.maxPerHour || 20)) {
    return { shouldSend: false, channel: 'dm', reason: 'Limite por hora atingido' };
  }

  const channel = typePrefs?.channel || 'dm';
  return { shouldSend: true, channel };
}

// Criar notificação
export async function createNotification(
  discordId: string,
  type: NotificationType,
  data: Record<string, any> = {},
  options: {
    title?: string;
    message?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    channel?: DeliveryChannel;
    scheduledFor?: Date;
    expiresAt?: Date;
    actionUrl?: string;
    actionLabel?: string;
    groupId?: string;
  } = {}
): Promise<{ success: boolean; notification?: INotification; reason?: string }> {
  // Verificar se deve enviar
  const check = await shouldSendNotification(discordId, type);
  if (!check.shouldSend) {
    return { success: false, reason: check.reason };
  }

  // Obter template
  const template = DEFAULT_TEMPLATES[type] || DEFAULT_TEMPLATES.custom;

  // Processar placeholders
  let title = options.title || template.title;
  let message = options.message || template.message;

  for (const [key, value] of Object.entries(data)) {
    title = title.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }

  // Criar notificação
  const notification = new Notification({
    notificationId: uuidv4(),
    odiscordId: discordId,
    type,
    title,
    message,
    data,
    priority: options.priority || 'normal',
    status: options.scheduledFor ? 'pending' : 'pending',
    channel: options.channel || check.channel,
    scheduledFor: options.scheduledFor,
    expiresAt: options.expiresAt,
    actionUrl: options.actionUrl,
    actionLabel: options.actionLabel,
    groupId: options.groupId,
  });

  await notification.save();

  return { success: true, notification: notification.toObject() };
}

// Marcar como enviada
export async function markAsSent(notificationId: string): Promise<void> {
  await Notification.updateOne(
    { notificationId },
    { $set: { status: 'sent', sentAt: new Date() } }
  );
}

// Marcar como lida
export async function markAsRead(notificationId: string): Promise<void> {
  await Notification.updateOne(
    { notificationId },
    { $set: { status: 'read', readAt: new Date() } }
  );
}

// Marcar todas como lidas
export async function markAllAsRead(discordId: string): Promise<number> {
  const result = await Notification.updateMany(
    { odiscordId: discordId, status: { $in: ['pending', 'sent'] } },
    { $set: { status: 'read', readAt: new Date() } }
  );
  return result.modifiedCount;
}

// Dispensar notificação
export async function dismissNotification(notificationId: string): Promise<void> {
  await Notification.updateOne(
    { notificationId },
    { $set: { status: 'dismissed' } }
  );
}

// Obter notificações pendentes
export async function getPendingNotifications(
  discordId?: string,
  limit: number = 50
): Promise<any[]> {
  const query: any = {
    status: 'pending',
    $or: [
      { scheduledFor: { $exists: false } },
      { scheduledFor: { $lte: new Date() } },
    ],
  };

  if (discordId) {
    query.odiscordId = discordId;
  }

  return await Notification.find(query)
    .sort({ priority: -1, createdAt: 1 })
    .limit(limit)
    .lean();
}

// Obter notificações do usuário
export async function getUserNotifications(
  discordId: string,
  options: {
    status?: NotificationStatus[];
    type?: NotificationType[];
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ notifications: any[]; total: number }> {
  const query: any = { odiscordId: discordId };

  if (options.status?.length) {
    query.status = { $in: options.status };
  }

  if (options.type?.length) {
    query.type = { $in: options.type };
  }

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(options.offset || 0)
      .limit(options.limit || 20)
      .lean(),
    Notification.countDocuments(query),
  ]);

  return { notifications, total };
}

// Obter contagem de não lidas
export async function getUnreadCount(discordId: string): Promise<number> {
  return await Notification.countDocuments({
    odiscordId: discordId,
    status: { $in: ['pending', 'sent'] },
  });
}

// Limpar notificações expiradas
export async function cleanupExpiredNotifications(): Promise<number> {
  const result = await Notification.deleteMany({
    expiresAt: { $lte: new Date() },
    status: { $in: ['pending', 'sent'] },
  });
  return result.deletedCount;
}

// Limpar notificações antigas
export async function cleanupOldNotifications(daysOld: number = 30): Promise<number> {
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  const result = await Notification.deleteMany({
    createdAt: { $lte: cutoff },
    status: { $in: ['read', 'dismissed'] },
  });
  return result.deletedCount;
}

// Enviar notificação em lote (agrupar)
export async function sendBatchNotification(
  discordIds: string[],
  type: NotificationType,
  data: Record<string, any> = {},
  options: {
    title?: string;
    message?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  } = {}
): Promise<{ sent: number; skipped: number }> {
  let sent = 0;
  let skipped = 0;

  for (const discordId of discordIds) {
    const result = await createNotification(discordId, type, data, options);
    if (result.success) {
      sent++;
    } else {
      skipped++;
    }
  }

  return { sent, skipped };
}

// Obter estatísticas de notificações
export async function getNotificationStats(discordId: string): Promise<{
  total: number;
  unread: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}> {
  const [total, unread, byTypeAgg, byStatusAgg] = await Promise.all([
    Notification.countDocuments({ odiscordId: discordId }),
    getUnreadCount(discordId),
    Notification.aggregate([
      { $match: { odiscordId: discordId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    Notification.aggregate([
      { $match: { odiscordId: discordId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  for (const item of byTypeAgg) {
    byType[item._id] = item.count;
  }

  for (const item of byStatusAgg) {
    byStatus[item._id] = item.count;
  }

  return { total, unread, byType, byStatus };
}

// Helpers para tipos comuns de notificação
export const notify = {
  levelUp: (discordId: string, level: number) =>
    createNotification(discordId, 'level_up', { level }, { priority: 'high' }),

  badgeEarned: (discordId: string, badgeName: string) =>
    createNotification(discordId, 'badge_earned', { badgeName }, { priority: 'high' }),

  questComplete: (discordId: string, questName: string) =>
    createNotification(discordId, 'quest_complete', { questName }),

  dailyReminder: (discordId: string) =>
    createNotification(discordId, 'daily_reminder', {}),

  auctionOutbid: (discordId: string, itemName: string) =>
    createNotification(discordId, 'auction_outbid', { itemName }, { priority: 'high' }),

  auctionWon: (discordId: string, itemName: string) =>
    createNotification(discordId, 'auction_won', { itemName }, { priority: 'high' }),

  tradeRequest: (discordId: string, username: string) =>
    createNotification(discordId, 'trade_request', { username }, { priority: 'high' }),

  guildInvite: (discordId: string, guildName: string) =>
    createNotification(discordId, 'guild_invite', { guildName }),

  bossSpawned: (discordId: string, bossName: string) =>
    createNotification(discordId, 'boss_spawned', { bossName }, { priority: 'urgent' }),

  loanDue: (discordId: string, days: number) =>
    createNotification(discordId, 'loan_due', { days }, { priority: days <= 1 ? 'urgent' : 'normal' }),
};
