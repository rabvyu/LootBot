import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { xpService } from '../../services/xpService';
import { badgeService } from '../../services/badgeService';
import { createDailyEmbed, createErrorEmbed } from '../../utils/embeds';
import { logger } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('daily')
  .setDescription('Coletar sua recompensa diaria');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const member = interaction.member as GuildMember;
  if (!member || !member.guild) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Este comando so pode ser usado em um servidor.')],
    });
    return;
  }

  // Try to claim daily reward
  const result = await xpService.awardDaily(member);

  if (!result) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Ja Coletado', 'Voce ja coletou sua recompensa diaria hoje! Volte amanha.')],
    });
    return;
  }

  // Create and send embed
  const embed = createDailyEmbed(
    interaction.user,
    result.xpGained,
    result.newStreak,
    result.streakBonus
  );

  await interaction.editReply({ embeds: [embed] });

  // Check for badges after daily claim (time badges, streak badges, etc)
  try {
    const earnedBadges = await badgeService.checkAllBadges(member);
    if (earnedBadges.length > 0) {
      logger.info(`User ${member.id} earned ${earnedBadges.length} badges after daily: ${earnedBadges.map(b => b.name).join(', ')}`);
    }
  } catch (error) {
    logger.error('Error checking badges after daily:', error);
  }
}
