import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { badgeService } from '../../services/badgeService';
import { createBadgeListEmbed, createErrorEmbed } from '../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('badges')
  .setDescription('Ver badges conquistadas')
  .addUserOption((option) =>
    option
      .setName('usuario')
      .setDescription('Usuario para ver as badges (opcional)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const targetUser = interaction.options.getUser('usuario') || interaction.user;
  const member = interaction.guild?.members.cache.get(targetUser.id);

  if (!member) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Usuario nao encontrado no servidor.')],
    });
    return;
  }

  // Get user badges
  const badges = await badgeService.getUserBadges(targetUser.id);

  // Get total badge count
  const totalBadges = await badgeService.getTotalBadgeCount();

  // Create and send embed
  const embed = createBadgeListEmbed(targetUser, badges, totalBadges);

  await interaction.editReply({ embeds: [embed] });
}
