import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { xpService } from '../../../services/xpService';
import { createSuccessEmbed, createErrorEmbed } from '../../../utils/embeds';
import { formatNumber } from '../../../utils/helpers';

export const data = new SlashCommandBuilder()
  .setName('remove-xp')
  .setDescription('Remover XP de um usuario (Admin) - Use para punicoes')
  .addUserOption((option) =>
    option
      .setName('usuario')
      .setDescription('Usuario para remover XP')
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName('quantidade')
      .setDescription('Quantidade de XP a remover')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100000)
  )
  .addStringOption((option) =>
    option
      .setName('motivo')
      .setDescription('Motivo da punicao (opcional)')
      .setRequired(false)
      .setMaxLength(200)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const targetUser = interaction.options.getUser('usuario', true);
  const amount = interaction.options.getInteger('quantidade', true);
  const motivo = interaction.options.getString('motivo');

  const member = interaction.guild?.members.cache.get(targetUser.id);

  if (!member) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Usuario nao encontrado no servidor.')],
    });
    return;
  }

  try {
    // Remove XP
    const actualRemoved = await xpService.adminRemoveXP(member, amount);

    // Create success message
    let message = `**${formatNumber(actualRemoved)} XP** foi removido de ${targetUser}.`;
    if (motivo) {
      message += `\n\n**Motivo:** ${motivo}`;
    }

    // Create success embed
    const embed = createSuccessEmbed('⚠️ XP Removido (Punição)', message);

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Usuario nao encontrado no banco de dados.')],
    });
  }
}
