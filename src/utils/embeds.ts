import { EmbedBuilder, User, Role } from 'discord.js';
import { COLORS, RARITY_COLORS } from './constants';
import { createProgressBar, formatNumber, formatDuration, getOrdinal } from './helpers';
import { IUser, IBadge, LeaderboardEntry, BadgeRarity } from '../types';

// Rarity symbols for badge display
const RARITY_SYMBOLS: Record<BadgeRarity, string> = {
  common: '⚪',
  uncommon: '🟢',
  rare: '🔵',
  epic: '🟣',
  legendary: '🟠',
};

/**
 * Format badges count by rarity with symbols
 * Example: "3 (🟠1 🟣1 🔵1)" or "1 (🟠1)"
 */
function formatBadgeCountByRarity(badges: IBadge[]): string {
  if (badges.length === 0) return '0';

  // Count badges by rarity
  const counts: Record<BadgeRarity, number> = {
    legendary: 0,
    epic: 0,
    rare: 0,
    uncommon: 0,
    common: 0,
  };

  for (const badge of badges) {
    counts[badge.rarity]++;
  }

  // Build rarity display string (only show rarities that have badges)
  const rarityOrder: BadgeRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
  const rarityParts: string[] = [];

  for (const rarity of rarityOrder) {
    if (counts[rarity] > 0) {
      rarityParts.push(`${RARITY_SYMBOLS[rarity]}${counts[rarity]}`);
    }
  }

  return `${badges.length} (${rarityParts.join(' ')})`;
}

/**
 * Create rank card embed
 */
export function createRankEmbed(user: User, userData: IUser, rank: number, xpNeeded: number, progress: number, badges: IBadge[] = []): EmbedBuilder {
  const badgeDisplay = badges.length > 0 ? formatBadgeCountByRarity(badges) : `${userData.badges.length}`;

  return new EmbedBuilder()
    .setColor(COLORS.XP)
    .setAuthor({
      name: user.globalName || user.username,
      iconURL: user.displayAvatarURL(),
    })
    .setThumbnail(user.displayAvatarURL({ size: 128 }))
    .addFields(
      { name: 'Rank', value: `#${rank}`, inline: true },
      { name: 'Level', value: `${userData.level}`, inline: true },
      { name: 'XP Total', value: formatNumber(userData.totalXP), inline: true },
      { name: 'Progresso', value: `${createProgressBar(progress)} ${progress.toFixed(1)}%`, inline: false },
      { name: 'XP para proximo nivel', value: formatNumber(xpNeeded), inline: true },
      { name: 'Badges', value: badgeDisplay, inline: true },
    )
    .setFooter({ text: 'Continue interagindo para ganhar XP!' })
    .setTimestamp();
}

/**
 * Create profile embed
 */
export function createProfileEmbed(
  user: User,
  userData: IUser,
  rank: number,
  badges: IBadge[],
  xpNeeded: number,
  progress: number,
  equippedTitle: string | null = null
): EmbedBuilder {
  const settings = userData.profileSettings || {
    showStats: true,
    showBadges: true,
    showStreak: true,
    showCoins: true,
    showRank: true,
    privateProfile: false,
  };

  // Determine embed color
  const embedColor = userData.profileColor
    ? parseInt(userData.profileColor.replace('#', ''), 16)
    : COLORS.PRIMARY;

  // Build description
  let description = '';

  // Add title if equipped
  if (equippedTitle) {
    description += `${equippedTitle}\n\n`;
  }

  // Add bio if exists
  if (userData.profileBio) {
    description += `*"${userData.profileBio}"*\n\n`;
  }

  // Add rank and level
  if (settings.showRank) {
    description += `**Rank:** #${rank} | **Level:** ${userData.level}`;
  } else {
    description += `**Level:** ${userData.level}`;
  }

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setAuthor({
      name: `Perfil de ${user.globalName || user.username}`,
      iconURL: user.displayAvatarURL(),
    })
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .setDescription(description)
    .addFields(
      { name: 'XP Total', value: formatNumber(userData.totalXP), inline: true },
      { name: 'Progresso', value: `${progress.toFixed(1)}%`, inline: true },
      { name: 'XP para Level Up', value: formatNumber(xpNeeded), inline: true },
    );

  // Add coins if visible
  if (settings.showCoins) {
    embed.addFields({ name: 'Moedas', value: `${formatNumber(userData.coins)} 🪙`, inline: true });
  }

  // Add badges if visible
  if (settings.showBadges) {
    const badgeIcons = badges.map(b => b.icon).join(' ') || 'Nenhuma';
    const badgeCountDisplay = formatBadgeCountByRarity(badges);
    embed.addFields({ name: `Badges ${badgeCountDisplay}`, value: badgeIcons, inline: false });
  }

  // Add stats if visible
  if (settings.showStats) {
    embed.addFields({
      name: 'Estatisticas',
      value: [
        `Mensagens: ${formatNumber(userData.stats.messagesCount)}`,
        `Tempo em Voz: ${formatDuration(userData.stats.voiceMinutes)}`,
        `Reacoes Dadas: ${formatNumber(userData.stats.reactionsGiven)}`,
        `Reacoes Recebidas: ${formatNumber(userData.stats.reactionsReceived)}`,
      ].join('\n'),
      inline: true,
    });
  }

  // Add streaks if visible
  if (settings.showStreak) {
    embed.addFields({
      name: 'Streaks',
      value: [
        `Streak Atual: ${userData.stats.currentStreak} dias`,
        `Maior Streak: ${userData.stats.longestStreak} dias`,
      ].join('\n'),
      inline: true,
    });
  }

  embed
    .setFooter({ text: `Membro desde ${userData.joinedAt.toLocaleDateString('pt-BR')}` })
    .setTimestamp();

  return embed;
}

