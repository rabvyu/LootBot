import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { tournamentService } from '../../services/tournamentService';
import { TournamentType } from '../../database/models/Tournament';
import { COLORS } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';

const TYPE_NAMES: Record<TournamentType, string> = {
  pvp: 'PvP (Duelos)',
  fishing: 'Pesca',
  mining: 'Mineracao',
  crafting: 'Crafting',
  xp: 'XP',
};

const TYPE_EMOJIS: Record<TournamentType, string> = {
  pvp: '⚔️',
  fishing: '🎣',
  mining: '⛏️',
  crafting: '🔨',
  xp: '✨',
};

export const data = new SlashCommandBuilder()
  .setName('torneio')
  .setDescription('Sistema de Torneios - Compita contra outros jogadores!')
  .addSubcommand(sub =>
    sub
      .setName('criar')
      .setDescription('[ADMIN] Criar um novo torneio')
      .addStringOption(opt =>
        opt
          .setName('nome')
          .setDescription('Nome do torneio')
          .setRequired(true)
          .setMaxLength(50)
      )
      .addStringOption(opt =>
        opt
          .setName('tipo')
          .setDescription('Tipo de torneio')
          .setRequired(true)
          .addChoices(
            { name: '⚔️ PvP (Duelos)', value: 'pvp' },
            { name: '🎣 Pesca', value: 'fishing' },
            { name: '⛏️ Mineracao', value: 'mining' },
            { name: '🔨 Crafting', value: 'crafting' },
            { name: '✨ XP Race', value: 'xp' }
          )
      )
      .addIntegerOption(opt =>
        opt
          .setName('max_participantes')
          .setDescription('Maximo de participantes (4-64)')
          .setMinValue(4)
          .setMaxValue(64)
      )
      .addIntegerOption(opt =>
        opt
          .setName('taxa_entrada')
          .setDescription('Taxa de entrada em coins (0 = gratis)')
          .setMinValue(0)
          .setMaxValue(10000)
      )
      .addIntegerOption(opt =>
        opt
          .setName('tempo_inscricao')
          .setDescription('Tempo para inscricoes em minutos (30-1440)')
          .setMinValue(30)
          .setMaxValue(1440)
      )
      .addStringOption(opt =>
        opt.setName('descricao').setDescription('Descricao do torneio')
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('iniciar')
      .setDescription('[ADMIN] Iniciar o torneio (fechar inscricoes)')
  )
  .addSubcommand(sub =>
    sub
      .setName('cancelar')
      .setDescription('[ADMIN] Cancelar o torneio atual')
  )
  .addSubcommand(sub =>
    sub
      .setName('resultado')
      .setDescription('[ADMIN] Registrar resultado de uma partida')
      .addStringOption(opt =>
        opt.setName('match_id').setDescription('ID da partida').setRequired(true)
      )
      .addUserOption(opt =>
        opt.setName('vencedor').setDescription('Usuario vencedor').setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('entrar')
      .setDescription('Inscrever-se no torneio')
  )
  .addSubcommand(sub =>
    sub
      .setName('sair')
      .setDescription('Cancelar inscricao no torneio')
  )
  .addSubcommand(sub =>
    sub
      .setName('info')
      .setDescription('Ver informacoes do torneio atual')
  )
  .addSubcommand(sub =>
    sub
      .setName('bracket')
      .setDescription('Ver chaveamento do torneio')
  )
  .addSubcommand(sub =>
    sub
      .setName('partidas')
      .setDescription('Ver partidas da rodada atual')
  )
  .addSubcommand(sub =>
    sub
      .setName('stats')
      .setDescription('Ver suas estatisticas de torneio')
      .addUserOption(opt =>
        opt.setName('usuario').setDescription('Usuario para ver stats')
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('historico')
      .setDescription('Ver historico de torneios')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'criar':
      await handleCreate(interaction);
      break;
    case 'iniciar':
      await handleStart(interaction);
      break;
    case 'cancelar':
      await handleCancel(interaction);
      break;
    case 'resultado':
      await handleResult(interaction);
      break;
    case 'entrar':
      await handleJoin(interaction);
      break;
    case 'sair':
      await handleLeave(interaction);
      break;
    case 'info':
      await handleInfo(interaction);
      break;
    case 'bracket':
      await handleBracket(interaction);
      break;
    case 'partidas':
      await handleMatches(interaction);
      break;
    case 'stats':
      await handleStats(interaction);
      break;
    case 'historico':
      await handleHistory(interaction);
      break;
  }
}

async function handleCreate(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: 'Voce precisa de permissao de Gerenciar Servidor para criar torneios!',
      ephemeral: true,
    });
    return;
  }

  const name = interaction.options.getString('nome', true);
  const type = interaction.options.getString('tipo', true) as TournamentType;
  const maxParticipants = interaction.options.getInteger('max_participantes') || 16;
  const entryFee = interaction.options.getInteger('taxa_entrada') || 0;
  const registrationMinutes = interaction.options.getInteger('tempo_inscricao') || 60;
  const description = interaction.options.getString('descricao') || '';

  const result = await tournamentService.createTournament({
    name,
    description,
    type,
    guildId: interaction.guildId!,
    channelId: interaction.channelId,
    createdBy: interaction.user.id,
    maxParticipants,
    entryFee,
    registrationMinutes,
  });

  if (!result.success) {
    await interaction.reply({ content: result.message, ephemeral: true });
    return;
  }

  const tournament = result.tournament!;
  const emoji = TYPE_EMOJIS[type];
  const typeName = TYPE_NAMES[type];

  const embed = new EmbedBuilder()
    .setTitle(`${emoji} Torneio: ${name}`)
    .setDescription(description || 'Um novo torneio foi criado!')
    .setColor(COLORS.PRIMARY)
    .addFields(
      { name: '🎯 Tipo', value: typeName, inline: true },
      { name: '👥 Vagas', value: `0/${maxParticipants}`, inline: true },
      { name: '💰 Taxa de Entrada', value: entryFee > 0 ? `${formatNumber(entryFee)} coins` : 'Gratis!', inline: true },
      { name: '⏰ Inscricoes ate', value: `<t:${Math.floor(tournament.registrationEndsAt.getTime() / 1000)}:R>`, inline: true },
    )
    .setFooter({ text: 'Use /torneio entrar para participar!' });

  // Add rewards info
  const { rewards } = tournament;
  embed.addFields({
    name: '🏆 Premios',
    value: [
      `🥇 1o: ${formatNumber(rewards.first.coins)} coins + ${formatNumber(rewards.first.xp)} XP`,
      `🥈 2o: ${formatNumber(rewards.second.coins)} coins + ${formatNumber(rewards.second.xp)} XP`,
      `🥉 3o: ${formatNumber(rewards.third.coins)} coins + ${formatNumber(rewards.third.xp)} XP`,
    ].join('\n'),
    inline: false,
  });

  const joinButton = new ButtonBuilder()
    .setCustomId('tournament_join')
    .setLabel('Participar')
    .setStyle(ButtonStyle.Success)
    .setEmoji('✅');

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton);

  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}

