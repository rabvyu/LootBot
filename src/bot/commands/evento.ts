import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ButtonInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { worldEventService } from '../../services/worldEventService';
import {
  formatTimeRemaining,
  EVENT_COLORS,
  getAllEventTemplates,
} from '../../data/worldEvents';

export const data = new SlashCommandBuilder()
  .setName('evento')
  .setDescription('Eventos Mundiais')
  .addSubcommand(sub =>
    sub
      .setName('atual')
      .setDescription('Ver o evento mundial ativo')
  )
  .addSubcommand(sub =>
    sub
      .setName('entrar')
      .setDescription('Participar do evento ativo')
  )
  .addSubcommand(sub =>
    sub
      .setName('agir')
      .setDescription('Realizar ação no evento')
  )
  .addSubcommand(sub =>
    sub
      .setName('ranking')
      .setDescription('Ver ranking do evento')
  )
  .addSubcommand(sub =>
    sub
      .setName('historico')
      .setDescription('Ver histórico de eventos')
  )
  .addSubcommandGroup(group =>
    group
      .setName('admin')
      .setDescription('Comandos administrativos de eventos')
      .addSubcommand(sub =>
        sub
          .setName('iniciar')
          .setDescription('Iniciar um evento')
          .addStringOption(opt =>
            opt
              .setName('template')
              .setDescription('Template do evento')
              .setRequired(true)
              .addChoices(
                { name: '👺 Invasão Goblin', value: 'goblin_invasion' },
                { name: '👿 Invasão Demoníaca', value: 'demon_invasion' },
                { name: '🐲 Dragão Ancião', value: 'ancient_dragon' },
                { name: '🌑 Titã do Vazio', value: 'void_titan' },
                { name: '🏴‍☠️ Tesouro dos Piratas', value: 'pirate_treasure' },
                { name: '⚡ XP Dobrado', value: 'double_xp_weekend' },
                { name: '☄️ Chuva de Meteoros', value: 'meteor_shower' }
              )
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('encerrar')
          .setDescription('Encerrar evento ativo')
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommandGroup = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();

  if (subcommandGroup === 'admin') {
    // Verificar permissão de admin
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Apenas administradores podem usar comandos de admin.',
        ephemeral: true,
      });
    }

    switch (subcommand) {
      case 'iniciar':
        return handleAdminStart(interaction);
      case 'encerrar':
        return handleAdminEnd(interaction);
    }
  }

  switch (subcommand) {
    case 'atual':
      return handleCurrent(interaction);
    case 'entrar':
      return handleJoin(interaction);
    case 'agir':
      return handleAction(interaction);
    case 'ranking':
      return handleRanking(interaction);
    case 'historico':
      return handleHistory(interaction);
    default:
      return handleCurrent(interaction);
  }
}

// ==================== HANDLERS ====================

async function handleCurrent(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const event = await worldEventService.getActiveEvent();

  if (!event) {
    const embed = new EmbedBuilder()
      .setTitle('🌍 Eventos Mundiais')
      .setColor(0x888888)
      .setDescription('Não há evento ativo no momento.\n\nFique de olho! Eventos podem começar a qualquer momento.')
      .setFooter({ text: 'Os administradores podem iniciar eventos a qualquer momento.' });

    return interaction.editReply({ embeds: [embed] });
  }

  const embed = createEventEmbed(event);

  // Botões de ação
  const joinBtn = new ButtonBuilder()
    .setCustomId('join_event')
    .setLabel('Participar')
    .setStyle(ButtonStyle.Success)
    .setEmoji('✅');

  const actionBtn = new ButtonBuilder()
    .setCustomId('action_event')
    .setLabel('Agir!')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('⚔️');

  const rankingBtn = new ButtonBuilder()
    .setCustomId('ranking_event')
    .setLabel('Ranking')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('🏆');

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(joinBtn, actionBtn, rankingBtn);

  const response = await interaction.editReply({
    embeds: [embed],
    components: [row],
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120000,
  });

  collector.on('collect', async (btnInteraction: ButtonInteraction) => {
    if (btnInteraction.customId === 'join_event') {
      const result = await worldEventService.joinEvent(btnInteraction.user.id);

      if (result.alreadyParticipating) {
        return btnInteraction.reply({ content: '✅ Você já está participando!', ephemeral: true });
      }

      return btnInteraction.reply({ content: result.message, ephemeral: true });
    }

    if (btnInteraction.customId === 'action_event') {
      const result = await worldEventService.performAction(btnInteraction.user.id, 'attack');

      const actionEmbed = new EmbedBuilder()
        .setTitle(result.success ? '⚔️ Ação Realizada!' : '❌ Falha')
        .setColor(result.success ? 0x00FF00 : 0xFF0000)
        .setDescription(result.message);

      if (result.contribution) {
        actionEmbed.addFields({
          name: '📊 Contribuição',
          value: `+${result.contribution}`,
          inline: true,
        });
      }

      return btnInteraction.reply({ embeds: [actionEmbed], ephemeral: true });
    }

    if (btnInteraction.customId === 'ranking_event') {
      const ranking = await worldEventService.getEventRanking(10);

      const rankEmbed = new EmbedBuilder()
        .setTitle('🏆 Ranking do Evento')
        .setColor(0xFFD700);

      if (ranking.length === 0) {
        rankEmbed.setDescription('Nenhum participante ainda.');
      } else {
        const rankText = ranking.map(r => {
          const medal = r.position <= 3 ? ['🥇', '🥈', '🥉'][r.position - 1] : `#${r.position}`;
          return `${medal} **${r.username}** - ${r.contribution.toLocaleString()} contrib.`;
        }).join('\n');

        rankEmbed.setDescription(rankText);
      }

      return btnInteraction.reply({ embeds: [rankEmbed], ephemeral: true });
    }
  });
}

