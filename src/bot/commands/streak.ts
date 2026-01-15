import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { userRepository } from '../../database/repositories/userRepository';
import { XP_CONFIG } from '../../utils/constants';
import { createStreakEmbed, createErrorEmbed } from '../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('streak')
  .setDescription('Ver seu streak atual')
  .addUserOption((option) =>
    option
      .setName('usuario')
      .setDescription('Usuario para ver o streak (opcional)')
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

  // Calculate next reward (base + streak bonus)
  const nextReward = XP_CONFIG.DAILY_CHECK_IN_XP + (userData.stats.currentStreak * XP_CONFIG.STREAK_BONUS_XP);

  // Create and send embed
  const embed = createStreakEmbed(
    targetUser,
    userData.stats.currentStreak,
    userData.stats.longestStreak,
    nextReward
  );

  await interaction.editReply({ embeds: [embed] });
}
