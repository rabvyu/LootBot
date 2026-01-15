import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { badgeService } from '../../../services/badgeService';
import { createSuccessEmbed, createErrorEmbed } from '../../../utils/embeds';
import { COLORS } from '../../../utils/constants';
import { logger } from '../../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('check-badges')
  .setDescription('Verificar e conceder badges pendentes (Admin)')
  .addSubcommand((subcommand) =>
    subcommand
      .setName('user')
      .setDescription('Verificar badges de um usuario especifico')
      .addUserOption((option) =>
        option
          .setName('usuario')
          .setDescription('Usuario para verificar')
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('all')
      .setDescription('Verificar badges de TODOS os usuarios (pode demorar)')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'user') {
    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser('usuario', true);
    const member = await interaction.guild!.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Usuario nao encontrado no servidor.')],
      });
      return;
    }

    try {
      const earnedBadges = await badgeService.checkAllBadges(member);

      if (earnedBadges.length === 0) {
        await interaction.editReply({
          embeds: [createSuccessEmbed('Verificacao Completa', `${targetUser} nao tinha badges pendentes para receber.`)],
        });
      } else {
        const badgeList = earnedBadges.map((b) => `${b.icon} **${b.name}** (${b.rarity})`).join('\n');
        const embed = new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle('Badges Concedidas!')
          .setDescription(`${targetUser} recebeu ${earnedBadges.length} badge(s):\n\n${badgeList}`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      logger.error('Error checking badges for user:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Erro ao verificar badges do usuario.')],
      });
    }
  } else if (subcommand === 'all') {
    await interaction.deferReply({ ephemeral: true });

    try {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.WARNING)
            .setTitle('Verificando Badges...')
            .setDescription('Verificando badges de todos os usuarios. Isso pode demorar alguns minutos...')
            .setTimestamp(),
        ],
      });

      const results = await badgeService.checkAllUsersInGuild(interaction.client, interaction.guild!.id);

      const totalBadges = results.reduce((acc, r) => acc + r.badges.length, 0);

      if (totalBadges === 0) {
        await interaction.editReply({
          embeds: [createSuccessEmbed('Verificacao Completa', 'Nenhum usuario tinha badges pendentes.')],
        });
      } else {
        // Build summary
        const summaryLines: string[] = [];
        for (const result of results.slice(0, 10)) {
          const badgeNames = result.badges.map((b) => b.icon).join(' ');
          summaryLines.push(`<@${result.userId}>: ${badgeNames}`);
        }

        if (results.length > 10) {
          summaryLines.push(`... e mais ${results.length - 10} usuarios`);
        }

        const embed = new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle('Verificacao Completa!')
          .setDescription(
            `**${totalBadges}** badges foram concedidas para **${results.length}** usuarios.\n\n` +
              summaryLines.join('\n')
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      logger.error('Error checking all badges:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Erro', 'Erro ao verificar badges.')],
      });
    }
  }
}