async function handleJoin(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const result = await worldEventService.joinEvent(interaction.user.id);

  const embed = new EmbedBuilder()
    .setTitle(result.success ? '✅ Participação Confirmada!' : '❌ Erro')
    .setColor(result.success ? 0x00FF00 : 0xFF0000)
    .setDescription(result.message);

  if (result.event) {
    embed.addFields(
      { name: '🎮 Evento', value: `${result.event.emoji} ${result.event.name}`, inline: true },
      { name: '⏰ Termina em', value: formatTimeRemaining(result.event.scheduledEnd), inline: true }
    );
  }

  return interaction.editReply({ embeds: [embed] });
}

async function handleAction(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const result = await worldEventService.performAction(interaction.user.id, 'attack');

  const embed = new EmbedBuilder()
    .setTitle(result.success ? '⚔️ Ação Realizada!' : '❌ Falha')
    .setColor(result.success ? 0x00FF00 : 0xFF0000)
    .setDescription(result.message);

  if (result.contribution) {
    embed.addFields({
      name: '📊 Contribuição Ganha',
      value: `+${result.contribution.toLocaleString()}`,
      inline: true,
    });
  }

  if (result.damage) {
    embed.addFields({
      name: '⚔️ Dano Causado',
      value: result.damage.toLocaleString(),
      inline: true,
    });
  }

  if (result.eventCompleted) {
    embed.addFields({
      name: '🎉 EVENTO CONCLUÍDO!',
      value: 'Parabéns! O evento foi concluído. Recompensas serão distribuídas.',
      inline: false,
    });
  }

  return interaction.editReply({ embeds: [embed] });
}

async function handleRanking(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const ranking = await worldEventService.getEventRanking(15);

  if (ranking.length === 0) {
    return interaction.editReply({
      content: '❌ Não há evento ativo ou nenhum participante ainda.',
    });
  }

  const event = await worldEventService.getActiveEvent();

  const embed = new EmbedBuilder()
    .setTitle('🏆 Ranking do Evento')
    .setColor(0xFFD700)
    .setDescription(event ? `${event.emoji} **${event.name}**` : 'Evento Ativo');

  const rankText = ranking.map(r => {
    const medal = r.position <= 3 ? ['🥇', '🥈', '🥉'][r.position - 1] : `**#${r.position}**`;
    return `${medal} ${r.username} - ${r.contribution.toLocaleString()} contribuição`;
  }).join('\n');

  embed.addFields({
    name: 'Top 15',
    value: rankText,
    inline: false,
  });

  return interaction.editReply({ embeds: [embed] });
}