/**
 * Create leaderboard embed
 */
export function createLeaderboardEmbed(entries: LeaderboardEntry[], period: string): EmbedBuilder {
  const description = entries.map((entry, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
    const badges = entry.badges.length > 0 ? ` [${entry.badges.length}]` : '';
    return `${medal} **${entry.globalName || entry.username}**${badges}\nLevel ${entry.level} | ${formatNumber(entry.xp)} XP`;
  }).join('\n\n');

  const periodTitle = {
    daily: 'Hoje',
    weekly: 'Esta Semana',
    monthly: 'Este Mes',
    alltime: 'Geral',
  }[period] || 'Geral';

  return new EmbedBuilder()
    .setColor(COLORS.XP)
    .setTitle(`🏆 Leaderboard - ${periodTitle}`)
    .setDescription(description || 'Nenhum dado disponivel')
    .setFooter({ text: 'Interaja no servidor para subir no ranking!' })
    .setTimestamp();
}

/**
 * Create level up embed
 */
export function createLevelUpEmbed(
  user: User,
  oldLevel: number,
  newLevel: number,
  newBadges: IBadge[],
  newRole: Role | null = null
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.LEVEL_UP)
    .setTitle('🎉 Level Up!')
    .setDescription(`Parabens ${user}! Voce subiu para o **Level ${newLevel}**!`)
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: 'Nivel Anterior', value: `${oldLevel}`, inline: true },
      { name: 'Novo Nivel', value: `${newLevel}`, inline: true },
    )
    .setTimestamp();

  if (newRole) {
    embed.addFields({
      name: '🎖️ Novo Cargo Desbloqueado!',
      value: `${newRole}`,
      inline: false,
    });
  }

  if (newBadges.length > 0) {
    embed.addFields({
      name: '🏅 Novas Badges Desbloqueadas!',
      value: newBadges.map(b => `${b.icon} **${b.name}**`).join('\n'),
      inline: false,
    });
  }

  return embed;
}

/**
 * Create badge list embed
 */
export function createBadgeListEmbed(user: User, badges: IBadge[], totalBadges: number): EmbedBuilder {
  const rarityOrder: BadgeRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

  const sortedBadges = [...badges].sort((a, b) => {
    return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
  });

  const badgeList = sortedBadges.map(badge => {
    const rarityEmoji = {
      common: '⚪',
      uncommon: '🟢',
      rare: '🔵',
      epic: '🟣',
      legendary: '🟠',
    }[badge.rarity];
    return `${badge.icon} **${badge.name}** ${rarityEmoji}\n┗ ${badge.description}`;
  }).join('\n\n') || 'Nenhuma badge conquistada ainda.';

  return new EmbedBuilder()
    .setColor(COLORS.BADGE)
    .setTitle(`🏅 Badges de ${user.globalName || user.username}`)
    .setThumbnail(user.displayAvatarURL())
    .setDescription(badgeList)
    .setFooter({ text: `${badges.length}/${totalBadges} badges conquistadas` })
    .setTimestamp();
}

/**
 * Create badge earned embed (simple version for DMs/common badges)
 */
export function createBadgeEarnedEmbed(user: User, badge: IBadge): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(RARITY_COLORS[badge.rarity])
    .setTitle('🏅 Nova Badge Conquistada!')
    .setDescription(`${user} conquistou a badge **${badge.name}**!`)
    .addFields(
      { name: 'Badge', value: `${badge.icon} ${badge.name}`, inline: true },
      { name: 'Raridade', value: badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1), inline: true },
      { name: 'Descricao', value: badge.description, inline: false },
    )
    .setThumbnail(user.displayAvatarURL())
    .setTimestamp();
}

