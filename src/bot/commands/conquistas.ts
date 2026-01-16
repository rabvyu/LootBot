import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  StringSelectMenuInteraction,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
} from 'discord.js';
import { achievementService } from '../../services/achievementService';
import { User } from '../../database/models';
import {
  AchievementCategory,
  getCategoryName,
  getRarityName,
  RARITY_COLORS,
  RARITY_EMOJIS,
  getAllAchievements,
} from '../../data/achievements';

export const data = new SlashCommandBuilder()
  .setName('conquistas')
  .setDescription('Sistema de Conquistas')
  .addSubcommand(sub =>
    sub
      .setName('perfil')
      .setDescription('Ver seu perfil de conquistas')
  )
  .addSubcommand(sub =>
    sub
      .setName('listar')
      .setDescription('Ver lista de conquistas')
      .addStringOption(opt =>
        opt
          .setName('categoria')
          .setDescription('Filtrar por categoria')
          .addChoices(
            { name: '⚔️ Combate', value: 'combat' },
            { name: '📈 Progressão', value: 'progression' },
            { name: '🏰 Social', value: 'social' },
            { name: '🔨 Criação', value: 'crafting' },
            { name: '🏛️ Exploração', value: 'exploration' },
            { name: '💰 Coleção', value: 'collection' },
            { name: '🏆 PvP', value: 'pvp' },
            { name: '🌍 Eventos', value: 'events' },
            { name: '⭐ Especial', value: 'special' }
          )
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('reivindicar')
      .setDescription('Reivindicar recompensas de conquistas')
  )
  .addSubcommand(sub =>
    sub
      .setName('ranking')
      .setDescription('Ver ranking de conquistas')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'perfil':
      return handleProfile(interaction);
    case 'listar':
      return handleList(interaction);
    case 'reivindicar':
      return handleClaim(interaction);
    case 'ranking':
      return handleRanking(interaction);
    default:
      return handleProfile(interaction);
  }
}

// ==================== HANDLERS ====================

async function handleProfile(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  // Sincronizar stats primeiro
  await achievementService.syncStats(interaction.user.id);

  const profile = await achievementService.getPlayerProfile(interaction.user.id);

  const embed = new EmbedBuilder()
    .setTitle(`🏆 Conquistas de ${interaction.user.username}`)
    .setColor(0xFFD700)
    .setThumbnail(interaction.user.displayAvatarURL());

  // Estatísticas gerais
  embed.addFields(
    { name: '⭐ Pontos', value: profile.totalPoints.toLocaleString(), inline: true },
    { name: '✅ Completadas', value: `${profile.completedCount}/${profile.totalAchievements}`, inline: true },
    { name: '📊 Progresso', value: `${profile.completionPercentage}%`, inline: true }
  );

  // Recompensas pendentes
  if (profile.unclaimedRewards > 0) {
    embed.addFields({
      name: '🎁 Recompensas Pendentes',
      value: `Você tem **${profile.unclaimedRewards}** recompensa(s) para reivindicar!\nUse \`/conquistas reivindicar\``,
      inline: false,
    });
  }

  // Conquistas recentes
  if (profile.recentAchievements.length > 0) {
    const recentText = profile.recentAchievements.map(a => {
      const date = new Date(a.completedAt).toLocaleDateString('pt-BR');
      return `${a.achievement.emoji} **${a.achievement.name}** - ${date}`;
    }).join('\n');

    embed.addFields({
      name: '📜 Conquistas Recentes',
      value: recentText,
      inline: false,
    });
  }

  // Estatísticas detalhadas
  const statsText = [
    `⚔️ Monstros derrotados: ${profile.stats.monstersKilled.toLocaleString()}`,
    `👹 Bosses derrotados: ${profile.stats.bossesKilled.toLocaleString()}`,
    `🏛️ Dungeons completadas: ${profile.stats.dungeonsCompleted.toLocaleString()}`,
    `🏆 Vitórias PvP: ${profile.stats.pvpWins.toLocaleString()}`,
    `🔨 Itens criados: ${profile.stats.itemsCrafted.toLocaleString()}`,
    `✨ Encantamentos: ${profile.stats.enchantmentsApplied.toLocaleString()}`,
  ].join('\n');

  embed.addFields({
    name: '📊 Estatísticas',
    value: statsText,
    inline: false,
  });

  embed.setFooter({ text: 'Use /conquistas listar para ver todas as conquistas' });

  return interaction.editReply({ embeds: [embed] });
}

