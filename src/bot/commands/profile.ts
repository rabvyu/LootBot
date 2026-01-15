import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { userRepository } from '../../database/repositories/userRepository';
import { badgeService } from '../../services/badgeService';
import { levelService } from '../../services/levelService';
import { createProfileEmbed, createErrorEmbed } from '../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Ver perfil completo')
  .addUserOption((option) =>
    option
      .setName('usuario')
      .setDescription('Usuario para ver o perfil (opcional)')
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

  // Get or create user data
  const userData = await userRepository.findOrCreate(
    targetUser.id,
    targetUser.username,
    targetUser.globalName,
    targetUser.avatar
  );

  // Get rank
  const rank = await userRepository.getRank(targetUser.id);

  // Get badges
  const badges = await badgeService.getUserBadges(targetUser.id);

  // Get XP needed and progress
  const xpNeeded = levelService.getXPNeeded(userData.totalXP, userData.level);
  const progress = levelService.getProgress(userData.totalXP, userData.level);

  // Create and send embed
  const embed = createProfileEmbed(targetUser, userData, rank, badges, xpNeeded, progress);

  await interaction.editReply({ embeds: [embed] });
}