async function handleHistory(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const events = await worldEventService.getEventHistory(5);

  if (events.length === 0) {
    return interaction.editReply({
      content: '❌ Nenhum evento concluído ainda.',
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('📜 Histórico de Eventos')
    .setColor(0x3498DB);

  for (const event of events) {
    const endDate = event.actualEnd
      ? new Date(event.actualEnd).toLocaleDateString('pt-BR')
      : 'N/A';

    const topPlayer = event.topContributors[0];

    embed.addFields({
      name: `${event.emoji} ${event.name}`,
      value: `📅 ${endDate}\n👥 ${event.stats.totalParticipants} participantes\n🏆 Top: ${topPlayer?.username || 'N/A'}`,
      inline: true,
    });
  }

  return interaction.editReply({ embeds: [embed] });
}

// ==================== ADMIN HANDLERS ====================

async function handleAdminStart(interaction: ChatInputCommandInteraction) {
  const templateId = interaction.options.getString('template', true);

  await interaction.deferReply();

  const event = await worldEventService.adminCreateEvent(templateId);

  if (!event) {
    return interaction.editReply({
      content: '❌ Template de evento não encontrado.',
    });
  }

  const embed = createEventEmbed(event);
  embed.setAuthor({ name: '🎮 Evento Iniciado!' });

  return interaction.editReply({ embeds: [embed] });
}

async function handleAdminEnd(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const success = await worldEventService.adminEndEvent();

  if (!success) {
    return interaction.editReply({
      content: '❌ Não há evento ativo para encerrar.',
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('✅ Evento Encerrado')
    .setColor(0x00FF00)
    .setDescription('O evento foi encerrado e as recompensas foram distribuídas.');

  return interaction.editReply({ embeds: [embed] });
}

// ==================== HELPERS ====================

function createEventEmbed(event: any): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`${event.emoji} ${event.name}`)
    .setColor(EVENT_COLORS[event.type as keyof typeof EVENT_COLORS] || 0x3498DB)
    .setDescription(event.description);

  // Tempo restante
  embed.addFields({
    name: '⏰ Tempo Restante',
    value: formatTimeRemaining(event.scheduledEnd),
    inline: true,
  });

  // Participantes
  embed.addFields({
    name: '👥 Participantes',
    value: event.stats.totalParticipants.toString(),
    inline: true,
  });

  // Progresso
  embed.addFields({
    name: '📊 Progresso',
    value: `${event.stats.completionPercentage}%`,
    inline: true,
  });

  // Objetivos
  if (event.objectives.length > 0) {
    const objText = event.objectives.map((obj: any) => {
      const progress = Math.min(100, Math.floor((obj.current / obj.target) * 100));
      const status = obj.completed ? '✅' : '⬜';
      return `${status} ${obj.description}: ${obj.current.toLocaleString()}/${obj.target.toLocaleString()} (${progress}%)`;
    }).join('\n');

    embed.addFields({
      name: '🎯 Objetivos',
      value: objText,
      inline: false,
    });
  }

  // Info específica do tipo
  if (event.boss) {
    const hpPercent = Math.floor((event.boss.hp / event.boss.maxHp) * 100);
    embed.addFields({
      name: `👹 ${event.boss.name}`,
      value: `HP: ${event.boss.hp.toLocaleString()}/${event.boss.maxHp.toLocaleString()} (${hpPercent}%)`,
      inline: false,
    });
  }

  if (event.invasion) {
    embed.addFields({
      name: '🌊 Status da Invasão',
      value: `Wave ${event.invasion.currentWave}/${event.invasion.totalWaves}\nMonstros restantes: ${event.invasion.monstersRemaining}\nTotal derrotados: ${event.invasion.monstersDefeated}`,
      inline: false,
    });
  }

  if (event.treasureHunt) {
    embed.addFields({
      name: '🗺️ Caça ao Tesouro',
      value: `Tesouros encontrados: ${event.treasureHunt.foundTreasures}/${event.treasureHunt.totalTreasures}\n\n*"${event.treasureHunt.clues[event.treasureHunt.currentClue]}"*`,
      inline: false,
    });
  }

  // Recompensas globais
  if (event.globalRewards.length > 0) {
    const rewardText = event.globalRewards.map((r: any) => {
      const icons: Record<string, string> = {
        coins: '💰',
        xp: '⚡',
        material: '📦',
        equipment: '⚔️',
        title: '🏷️',
      };
      return `${icons[r.type] || '🎁'} ${r.quantity}${r.itemId ? ` ${r.itemId}` : ` ${r.type}`}`;
    }).join(' | ');

    embed.addFields({
      name: '🎁 Recompensas (para todos)',
      value: rewardText,
      inline: false,
    });
  }

  embed.setFooter({ text: `Nível mínimo: ${event.minLevel} | Use /evento agir para participar` });

  return embed;
}
