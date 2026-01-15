import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
} from 'discord.js';
import { economyService, ECONOMY_CONFIG } from '../../services/economyService';
import { userRepository } from '../../database/repositories/userRepository';
import { createErrorEmbed } from '../../utils/embeds';
import { COLORS } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';

export const data = new SlashCommandBuilder()
  .setName('transferir')
  .setDescription('Transferir moedas para outro usuario')
  .addUserOption((option) =>
    option
      .setName('usuario')
      .setDescription('Usuario para receber as moedas')
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName('quantidade')
      .setDescription('Quantidade de moedas para transferir')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(ECONOMY_CONFIG.MAX_TRANSFER_AMOUNT)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const targetUser = interaction.options.getUser('usuario', true);
  const amount = interaction.options.getInteger('quantidade', true);
  const fromMember = interaction.member as GuildMember;

  if (!fromMember) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Este comando so pode ser usado em um servidor.')],
    });
    return;
  }

  // Check if target is a bot
  if (targetUser.bot) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Voce nao pode transferir moedas para um bot.')],
    });
    return;
  }

  // Ensure target user exists in database
  await userRepository.findOrCreate(
    targetUser.id,
    targetUser.username,
    targetUser.globalName,
    targetUser.avatar
  );

  // Get target member
  const toMember = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);
  if (!toMember) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Usuario nao encontrado no servidor.')],
    });
    return;
  }

  // Process transfer
  const result = await economyService.transferCoins(fromMember, toMember, amount);

  if (result.success) {
    const taxPercent = Math.round(ECONOMY_CONFIG.TRANSFER_TAX_RATE * 100);
    const netAmount = amount - (result.tax || 0);

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('✅ Transferencia Realizada!')
      .setDescription(`${interaction.user} transferiu **${formatNumber(netAmount)} 🪙** para ${targetUser}!`)
      .addFields(
        { name: 'Valor Enviado', value: `${formatNumber(amount)} 🪙`, inline: true },
        { name: `Taxa (${taxPercent}%)`, value: `${formatNumber(result.tax || 0)} 🪙`, inline: true },
        { name: 'Valor Recebido', value: `${formatNumber(netAmount)} 🪙`, inline: true },
        { name: 'Seu Novo Saldo', value: `${formatNumber(result.fromBalance || 0)} 🪙`, inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } else {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro na Transferencia', result.message)],
    });
  }
}