async function handleStart(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: 'Voce precisa de permissao de Gerenciar Servidor!',
      ephemeral: true,
    });
    return;
  }

  const result = await tournamentService.startTournament(interaction.guildId!);

  if (!result.success) {
    await interaction.reply({ content: result.message, ephemeral: true });
    return;
  }

  const tournament = result.tournament!;

  const embed = new EmbedBuilder()
    .setTitle(`🏁 O TORNEIO COMECOU!`)
    .setDescription(`**${tournament.name}** iniciou com ${tournament.participants.length} participantes!`)
    .setColor(COLORS.SUCCESS)
    .addFields(
      { name: '📊 Rodada', value: `${tournament.currentRound}/${tournament.totalRounds}`, inline: true },
      { name: '👥 Participantes', value: `${tournament.participants.length}`, inline: true },
    );

  // Show first round matches
  const firstRoundMatches = tournament.matches.filter(m => m.round === 1);
  const matchLines = firstRoundMatches.map(m => {
    const p1 = tournament.participants.find(p => p.discordId === m.player1Id);
    const p2 = tournament.participants.find(p => p.discordId === m.player2Id);
    const p1Name = p1?.username || 'TBD';
    const p2Name = p2?.username || (m.status === 'bye' ? 'BYE' : 'TBD');
    return `${p1Name} vs ${p2Name}`;
  });

  if (matchLines.length > 0) {
    embed.addFields({
      name: '⚔️ Partidas da Rodada 1',
      value: matchLines.slice(0, 10).join('\n') + (matchLines.length > 10 ? '\n...' : ''),
    });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleCancel(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: 'Voce precisa de permissao de Gerenciar Servidor!',
      ephemeral: true,
    });
    return;
  }

  const result = await tournamentService.cancelTournament(interaction.guildId!);
  await interaction.reply({ content: result.message, ephemeral: !result.success });
}

