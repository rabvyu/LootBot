import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { economyService } from '../../../services/economyService';
import { userRepository } from '../../../database/repositories/userRepository';
import { createSuccessEmbed, createErrorEmbed } from '../../../utils/embeds';
import { formatNumber } from '../../../utils/helpers';

export const data = new SlashCommandBuilder()
  .setName('give-coins')
  .setDescription('Dar moedas a um usuario (Admin)')
  .addUserOption((option) =>
    option
      .setName('usuario')
      .setDescription('Usuario para receber moedas')
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName('quantidade')
      .setDescription('Quantidade de moedas')
      .setRequired(true)
      .setMinValue(1)
  )
  .addStringOption((option) =>
    option
      .setName('motivo')
      .setDescription('Motivo para dar moedas')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const targetUser = interaction.options.getUser('usuario', true);
  const amount = interaction.options.getInteger('quantidade', true);
  const reason = interaction.options.getString('motivo') || 'Admin give';

  // Ensure user exists
  await userRepository.findOrCreate(
    targetUser.id,
    targetUser.username,
    targetUser.globalName,
    targetUser.avatar
  );

  const newBalance = await economyService.adminGiveCoins(targetUser.id, amount, reason);

  await interaction.editReply({
    embeds: [createSuccessEmbed(
      'Moedas Adicionadas',
      `**${formatNumber(amount)} 🪙** adicionadas para ${targetUser}.\nNovo saldo: **${formatNumber(newBalance)} 🪙**\nMotivo: ${reason}`
    )],
  });
}
