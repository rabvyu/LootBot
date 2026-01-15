import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { eventService } from '../../services/eventService';
import { createErrorEmbed } from '../../utils/embeds';
import { COLORS } from '../../utils/constants';
import { formatNumber, createProgressBar } from '../../utils/helpers';

export const data = new SlashCommandBuilder()
  .setName('eventos')
  .setDescription('Ver eventos ativos do servidor');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const activeEvents = await eventService.getActiveEvents();

  if (activeEvents.length === 0) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Sem Eventos', 'Nao ha eventos ativos no momento. Fique atento para proximos eventos!')],
    });
    return;
  }

  const userParticipations = await eventService.getUserEventParticipations(interaction.user.id);

  const eventEmbeds: EmbedBuilder[] = [];

  for (const { event, participation } of userParticipations) {
    const timeLeft = Math.max(0, event.endDate.getTime() - Date.now());
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    let emoji = '🎉';
    let color = COLORS.PRIMARY;

    switch (event.type) {
      case 'xp_boost':
        emoji = '⚡';
        color = COLORS.XP;
        break;
      case 'coins_boost':
        emoji = '🪙';
        color = COLORS.ECONOMY;
        break;
      case 'double_daily':
        emoji = '📅';
        color = COLORS.SUCCESS;
        break;
      case 'community_goal':
        emoji = '🎯';
        color = COLORS.BADGE;
        break;
      case 'badge_hunt':
        emoji = '🏅';
        color = COLORS.BADGE;
        break;
      case 'seasonal':
        emoji = '🎄';
        color = COLORS.LEVEL_UP;
        break;
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${emoji} ${event.name}`)
      .setDescription(event.description);

    // Add time remaining
    embed.addFields({
      name: '⏱️ Tempo Restante',
      value: hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`,
      inline: true,
    });

    // Add multiplier for boost events
    if (event.multiplier && ['xp_boost', 'coins_boost', 'double_daily'].includes(event.type)) {
      embed.addFields({
        name: '✨ Bonus',
        value: `${event.multiplier}x`,
        inline: true,
      });
    }

    // Add goal progress for community goals
    if (event.type === 'community_goal' && event.goalTarget) {
      const progress = (event.goalProgress || 0) / event.goalTarget * 100;
      const progressBar = createProgressBar(Math.min(progress, 100));

      embed.addFields({
        name: '📊 Progresso da Comunidade',
        value: `${progressBar} ${progress.toFixed(1)}%\n${formatNumber(event.goalProgress || 0)} / ${formatNumber(event.goalTarget)}`,
        inline: false,
      });

      // Show rewards
      const rewards: string[] = [];
      if (event.goalReward?.xp) rewards.push(`${formatNumber(event.goalReward.xp)} XP`);
      if (event.goalReward?.coins) rewards.push(`${formatNumber(event.goalReward.coins)} 🪙`);
      if (event.goalReward?.badgeId) rewards.push('Badge Especial');

      if (rewards.length > 0) {
        embed.addFields({
          name: '🎁 Recompensa',
          value: rewards.join(' + '),
          inline: true,
        });
      }
    }

    // Add user participation stats
    if (participation) {
      const stats: string[] = [];
      if (participation.xpEarned > 0) stats.push(`${formatNumber(participation.xpEarned)} XP ganho`);
      if (participation.coinsEarned > 0) stats.push(`${formatNumber(participation.coinsEarned)} 🪙 ganho`);
      if (participation.contribution > 0) stats.push(`${formatNumber(participation.contribution)} contribuicao`);

      if (stats.length > 0) {
        embed.addFields({
          name: '📈 Sua Participacao',
          value: stats.join('\n'),
          inline: true,
        });
      }
    }

    embed.setFooter({ text: `Termina em ${new Date(event.endDate).toLocaleDateString('pt-BR')}` });
    embed.setTimestamp();

    eventEmbeds.push(embed);
  }

  // Send all event embeds
  await interaction.editReply({ embeds: eventEmbeds.slice(0, 5) }); // Discord limit of 5 embeds
}
