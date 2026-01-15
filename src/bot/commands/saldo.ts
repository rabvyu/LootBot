import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { economyService } from '../../services/economyService';
import { userRepository } from '../../database/repositories/userRepository';
import { createErrorEmbed } from '../../utils/embeds';
import { COLORS } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';

export const data = new SlashCommandBuilder()
  .setName('saldo')
  .setDescription('Ver seu saldo de moedas')
  .addUserOption((option) =>
    option
      .setName('usuario')
      .setDescription('Usuario para ver o saldo (opcional)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const targetUser = interaction.options.getUser('usuario') || interaction.user;

  // Ensure user exists in database
  await userRepository.findOrCreate(
    targetUser.id,
    targetUser.username,
    targetUser.globalName,
    targetUser.avatar
  );

  const balance = await economyService.getBalance(targetUser.id);
  const tickets = await economyService.getLotteryTickets(targetUser.id);

  const embed = new EmbedBuilder()
    .setColor(COLORS.XP)
    .setAuthor({
      name: targetUser.globalName || targetUser.username,
      iconURL: targetUser.displayAvatarURL(),
    })
    .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
    .addFields(
      { name: '🪙 Moedas', value: formatNumber(balance), inline: true },
      { name: '🎫 Tickets Loteria', value: `${tickets}`, inline: true },
    )
    .setFooter({ text: 'Use /loja para ver itens disponiveis!' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
