import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { xpService } from '../../services/xpService';
import { createDailyEmbed, createErrorEmbed } from '../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('daily')
  .setDescription('Coletar sua recompensa diaria');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const member = interaction.member;
  if (!member || !('guild' in member)) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Este comando so pode ser usado em um servidor.')],
    });
    return;
  }

  // Try to claim daily reward
  const result = await xpService.awardDaily(member as any);

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
}
