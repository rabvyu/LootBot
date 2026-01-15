import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { levelRoleService } from '../../../services/levelRoleService';
import { createSuccessEmbed, createErrorEmbed } from '../../../utils/embeds';
import { COLORS } from '../../../utils/constants';

export const data = new SlashCommandBuilder()
  .setName('level-roles')
  .setDescription('Configurar cargos automaticos por nivel (Admin)')
  .addSubcommand((subcommand) =>
    subcommand
      .setName('add')
      .setDescription('Adicionar cargo para um nivel')
      .addRoleOption((option) =>
        option
          .setName('cargo')
          .setDescription('Cargo a ser dado automaticamente')
          .setRequired(true)
      )
      .addIntegerOption((option) =>
        option
          .setName('nivel')
          .setDescription('Nivel necessario para receber o cargo')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(200)
      )
      .addBooleanOption((option) =>
        option
          .setName('remover_anterior')
          .setDescription('Remover este cargo quando receber um de nivel mais alto? (padrao: sim)')
          .setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('remove')
      .setDescription('Remover configuracao de cargo')
      .addRoleOption((option) =>
        option
          .setName('cargo')
          .setDescription('Cargo a remover da configuracao')
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('list')
      .setDescription('Ver todos os cargos por nivel configurados')
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('sync')
      .setDescription('Sincronizar cargos de todos os membros (pode demorar)')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guild!.id;
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'add': {
      const role = interaction.options.getRole('cargo', true);
      const level = interaction.options.getInteger('nivel', true);
      const removeOnHigher = interaction.options.getBoolean('remover_anterior') ?? true;

      // Check if bot can manage this role
      const botMember = interaction.guild!.members.me;
      if (!botMember) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Erro', 'Nao foi possivel verificar permissoes do bot.')],
        });
        return;
      }

      if (role.position >= botMember.roles.highest.position) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Erro', 'Este cargo esta acima do cargo do bot. Mova o cargo do bot para cima.')],
        });
        return;
      }

      if (role.managed) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Erro', 'Este cargo e gerenciado por uma integracao e nao pode ser atribuido.')],
        });
        return;
      }

      try {
        await levelRoleService.addLevelRole(guildId, role.id, level, removeOnHigher);

        const embed = createSuccessEmbed(
          'Cargo Configurado',
          `${role} sera dado automaticamente ao atingir **Level ${level}**.\n` +
          `Remover ao ganhar cargo superior: ${removeOnHigher ? 'Sim' : 'Nao'}`
        );

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        await interaction.editReply({
          embeds: [createErrorEmbed('Erro', message)],
        });
      }
      break;
    }

    case 'remove': {
      const role = interaction.options.getRole('cargo', true);

      const removed = await levelRoleService.removeLevelRole(guildId, role.id);

      if (removed) {
        await interaction.editReply({
          embeds: [createSuccessEmbed('Cargo Removido', `${role} foi removido da configuracao de cargos por nivel.`)],
        });
      } else {
        await interaction.editReply({
          embeds: [createErrorEmbed('Erro', 'Este cargo nao esta configurado.')],
        });
      }
      break;
    }

    case 'list': {
      const levelRoles = await levelRoleService.getLevelRoles(guildId);

      if (levelRoles.length === 0) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Nenhum Cargo', 'Nenhum cargo por nivel configurado.\nUse `/level-roles add` para adicionar.')],
        });
        return;
      }

      const description = levelRoles
        .map((lr) => {
          const role = interaction.guild!.roles.cache.get(lr.roleId);
          const roleName = role ? `<@&${lr.roleId}>` : `[Cargo Deletado: ${lr.roleId}]`;
          const removeFlag = lr.removeOnHigher ? '' : ' (mantido)';
          return `**Level ${lr.requiredLevel}:** ${roleName}${removeFlag}`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('Cargos por Nivel')
        .setDescription(description)
        .setFooter({ text: `${levelRoles.length} cargo(s) configurado(s)` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'sync': {
      const { userRepository } = await import('../../../database/repositories/userRepository');

      // Get all users with their levels
      const users = await userRepository.getAllUsers();
      const memberLevels = new Map<string, number>();

      for (const user of users) {
        memberLevels.set(user.discordId, user.level);
      }

      // Fetch all guild members
      await interaction.guild!.members.fetch();

      const result = await levelRoleService.syncAllMembers(
        interaction.guild!,
        memberLevels
      );

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Sincronizacao Completa',
          `**${result.synced}** membro(s) sincronizado(s).\n` +
          (result.errors > 0 ? `**${result.errors}** erro(s) durante a sincronizacao.` : '')
        )],
      });
      break;
    }
  }
}
