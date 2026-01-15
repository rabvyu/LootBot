import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { userRepository } from '../../database/repositories/userRepository';
import { badgeRepository } from '../../database/repositories/badgeRepository';
import { createStatsEmbed } from '../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Ver estatisticas gerais do servidor');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  // Get stats
  const totalMembers = await userRepository.getTotalUsers();
  const totalXP = await userRepository.getTotalXP();
  const activeBadges = await badgeRepository.getTotalCount();
  const topLevel = await userRepository.getHighestLevel();

  // Get weekly stats from leaderboard
  const weeklyLeaderboard = await userRepository.getLeaderboard(100, 'weekly');
  const messagesThisWeek = weeklyLeaderboard.reduce((acc, user) => acc + user.stats.messagesCount, 0);
  const voiceMinutesThisWeek = weeklyLeaderboard.reduce((acc, user) => acc + user.stats.voiceMinutes, 0);

  // Create and send embed
  const embed = createStatsEmbed(
    totalMembers,
    totalXP,
    activeBadges,
    topLevel,
    messagesThisWeek,
    voiceMinutesThisWeek
  );

  await interaction.editReply({ embeds: [embed] });
}
