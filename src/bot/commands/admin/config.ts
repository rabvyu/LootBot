import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';
import { configRepository } from '../../../database/repositories/configRepository';
import { createSuccessEmbed, createErrorEmbed } from '../../../utils/embeds';
import { COLORS } from '../../../utils/constants';

export const data = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Configurar o bot (Admin)')
  .addSubcommand((subcommand) =>
    subcommand
      .setName('view')
      .setDescription('Ver configuracoes atuais')
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('levelup-channel')
      .setDescription('Definir canal de level up')
      .addChannelOption((option) =>
        option
          .setName('canal')
          .setDescription('Canal para anuncios de level up (deixe vazio para desativar)')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('log-channel')
      .setDescription('Definir canal de logs')
      .addChannelOption((option) =>
        option
          .setName('canal')
          .setDescription('Canal para logs (deixe vazio para desativar)')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('badge-channel')
      .setDescription('Definir canal de noticias de badges raras+')
      .addChannelOption((option) =>
        option
          .setName('canal')
          .setDescription('Canal para noticias de badges (rare, epic, legendary)')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('blacklist-channel')
      .setDescription('Adicionar/remover canal da blacklist de XP')
      .addChannelOption((option) =>
        option
          .setName('canal')
          .setDescription('Canal para blacklist')
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice)
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName('acao')
          .setDescription('Adicionar ou remover')
          .setRequired(true)
          .addChoices(
            { name: 'Adicionar', value: 'add' },
            { name: 'Remover', value: 'remove' }
          )
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('blacklist-role')
      .setDescription('Adicionar/remover cargo da blacklist de XP')
      .addRoleOption((option) =>
        option
          .setName('cargo')
          .setDescription('Cargo para blacklist')
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName('acao')
          .setDescription('Adicionar ou remover')
          .setRequired(true)
          .addChoices(
            { name: 'Adicionar', value: 'add' },
            { name: 'Remover', value: 'remove' }
          )
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guild!.id;
  const subcommand = interaction.options.getSubcommand();

  // Get or create config
  const config = await configRepository.findOrCreate(guildId);

  switch (subcommand) {
    case 'view': {
      const levelUpChannel = config.levelUpChannel
        ? `<#${config.levelUpChannel}>`
        : 'Nao definido';
      const logChannel = config.logChannel
        ? `<#${config.logChannel}>`
        : 'Nao definido';
      const badgeChannel = config.badgeNotificationChannel
        ? `<#${config.badgeNotificationChannel}>`
        : 'Nao definido';
      const blacklistChannels = config.xpBlacklistChannels.length > 0
        ? config.xpBlacklistChannels.map((id) => `<#${id}>`).join(', ')
        : 'Nenhum';
      const blacklistRoles = config.xpBlacklistRoles.length > 0
        ? config.xpBlacklistRoles.map((id) => `<@&${id}>`).join(', ')
        : 'Nenhum';

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('Configuracoes do Bot')
        .addFields(
          { name: 'Canal de Level Up', value: levelUpChannel, inline: true },
          { name: 'Canal de Logs', value: logChannel, inline: true },
          { name: 'Canal de Badges', value: badgeChannel, inline: true },
          { name: 'Evento Ativo', value: config.eventActive ? `Sim (${config.eventMultiplier}x)` : 'Nao', inline: true },
          { name: 'Canais Blacklist', value: blacklistChannels, inline: false },
          { name: 'Cargos Blacklist', value: blacklistRoles, inline: false },
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'levelup-channel': {
      const channel = interaction.options.getChannel('canal');
      await configRepository.setLevelUpChannel(guildId, channel?.id || null);

      const message = channel
        ? `Canal de level up definido para ${channel}.`
        : 'Canal de level up desativado.';

      await interaction.editReply({
        embeds: [createSuccessEmbed('Configuracao Atualizada', message)],
      });
      break;
    }

    case 'log-channel': {
      const channel = interaction.options.getChannel('canal');
      await configRepository.setLogChannel(guildId, channel?.id || null);

      const message = channel
        ? `Canal de logs definido para ${channel}.`
        : 'Canal de logs desativado.';

      await interaction.editReply({
        embeds: [createSuccessEmbed('Configuracao Atualizada', message)],
      });
      break;
    }

    case 'badge-channel': {
      const channel = interaction.options.getChannel('canal');
      await configRepository.setBadgeNotificationChannel(guildId, channel?.id || null);

      const message = channel
        ? `Canal de noticias de badges definido para ${channel}.\nBadges **Rare**, **Epic** e **Legendary** serao anunciadas neste canal.`
        : 'Canal de noticias de badges desativado.';

      await interaction.editReply({
        embeds: [createSuccessEmbed('Configuracao Atualizada', message)],
      });
      break;
    }

    case 'blacklist-channel': {
      const channel = interaction.options.getChannel('canal', true);
      const action = interaction.options.getString('acao', true);

      if (action === 'add') {
        await configRepository.addBlacklistChannel(guildId, channel.id);
        await interaction.editReply({
          embeds: [createSuccessEmbed('Blacklist Atualizada', `${channel} foi adicionado a blacklist de XP.`)],
        });
      } else {
        await configRepository.removeBlacklistChannel(guildId, channel.id);
        await interaction.editReply({
          embeds: [createSuccessEmbed('Blacklist Atualizada', `${channel} foi removido da blacklist de XP.`)],
        });
      }
      break;
    }

    case 'blacklist-role': {
      const role = interaction.options.getRole('cargo', true);
      const action = interaction.options.getString('acao', true);

      if (action === 'add') {
        await configRepository.addBlacklistRole(guildId, role.id);
        await interaction.editReply({
          embeds: [createSuccessEmbed('Blacklist Atualizada', `${role} foi adicionado a blacklist de XP.`)],
        });
      } else {
        await configRepository.removeBlacklistRole(guildId, role.id);
        await interaction.editReply({
          embeds: [createSuccessEmbed('Blacklist Atualizada', `${role} foi removido da blacklist de XP.`)],
        });
      }
      break;
    }
  }
}
