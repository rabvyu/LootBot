import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { eventService } from '../../../services/eventService';
import { createSuccessEmbed, createErrorEmbed } from '../../../utils/embeds';
import { COLORS } from '../../../utils/constants';
import { formatNumber } from '../../../utils/helpers';
import { EventType } from '../../../database/models/Event';

export const data = new SlashCommandBuilder()
  .setName('event-manage')
  .setDescription('Gerenciar eventos do servidor (Admin)')
  .addSubcommand((sub) =>
    sub
      .setName('create-boost')
      .setDescription('Criar evento de boost (XP ou Moedas)')
      .addStringOption((opt) =>
        opt.setName('id').setDescription('ID unico do evento').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('nome').setDescription('Nome do evento').setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('tipo')
          .setDescription('Tipo de boost')
          .setRequired(true)
          .addChoices(
            { name: 'XP Boost', value: 'xp_boost' },
            { name: 'Coins Boost', value: 'coins_boost' },
            { name: 'Double Daily', value: 'double_daily' }
          )
      )
      .addNumberOption((opt) =>
        opt
          .setName('multiplicador')
          .setDescription('Multiplicador (ex: 1.5 = 50% bonus)')
          .setRequired(true)
          .setMinValue(1.1)
          .setMaxValue(5)
      )
      .addIntegerOption((opt) =>
        opt
          .setName('duracao')
          .setDescription('Duracao em horas')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(168)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('create-goal')
      .setDescription('Criar meta comunitaria')
      .addStringOption((opt) =>
        opt.setName('id').setDescription('ID unico do evento').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('nome').setDescription('Nome do evento').setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('tipo_meta')
          .setDescription('Tipo da meta')
          .setRequired(true)
          .addChoices(
            { name: 'Mensagens', value: 'messages' },
            { name: 'Minutos em Voz', value: 'voice_minutes' },
            { name: 'Reacoes', value: 'reactions' },
            { name: 'XP Total', value: 'total_xp' }
          )
      )
      .addIntegerOption((opt) =>
        opt.setName('meta').setDescription('Valor da meta').setRequired(true).setMinValue(100)
      )
      .addIntegerOption((opt) =>
        opt
          .setName('duracao')
          .setDescription('Duracao em dias')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(30)
      )
      .addIntegerOption((opt) =>
        opt.setName('recompensa_xp').setDescription('XP de recompensa').setRequired(false)
      )
      .addIntegerOption((opt) =>
        opt.setName('recompensa_coins').setDescription('Moedas de recompensa').setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('list')
      .setDescription('Listar todos os eventos')
  )
  .addSubcommand((sub) =>
    sub
      .setName('toggle')
      .setDescription('Ativar/desativar evento')
      .addStringOption((opt) =>
        opt.setName('id').setDescription('ID do evento').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('delete')
      .setDescription('Deletar evento')
      .addStringOption((opt) =>
        opt.setName('id').setDescription('ID do evento').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('info')
      .setDescription('Ver detalhes de um evento')
      .addStringOption((opt) =>
        opt.setName('id').setDescription('ID do evento').setRequired(true)
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'create-boost': {
      const id = interaction.options.getString('id', true);
      const name = interaction.options.getString('nome', true);
      const type = interaction.options.getString('tipo', true) as EventType;
      const multiplier = interaction.options.getNumber('multiplicador', true);
      const durationHours = interaction.options.getInteger('duracao', true);

      const existing = await eventService.getEvent(id);
      if (existing) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Erro', 'Ja existe um evento com este ID.')],
        });
        return;
      }

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

      await eventService.createEvent({
        id,
        name,
        description: `Evento de ${type === 'xp_boost' ? 'XP' : type === 'coins_boost' ? 'Moedas' : 'Daily'} com ${multiplier}x`,
        type,
        startDate,
        endDate,
        multiplier,
        createdBy: interaction.user.id,
      });

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Evento Criado!',
          `**${name}** criado com sucesso!\n\n` +
          `Tipo: ${type}\n` +
          `Multiplicador: ${multiplier}x\n` +
          `Duracao: ${durationHours} horas\n` +
          `Termina: <t:${Math.floor(endDate.getTime() / 1000)}:F>`
        )],
      });
      break;
    }

    case 'create-goal': {
      const id = interaction.options.getString('id', true);
      const name = interaction.options.getString('nome', true);
      const goalType = interaction.options.getString('tipo_meta', true) as 'messages' | 'voice_minutes' | 'reactions' | 'total_xp';
      const target = interaction.options.getInteger('meta', true);
      const xpReward = interaction.options.getInteger('recompensa_xp') || 0;
      const coinsReward = interaction.options.getInteger('recompensa_coins') || 0;
      const durationDays = interaction.options.getInteger('duracao', true);

      const existing = await eventService.getEvent(id);
      if (existing) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Erro', 'Ja existe um evento com este ID.')],
        });
        return;
      }

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const goalTypeNames: Record<string, string> = {
        messages: 'mensagens',
        voice_minutes: 'minutos em voz',
        reactions: 'reacoes',
        total_xp: 'XP total',
      };

      await eventService.createEvent({
        id,
        name,
        description: `Meta comunitaria: ${formatNumber(target)} ${goalTypeNames[goalType]}`,
        type: 'community_goal',
        startDate,
        endDate,
        goalType,
        goalTarget: target,
        goalReward: {
          xp: xpReward > 0 ? xpReward : undefined,
          coins: coinsReward > 0 ? coinsReward : undefined,
        },
        createdBy: interaction.user.id,
      });

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Meta Comunitaria Criada!',
          `**${name}** criada com sucesso!\n\n` +
          `Meta: ${formatNumber(target)} ${goalTypeNames[goalType]}\n` +
          `Recompensa: ${xpReward > 0 ? `${formatNumber(xpReward)} XP` : ''} ${coinsReward > 0 ? `${formatNumber(coinsReward)} 🪙` : ''}\n` +
          `Duracao: ${durationDays} dias\n` +
          `Termina: <t:${Math.floor(endDate.getTime() / 1000)}:F>`
        )],
      });
      break;
    }

    case 'list': {
      const events = await eventService.getAllEvents();

      if (events.length === 0) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Nenhum Evento', 'Nenhum evento cadastrado.')],
        });
        return;
      }

      const eventList = events.map((event) => {
        const status = event.active ? '✅' : '❌';
        const now = new Date();
        const isOngoing = event.startDate <= now && event.endDate >= now;
        const timeStatus = isOngoing ? '🟢 Em andamento' : event.startDate > now ? '🟡 Futuro' : '🔴 Encerrado';

        let info = `${status} **${event.name}** (\`${event.id}\`)\n`;
        info += `┗ ${event.type} | ${timeStatus}`;

        if (event.type === 'community_goal' && event.goalTarget) {
          const progress = ((event.goalProgress || 0) / event.goalTarget * 100).toFixed(1);
          info += ` | ${progress}%`;
        }

        return info;
      }).join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('📅 Eventos do Servidor')
        .setDescription(eventList)
        .setFooter({ text: `${events.length} evento(s)` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'toggle': {
      const id = interaction.options.getString('id', true);
      const event = await eventService.toggleEvent(id);

      if (!event) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Erro', 'Evento nao encontrado.')],
        });
        return;
      }

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          'Evento Atualizado',
          `**${event.name}** foi ${event.active ? 'ativado' : 'desativado'}.`
        )],
      });
      break;
    }

    case 'delete': {
      const id = interaction.options.getString('id', true);
      const deleted = await eventService.deleteEvent(id);

      if (deleted) {
        await interaction.editReply({
          embeds: [createSuccessEmbed('Evento Deletado', `Evento **${id}** foi deletado.`)],
        });
      } else {
        await interaction.editReply({
          embeds: [createErrorEmbed('Erro', 'Evento nao encontrado.')],
        });
      }
      break;
    }

    case 'info': {
      const id = interaction.options.getString('id', true);
      const event = await eventService.getEvent(id);

      if (!event) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Erro', 'Evento nao encontrado.')],
        });
        return;
      }

      const topContributors = await eventService.getTopContributors(id, 5);

      const embed = new EmbedBuilder()
        .setColor(event.active ? COLORS.SUCCESS : COLORS.ERROR)
        .setTitle(`📅 ${event.name}`)
        .setDescription(event.description)
        .addFields(
          { name: 'Status', value: event.active ? '✅ Ativo' : '❌ Inativo', inline: true },
          { name: 'Tipo', value: event.type, inline: true },
          { name: 'Participantes', value: `${event.participants?.length || 0}`, inline: true },
          { name: 'Inicio', value: `<t:${Math.floor(event.startDate.getTime() / 1000)}:F>`, inline: true },
          { name: 'Fim', value: `<t:${Math.floor(event.endDate.getTime() / 1000)}:F>`, inline: true },
        );

      if (event.multiplier) {
        embed.addFields({ name: 'Multiplicador', value: `${event.multiplier}x`, inline: true });
      }

      if (event.type === 'community_goal' && event.goalTarget) {
        const progress = (event.goalProgress || 0) / event.goalTarget * 100;
        embed.addFields(
          { name: 'Progresso', value: `${formatNumber(event.goalProgress || 0)} / ${formatNumber(event.goalTarget)} (${progress.toFixed(1)}%)`, inline: false }
        );
      }

      if (topContributors.length > 0) {
        const contributorList = topContributors.map((p, i) =>
          `${i + 1}. <@${p.discordId}> - ${formatNumber(p.contribution)}`
        ).join('\n');
        embed.addFields({ name: 'Top Contribuidores', value: contributorList, inline: false });
      }

      embed.setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      break;
    }
  }
}