/**
 * Create special badge announcement embed for rare+ badges
 */
export function createRareBadgeAnnouncementEmbed(user: User, badge: IBadge): EmbedBuilder {
  const rarityEmoji: Record<BadgeRarity, string> = {
    common: '⚪',
    uncommon: '🟢',
    rare: '🔵',
    epic: '🟣',
    legendary: '🟠',
  };

  const rarityTitle: Record<BadgeRarity, string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: '💎 RARE',
    epic: '🌟 EPIC',
    legendary: '👑 LEGENDARY',
  };

  const celebrationText: Record<BadgeRarity, string> = {
    common: '',
    uncommon: '',
    rare: '**Parabens!** Uma conquista digna de nota!',
    epic: '**Incrivel!** Uma conquista excepcional!',
    legendary: '**LENDARIO!** Uma conquista historica para a comunidade!',
  };

  const embed = new EmbedBuilder()
    .setColor(RARITY_COLORS[badge.rarity])
    .setAuthor({
      name: '🏆 BADGE CONQUISTADA!',
      iconURL: user.displayAvatarURL(),
    })
    .setTitle(`${badge.icon} ${badge.name}`)
    .setDescription(
      `${user} conquistou uma badge **${rarityTitle[badge.rarity]}**!\n\n` +
      `${celebrationText[badge.rarity]}`
    )
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: 'Badge', value: `${badge.icon} **${badge.name}**`, inline: true },
      { name: 'Raridade', value: `${rarityEmoji[badge.rarity]} ${rarityTitle[badge.rarity]}`, inline: true },
      { name: 'Descricao', value: badge.description, inline: false },
    )
    .setFooter({ text: `Use /catalogo para ver todas as badges disponiveis!` })
    .setTimestamp();

  // Add special effects for legendary badges
  if (badge.rarity === 'legendary') {
    embed.setImage('https://i.imgur.com/VpWMOBr.gif'); // Celebration gif (optional)
  }

  return embed;
}

/**
 * Create daily reward embed
 */
export function createDailyEmbed(user: User, xpGained: number, streak: number, bonus: number, coins: number = 0): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle('📅 Recompensa Diaria!')
    .setDescription(`${user} coletou sua recompensa diaria!`)
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: 'XP Ganho', value: `+${formatNumber(xpGained)} XP`, inline: true },
      { name: 'Moedas', value: `+${formatNumber(coins)} 🪙`, inline: true },
      { name: 'Streak', value: `🔥 ${streak} dias`, inline: true },
    )
    .setTimestamp();

  if (bonus > 0) {
    embed.addFields({ name: 'Bonus de Streak (XP)', value: `+${formatNumber(bonus)} XP`, inline: true });
  }

  return embed;
}

/**
 * Create streak embed
 */
export function createStreakEmbed(user: User, currentStreak: number, longestStreak: number, nextReward: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.XP)
    .setTitle('🔥 Streak')
    .setDescription(`Streak de ${user.globalName || user.username}`)
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: 'Streak Atual', value: `${currentStreak} dias`, inline: true },
      { name: 'Maior Streak', value: `${longestStreak} dias`, inline: true },
      { name: 'Proximo Bonus', value: `${nextReward} XP`, inline: true },
    )
    .setFooter({ text: 'Use /daily todos os dias para manter seu streak!' })
    .setTimestamp();
}

/**
 * Create stats embed
 */
export function createStatsEmbed(
  totalMembers: number,
  totalXP: number,
  activeBadges: number,
  topLevel: number,
  messagesThisWeek: number,
  voiceMinutesThisWeek: number
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('📊 Estatisticas do Servidor')
    .addFields(
      { name: 'Membros Registrados', value: formatNumber(totalMembers), inline: true },
      { name: 'XP Total Distribuido', value: formatNumber(totalXP), inline: true },
      { name: 'Badges Ativas', value: `${activeBadges}`, inline: true },
      { name: 'Maior Level', value: `${topLevel}`, inline: true },
      { name: 'Mensagens (semana)', value: formatNumber(messagesThisWeek), inline: true },
      { name: 'Tempo em Voz (semana)', value: formatDuration(voiceMinutesThisWeek), inline: true },
    )
    .setTimestamp();
}

/**
 * Create error embed
 */
export function createErrorEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.ERROR)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Create success embed
 */
export function createSuccessEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Create warning embed
 */
export function createWarningEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.WARNING)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}