async function handleList(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const category = interaction.options.getString('categoria') as AchievementCategory | null;

  const achievements = await achievementService.getAchievementsWithProgress(
    interaction.user.id,
    category || undefined
  );

  if (achievements.length === 0) {
    return interaction.editReply({ content: '❌ Nenhuma conquista encontrada.' });
  }

  const embed = new EmbedBuilder()
    .setTitle(`🏆 ${category ? getCategoryName(category) : 'Todas as Conquistas'}`)
    .setColor(0xFFD700);

  // Agrupar por status
  const completed = achievements.filter(a => a.completed);
  const inProgress = achievements.filter(a => !a.completed && a.progress > 0);
  const notStarted = achievements.filter(a => !a.completed && a.progress === 0);

  // Mostrar completadas
  if (completed.length > 0) {
    const completedText = completed.slice(0, 5).map(a => {
      const claimed = a.claimed ? '✅' : '🎁';
      return `${claimed} ${a.achievement.emoji} **${a.achievement.name}** ${RARITY_EMOJIS[a.achievement.rarity]}`;
    }).join('\n');

    embed.addFields({
      name: `✅ Completadas (${completed.length})`,
      value: completedText + (completed.length > 5 ? `\n*...e mais ${completed.length - 5}*` : ''),
      inline: false,
    });
  }

  // Mostrar em progresso
  if (inProgress.length > 0) {
    const progressText = inProgress.slice(0, 5).map(a => {
      const percent = Math.floor((a.progress / a.achievement.requirement.target) * 100);
      return `${a.achievement.emoji} **${a.achievement.name}** - ${percent}% (${a.progress}/${a.achievement.requirement.target})`;
    }).join('\n');

    embed.addFields({
      name: `🔄 Em Progresso (${inProgress.length})`,
      value: progressText + (inProgress.length > 5 ? `\n*...e mais ${inProgress.length - 5}*` : ''),
      inline: false,
    });
  }

  // Mostrar não iniciadas (apenas contagem)
  if (notStarted.length > 0) {
    embed.addFields({
      name: `⬜ Não Iniciadas`,
      value: `${notStarted.length} conquistas`,
      inline: true,
    });
  }

  // Select menu para ver detalhes
  const options = achievements.slice(0, 25).map(a => ({
    label: a.achievement.name,
    description: a.completed ? 'Completada' : `${a.progress}/${a.achievement.requirement.target}`,
    value: a.achievement.achievementId,
    emoji: a.achievement.emoji,
  }));

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_achievement')
    .setPlaceholder('Ver detalhes de uma conquista')
    .addOptions(options);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  const response = await interaction.editReply({
    embeds: [embed],
    components: [row],
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 120000,
  });

  collector.on('collect', async (selectInteraction: StringSelectMenuInteraction) => {
    if (selectInteraction.user.id !== interaction.user.id) {
      return selectInteraction.reply({ content: '❌ Este menu não é para você!', ephemeral: true });
    }

    const achievementId = selectInteraction.values[0];
    const achievementData = achievements.find(a => a.achievement.achievementId === achievementId);

    if (!achievementData) {
      return selectInteraction.reply({ content: '❌ Conquista não encontrada.', ephemeral: true });
    }

    const { achievement, progress, completed, claimed } = achievementData;

    const detailEmbed = new EmbedBuilder()
      .setTitle(`${achievement.emoji} ${achievement.name}`)
      .setColor(RARITY_COLORS[achievement.rarity])
      .setDescription(achievement.description);

    detailEmbed.addFields(
      { name: '📊 Raridade', value: `${RARITY_EMOJIS[achievement.rarity]} ${getRarityName(achievement.rarity)}`, inline: true },
      { name: '⭐ Pontos', value: `${achievement.points}`, inline: true },
      { name: '📁 Categoria', value: getCategoryName(achievement.category), inline: true }
    );

    // Progresso
    const progressPercent = Math.floor((progress / achievement.requirement.target) * 100);
    const progressBar = createProgressBar(progressPercent);

    detailEmbed.addFields({
      name: '📈 Progresso',
      value: `${progressBar} ${progressPercent}%\n${progress.toLocaleString()}/${achievement.requirement.target.toLocaleString()}`,
      inline: false,
    });

    // Requisito
    detailEmbed.addFields({
      name: '🎯 Requisito',
      value: achievement.requirement.description,
      inline: false,
    });

    // Recompensas
    const rewardsText = achievement.rewards.map(r => {
      const icons: Record<string, string> = {
        coins: '💰',
        xp: '⚡',
        material: '📦',
        title: '🏷️',
        badge: '🎖️',
      };
      return `${icons[r.type] || '🎁'} ${r.quantity}${r.itemId ? ` ${r.itemId}` : ` ${r.type}`}`;
    }).join('\n');

    detailEmbed.addFields({
      name: '🎁 Recompensas',
      value: rewardsText,
      inline: false,
    });

    // Status
    let status = '⬜ Não completada';
    if (completed) {
      status = claimed ? '✅ Completada e reivindicada' : '🎁 Completada - reivindique sua recompensa!';
    }

    detailEmbed.setFooter({ text: status });

    await selectInteraction.reply({ embeds: [detailEmbed], ephemeral: true });
  });
}