async function handleResult(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: 'Voce precisa de permissao de Gerenciar Servidor!',
      ephemeral: true,
    });
    return;
  }

  const matchId = interaction.options.getString('match_id', true);
  const winner = interaction.options.getUser('vencedor', true);

  const tournament = await tournamentService.getActiveTournament(interaction.guildId!);
  if (!tournament) {
    await interaction.reply({ content: 'Nao ha torneio ativo!', ephemeral: true });
    return;
  }

  const result = await tournamentService.recordMatchResult(
    tournament._id.toString(),
    matchId,
    winner.id
  );

  if (!result.success) {
    await interaction.reply({ content: result.message, ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('✅ Resultado Registrado')
    .setDescription(`**${winner.username}** venceu a partida!`)
    .setColor(COLORS.SUCCESS);

  // Check if tournament is complete
  if (result.tournament?.status === 'completed') {
    embed.addFields({
      name: '🏆 TORNEIO FINALIZADO!',
      value: [
        `🥇 1o: <@${result.tournament.winnerId}>`,
        result.tournament.secondPlaceId ? `🥈 2o: <@${result.tournament.secondPlaceId}>` : '',
        result.tournament.thirdPlaceId ? `🥉 3o: <@${result.tournament.thirdPlaceId}>` : '',
      ].filter(Boolean).join('\n'),
    });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleJoin(interaction: ChatInputCommandInteraction) {
  const result = await tournamentService.registerParticipant(
    interaction.guildId!,
    interaction.user.id,
    interaction.user.username
  );

  await interaction.reply({
    content: result.message,
    ephemeral: !result.success,
  });
}

async function handleLeave(interaction: ChatInputCommandInteraction) {
  const result = await tournamentService.unregisterParticipant(
    interaction.guildId!,
    interaction.user.id
  );

  await interaction.reply({
    content: result.message,
    ephemeral: !result.success,
  });
}

async function handleInfo(interaction: ChatInputCommandInteraction) {
  const tournament = await tournamentService.getActiveTournament(interaction.guildId!);

  if (!tournament) {
    await interaction.reply({
      content: 'Nao ha nenhum torneio ativo no momento.',
      ephemeral: true,
    });
    return;
  }

  const emoji = TYPE_EMOJIS[tournament.type];
  const typeName = TYPE_NAMES[tournament.type];

  const embed = new EmbedBuilder()
    .setTitle(`${emoji} ${tournament.name}`)
    .setDescription(tournament.description || '')
    .setColor(tournament.status === 'registration' ? COLORS.PRIMARY : COLORS.WARNING)
    .addFields(
      { name: '🎯 Tipo', value: typeName, inline: true },
      { name: '📊 Status', value: tournament.status === 'registration' ? '📝 Inscricoes abertas' : `⚔️ Rodada ${tournament.currentRound}/${tournament.totalRounds}`, inline: true },
      { name: '👥 Participantes', value: `${tournament.participants.length}/${tournament.maxParticipants}`, inline: true },
    );

  if (tournament.status === 'registration') {
    embed.addFields({
      name: '⏰ Inscricoes ate',
      value: `<t:${Math.floor(tournament.registrationEndsAt.getTime() / 1000)}:R>`,
      inline: true,
    });
  }

  if (tournament.entryFee > 0) {
    embed.addFields({
      name: '💰 Taxa de Entrada',
      value: `${formatNumber(tournament.entryFee)} coins`,
      inline: true,
    });
    embed.addFields({
      name: '💎 Premio Acumulado',
      value: `${formatNumber(tournament.prizePool)} coins`,
      inline: true,
    });
  }

  // Show participants
  if (tournament.participants.length > 0) {
    const participantList = tournament.participants
      .slice(0, 10)
      .map((p, i) => `${i + 1}. ${p.username}${p.eliminated ? ' ❌' : ''}`)
      .join('\n');

    embed.addFields({
      name: `📋 Participantes (${tournament.participants.length})`,
      value: participantList + (tournament.participants.length > 10 ? '\n...' : ''),
    });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleBracket(interaction: ChatInputCommandInteraction) {
  const tournament = await tournamentService.getActiveTournament(interaction.guildId!);

  if (!tournament || tournament.status === 'registration') {
    await interaction.reply({
      content: 'O torneio ainda nao comecou ou nao existe!',
      ephemeral: true,
    });
    return;
  }

  const bracketText = tournamentService.getBracketVisualization(tournament);

  const embed = new EmbedBuilder()
    .setTitle(`🏆 Chaveamento - ${tournament.name}`)
    .setDescription(bracketText)
    .setColor(COLORS.PRIMARY)
    .setFooter({ text: `Rodada atual: ${tournament.currentRound}/${tournament.totalRounds}` });

  await interaction.reply({ embeds: [embed] });
}

async function handleMatches(interaction: ChatInputCommandInteraction) {
  const tournament = await tournamentService.getActiveTournament(interaction.guildId!);

  if (!tournament || tournament.status !== 'in_progress') {
    await interaction.reply({
      content: 'Nao ha torneio em andamento!',
      ephemeral: true,
    });
    return;
  }

  const currentMatches = tournament.matches.filter(m => m.round === tournament.currentRound);

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ Partidas - Rodada ${tournament.currentRound}`)
    .setColor(COLORS.PRIMARY);

  const matchLines = currentMatches.map(m => {
    const p1 = tournament.participants.find(p => p.discordId === m.player1Id);
    const p2 = tournament.participants.find(p => p.discordId === m.player2Id);

    const p1Name = p1?.username || 'TBD';
    const p2Name = p2?.username || (m.status === 'bye' ? 'BYE' : 'TBD');

    let statusIcon = '⏳';
    if (m.status === 'completed') statusIcon = '✅';
    if (m.status === 'bye') statusIcon = '🔄';

    const matchIdShort = m.matchId.slice(0, 8);
    const winner = m.winnerId ? (p1?.discordId === m.winnerId ? p1Name : p2Name) : '';

    return `${statusIcon} \`${matchIdShort}\` ${p1Name} vs ${p2Name}${winner ? ` → **${winner}**` : ''}`;
  });

  embed.setDescription(matchLines.join('\n') || 'Nenhuma partida nesta rodada.');

  // Count completed matches
  const completed = currentMatches.filter(m => m.status === 'completed' || m.status === 'bye').length;
  embed.setFooter({ text: `Progresso: ${completed}/${currentMatches.length} partidas` });

  await interaction.reply({ embeds: [embed] });
}

async function handleStats(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('usuario') || interaction.user;

  const stats = await tournamentService.getPlayerTournamentStats(target.id);

  if (stats.totalTournaments === 0) {
    await interaction.reply({
      content: target.id === interaction.user.id
        ? 'Voce ainda nao participou de nenhum torneio!'
        : `${target.username} ainda nao participou de nenhum torneio!`,
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🏆 Stats de Torneio - ${target.username}`)
    .setThumbnail(target.displayAvatarURL())
    .setColor(COLORS.PRIMARY)
    .addFields(
      { name: '🎮 Torneios', value: `${stats.totalTournaments}`, inline: true },
      { name: '🥇 1o Lugar', value: `${stats.firstPlaces}`, inline: true },
      { name: '🥈 2o Lugar', value: `${stats.secondPlaces}`, inline: true },
      { name: '🥉 3o Lugar', value: `${stats.thirdPlaces}`, inline: true },
      { name: '🏅 Podios', value: `${stats.podiums}`, inline: true },
      { name: '📊 Win Rate', value: `${stats.winRate.toFixed(1)}%`, inline: true },
      { name: '⚔️ Vitorias', value: `${stats.totalWins}`, inline: true },
      { name: '💔 Derrotas', value: `${stats.totalLosses}`, inline: true },
    );

  await interaction.reply({ embeds: [embed] });
}

async function handleHistory(interaction: ChatInputCommandInteraction) {
  const history = await tournamentService.getTournamentHistory(interaction.guildId!, 10);

  if (history.length === 0) {
    await interaction.reply({
      content: 'Nenhum torneio foi realizado ainda!',
      ephemeral: true,
    });
    return;
  }

  const lines = history.map(t => {
    const emoji = TYPE_EMOJIS[t.type];
    const status = t.status === 'completed' ? '✅' : '❌';
    const date = t.completedAt ? `<t:${Math.floor(t.completedAt.getTime() / 1000)}:R>` : 'N/A';
    const winner = t.winnerId ? `🏆 <@${t.winnerId}>` : '';

    return `${status} ${emoji} **${t.name}** - ${t.participants.length} jogadores - ${date}\n${winner}`;
  });

  const embed = new EmbedBuilder()
    .setTitle('📜 Historico de Torneios')
    .setDescription(lines.join('\n\n'))
    .setColor(COLORS.PRIMARY);

  await interaction.reply({ embeds: [embed] });
}
