import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { configRepository } from '../../../database/repositories/configRepository';
import { createSuccessEmbed, createErrorEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('event')
  .setDescription('Gerenciar evento de XP multiplicado (Admin)')
  .addSubcommand((subcommand) =>
    subcommand
      .setName('start')
      .setDescription('Iniciar evento de XP')
      .addNumberOption((option) =>
        option
          .setName('multiplicador')
          .setDescription('Multiplicador de XP (padrao: 2)')
          .setRequired(false)
          .setMinValue(1.5)
          .setMaxValue(5)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('stop')
      .setDescription('Parar evento de XP')
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('status')
      .setDescription('Ver status do evento')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guild!.id;
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'start': {
      const multiplier = interaction.options.getNumber('multiplicador') || 2;

      await configRepository.startEvent(guildId, multiplier);

      const embed = createSuccessEmbed(
        'Evento Iniciado!',
        `O evento de XP foi iniciado com multiplicador **${multiplier}x**!\n\nTodos os membros receberao ${multiplier}x mais XP em todas as atividades.`
      );

      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'stop': {
      const config = await configRepository.findByGuildId(guildId);

      if (!config?.eventActive) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Sem Evento', 'Nao ha nenhum evento ativo no momento.')],
        });
        return;
      }

      await configRepository.stopEvent(guildId);

      const embed = createSuccessEmbed(
        'Evento Encerrado',
        'O evento de XP foi encerrado. O multiplicador voltou ao normal.'
      );

      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'status': {
      const config = await configRepository.findByGuildId(guildId);

      if (!config?.eventActive) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Sem Evento', 'Nao ha nenhum evento ativo no momento.')],
        });
        return;
      }

      const embed = createSuccessEmbed(
        'Evento Ativo',
        `Multiplicador atual: **${config.eventMultiplier}x**\n\nUse \`/event stop\` para encerrar o evento.`
      );

      await interaction.editReply({ embeds: [embed] });
      break;
    }
  }
}
