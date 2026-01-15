import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { userRepository } from '../../../database/repositories/userRepository';
import { createSuccessEmbed, createErrorEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('reset-user')
  .setDescription('Resetar todo o progresso de um usuario (Admin)')
  .addUserOption((option) =>
    option
      .setName('usuario')
      .setDescription('Usuario para resetar')
      .setRequired(true)
  )
  .addBooleanOption((option) =>
    option
      .setName('confirmar')
      .setDescription('Confirmar reset (esta acao e irreversivel)')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const targetUser = interaction.options.getUser('usuario', true);
  const confirmed = interaction.options.getBoolean('confirmar', true);

  if (!confirmed) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Cancelado', 'Voce precisa confirmar o reset marcando "confirmar" como true.')],
    });
    return;
  }

  // Reset user
  const user = await userRepository.resetUser(targetUser.id);

  if (!user) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Usuario nao encontrado no banco de dados.')],
    });
    return;
  }

  // Create success embed
  const embed = createSuccessEmbed(
    'Usuario Resetado',
    `Todo o progresso de ${targetUser} foi resetado.\n\n- XP: 0\n- Level: 1\n- Badges: 0\n- Estatisticas: Zeradas`
  );

  await interaction.editReply({ embeds: [embed] });
}
