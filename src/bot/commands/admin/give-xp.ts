import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { xpService } from '../../../services/xpService';
import { createSuccessEmbed, createErrorEmbed } from '../../../utils/embeds';
import { formatNumber } from '../../../utils/helpers';

export const data = new SlashCommandBuilder()
  .setName('give-xp')
  .setDescription('Dar XP para um usuario (Admin)')
  .addUserOption((option) =>
    option
      .setName('usuario')
      .setDescription('Usuario para dar XP')
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName('quantidade')
      .setDescription('Quantidade de XP')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100000)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const targetUser = interaction.options.getUser('usuario', true);
  const amount = interaction.options.getInteger('quantidade', true);

  const member = interaction.guild?.members.cache.get(targetUser.id);

  if (!member) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Usuario nao encontrado no servidor.')],
    });
    return;
  }

  // Give XP
  await xpService.adminGiveXP(member, amount);

  // Create success embed
  const embed = createSuccessEmbed(
    'XP Adicionado',
    `${formatNumber(amount)} XP foi adicionado para ${targetUser}.`
  );

  await interaction.editReply({ embeds: [embed] });
}
