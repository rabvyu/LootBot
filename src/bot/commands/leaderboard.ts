import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { userRepository } from '../../database/repositories/userRepository';
import { createLeaderboardEmbed } from '../../utils/embeds';
import { LeaderboardPeriod, LeaderboardEntry } from '../../types';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Ver o ranking do servidor')
  .addStringOption((option) =>
    option
      .setName('periodo')
      .setDescription('Periodo do ranking')
      .setRequired(false)
      .addChoices(
        { name: 'Hoje', value: 'daily' },
        { name: 'Esta Semana', value: 'weekly' },
        { name: 'Este Mes', value: 'monthly' },
        { name: 'Geral', value: 'alltime' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const period = (interaction.options.getString('periodo') || 'alltime') as LeaderboardPeriod;

  // Get leaderboard data
  const users = await userRepository.getLeaderboard(10, period);

  // Transform to leaderboard entries
  const entries: LeaderboardEntry[] = users.map((user, index) => ({
    rank: index + 1,
    discordId: user.discordId,
    username: user.username,
    globalName: user.globalName,
    avatar: user.avatar,
    xp: period === 'alltime' ? user.totalXP : user.dailyXP.total,
    level: user.level,
    badges: user.badges,
  }));

  // Create and send embed
  const embed = createLeaderboardEmbed(entries, period);

  await interaction.editReply({ embeds: [embed] });
}