async function handleClaim(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const result = await achievementService.claimAllRewards(interaction.user.id);

  if (!result.success) {
    return interaction.editReply({
      content: '❌ Erro ao reivindicar recompensas.',
    });
  }

  if (result.claimedCount === 0) {
    return interaction.editReply({
      content: '❌ Você não tem recompensas de conquistas para reivindicar.',
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('🎁 Recompensas Reivindicadas!')
    .setColor(0x00FF00)
    .setDescription(`Você reivindicou **${result.claimedCount}** recompensa(s) de conquistas!`);

  // Mostrar recompensas
  const rewardsText = result.rewards.map(r => {
    if (r.type === 'coins') return `💰 ${r.quantity.toLocaleString()} coins`;
    if (r.type === 'xp') return `⚡ ${r.quantity.toLocaleString()} XP`;
    if (r.type.startsWith('material:')) {
      const matId = r.type.replace('material:', '');
      return `📦 ${r.quantity}x ${matId}`;
    }
    return `🎁 ${r.quantity}x ${r.type}`;
  }).join('\n');

  if (rewardsText) {
    embed.addFields({
      name: 'Recompensas Recebidas',
      value: rewardsText,
      inline: false,
    });
  }

  return interaction.editReply({ embeds: [embed] });
}

async function handleRanking(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const leaderboard = await achievementService.getLeaderboard(10);

  if (leaderboard.length === 0) {
    return interaction.editReply({
      content: '❌ Nenhum jogador com conquistas ainda.',
    });
  }

  // Buscar usernames
  const userIds = leaderboard.map(p => p.discordId);
  const users = await User.find({ discordId: { $in: userIds } });
  const userMap = new Map(users.map(u => [u.discordId, u.username]));

  const embed = new EmbedBuilder()
    .setTitle('🏆 Ranking de Conquistas')
    .setColor(0xFFD700);

  const rankingText = leaderboard.map(p => {
    const username = userMap.get(p.discordId) || 'Desconhecido';
    const medal = p.position <= 3 ? ['🥇', '🥈', '🥉'][p.position - 1] : `#${p.position}`;

    return `${medal} **${username}**\n⭐ ${p.totalPoints} pontos | ✅ ${p.completedCount} conquistas`;
  }).join('\n\n');

  embed.setDescription(rankingText);

  // Posição do jogador
  const profile = await achievementService.getPlayerProfile(interaction.user.id);
  const myPosition = leaderboard.findIndex(p => p.discordId === interaction.user.id);

  if (myPosition === -1) {
    embed.setFooter({
      text: `Seus pontos: ${profile.totalPoints} | ${profile.completedCount} conquistas`,
    });
  }

  return interaction.editReply({ embeds: [embed] });
}

// ==================== HELPERS ====================

function createProgressBar(percent: number, length: number = 10): string {
  const filled = Math.floor((percent / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
