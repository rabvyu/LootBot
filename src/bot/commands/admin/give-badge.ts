import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { badgeService } from '../../../services/badgeService';
import { badgeRepository } from '../../../database/repositories/badgeRepository';
import { createSuccessEmbed, createErrorEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('give-badge')
  .setDescription('Dar uma badge para um usuario (Admin)')
  .addUserOption((option) =>
    option
      .setName('usuario')
      .setDescription('Usuario para dar a badge')
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('badge')
      .setDescription('ID da badge')
      .setRequired(true)
      .setAutocomplete(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const targetUser = interaction.options.getUser('usuario', true);
  const badgeId = interaction.options.getString('badge', true);

  const member = interaction.guild?.members.cache.get(targetUser.id);

  if (!member) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Usuario nao encontrado no servidor.')],
    });
    return;
  }

  // Check if badge exists
  const badge = await badgeRepository.findById(badgeId);
  if (!badge) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', `Badge "${badgeId}" nao encontrada.`)],
    });
    return;
  }

  // Give badge
  const awarded = await badgeService.awardBadge(member, badgeId);

  if (!awarded) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', `${targetUser} ja possui a badge "${badge.name}".`)],
    });
    return;
  }

  // Create success embed
  const embed = createSuccessEmbed(
    'Badge Concedida',
    `A badge ${badge.icon} **${badge.name}** foi concedida para ${targetUser}.`
  );

  await interaction.editReply({ embeds: [embed] });
}
