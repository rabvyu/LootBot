import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ButtonInteraction,
} from 'discord.js';
import { arenaService } from '../../services/arenaService';
import { User, Character } from '../../database/models';
import { ARENA_RANKS, getRankByRating, RATING_CONFIG } from '../../data/arena';

export const data = new SlashCommandBuilder()
  .setName('arena')
  .setDescription('Arena PvP Ranqueada')
  .addSubcommand(sub =>
    sub
      .setName('status')
      .setDescription('Ver seu perfil da arena')
  )
  .addSubcommand(sub =>
    sub
      .setName('buscar')
      .setDescription('Entrar na fila de matchmaking PvP')
  )
  .addSubcommand(sub =>
    sub
      .setName('cancelar')
      .setDescription('Sair da fila de matchmaking')
  )
  .addSubcommand(sub =>
    sub
      .setName('ranking')
      .setDescription('Ver o ranking da temporada')
  )
  .addSubcommand(sub =>
    sub
      .setName('historico')
      .setDescription('Ver suas últimas partidas')
  )
  .addSubcommand(sub =>
    sub
      .setName('ranks')
      .setDescription('Ver informações sobre os ranks')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'status':
      return handleStatus(interaction);
    case 'buscar':
      return handleSearch(interaction);
    case 'cancelar':
      return handleCancel(interaction);
    case 'ranking':
      return handleRanking(interaction);
    case 'historico':
      return handleHistory(interaction);
    case 'ranks':
      return handleRanks(interaction);
    default:
      return handleStatus(interaction);
  }
}

// ==================== HANDLERS ====================

async function handleStatus(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const profile = await arenaService.getArenaProfile(interaction.user.id);

  if (!profile || !profile.player) {
    return interaction.editReply({
      content: '❌ Erro ao carregar perfil de arena. Tente novamente.',
    });
  }

  const { player, rank, position, seasonName, winRate, matchesToNextRank, isPlacement, placementMatchesLeft } = profile;

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ Perfil de Arena - ${interaction.user.username}`)
    .setColor(rank.color)
    .setThumbnail(interaction.user.displayAvatarURL());

  // Info da temporada
  embed.setDescription(`**${seasonName}**`);

  // Rank atual
  if (isPlacement) {
    embed.addFields({
      name: '📊 Status',
      value: `🎯 **Em Classificação**\n${placementMatchesLeft} partidas restantes`,
      inline: true,
    });
  } else {
    embed.addFields({
      name: '🏆 Rank',
      value: `${rank.emoji} **${rank.name}**`,
      inline: true,
    });
  }

  embed.addFields(
    { name: '📈 Rating', value: `**${player.rating}** (Pico: ${player.peakRating})`, inline: true },
    { name: '🌍 Posição', value: `#${position}`, inline: true }
  );

  // Estatísticas
  embed.addFields(
    { name: '✅ Vitórias', value: `${player.wins}`, inline: true },
    { name: '❌ Derrotas', value: `${player.losses}`, inline: true },
    { name: '📊 Win Rate', value: `${winRate}%`, inline: true }
  );

  // Streak
  embed.addFields(
    { name: '🔥 Win Streak', value: `${player.winStreak} (Melhor: ${player.bestWinStreak})`, inline: true },
    { name: '🎮 Partidas', value: `${player.matchesPlayed}`, inline: true }
  );

  // Próximo rank
  if (!isPlacement && matchesToNextRank !== null) {
    const nextRank = Object.values(ARENA_RANKS).find(r => r.minRating > player.rating);
    if (nextRank) {
      const ratingNeeded = nextRank.minRating - player.rating;
      embed.addFields({
        name: '📈 Próximo Rank',
        value: `${nextRank.emoji} ${nextRank.name}\n(${ratingNeeded} rating)`,
        inline: true,
      });
    }
  }

  // Footer com info da fila
  const queueSize = arenaService.getQueueSize();
  embed.setFooter({ text: `Jogadores na fila: ${queueSize} | Use /arena buscar para jogar` });

  return interaction.editReply({ embeds: [embed] });
}

async function handleSearch(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  // Verificar se tem personagem
  const character = await Character.findOne({ discordId: interaction.user.id });
  if (!character) {
    return interaction.editReply({
      content: '❌ Você precisa criar um personagem primeiro. Use `/personagem criar`.',
    });
  }

  if (character.level < 10) {
    return interaction.editReply({
      content: `❌ Você precisa estar no nível 10 para participar da arena.\nNível atual: ${character.level}`,
    });
  }

  const user = await User.findOne({ discordId: interaction.user.id });
  if (!user) {
    return interaction.editReply({
      content: '❌ Usuário não encontrado.',
    });
  }

  // Tentar entrar na fila
  const result = await arenaService.joinQueue(interaction.user.id, user.username);

  if (!result.success) {
    return interaction.editReply({ content: result.message });
  }

  if (result.status === 'matched' && result.opponent) {
    // Match encontrado imediatamente!
    const embed = new EmbedBuilder()
      .setTitle('⚔️ Oponente Encontrado!')
      .setColor(0xFF0000)
      .setDescription(`Você será enfrentado contra **${result.opponent.username}**!`)
      .addFields(
        { name: '🎯 Rating do Oponente', value: `${result.opponent.rating}`, inline: true }
      );

    const fightBtn = new ButtonBuilder()
      .setCustomId('start_fight')
      .setLabel('Iniciar Combate!')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('⚔️');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(fightBtn);

    const response = await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    // Collector para iniciar combate
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
    });

    collector.on('collect', async (btnInteraction: ButtonInteraction) => {
      if (btnInteraction.user.id !== interaction.user.id) {
        return btnInteraction.reply({ content: '❌ Este botão não é para você!', ephemeral: true });
      }

      await btnInteraction.deferUpdate();

      // Iniciar partida
      const matchResult = await arenaService.startMatch(
        interaction.user.id,
        result.opponent!.discordId
      );

      if (!matchResult.success) {
        return btnInteraction.editReply({
          content: `❌ ${matchResult.message}`,
          embeds: [],
          components: [],
        });
      }

      // Mostrar resultado
      const resultEmbed = createMatchResultEmbed(
        matchResult,
        interaction.user.id,
        user.username,
        result.opponent!.username
      );

      await btnInteraction.editReply({
        embeds: [resultEmbed],
        components: [],
      });
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time' && collected.size === 0) {
        arenaService.leaveQueue(interaction.user.id);
        await interaction.editReply({
          content: '⏰ Tempo esgotado. Você saiu da fila.',
          embeds: [],
          components: [],
        });
      }
    });

    return;
  }

  // Entrou na fila, aguardando oponente
  const embed = new EmbedBuilder()
    .setTitle('⚔️ Buscando Oponente...')
    .setColor(0xFFAA00)
    .setDescription('Você entrou na fila de matchmaking.\nAguardando um oponente compatível...')
    .addFields(
      { name: '👥 Jogadores na Fila', value: `${arenaService.getQueueSize()}`, inline: true }
    )
    .setFooter({ text: 'A busca expande automaticamente após 30 segundos' });

  const cancelBtn = new ButtonBuilder()
    .setCustomId('cancel_queue')
    .setLabel('Cancelar Busca')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancelBtn);

  const response = await interaction.editReply({
    embeds: [embed],
    components: [row],
  });

  // Polling para verificar match
  let attempts = 0;
  const maxAttempts = 24; // 2 minutos (5s * 24)
  const checkInterval = 5000;

  const checkForMatch = async () => {
    attempts++;

    // Expandir range após algumas tentativas
    if (attempts % 6 === 0) { // A cada 30s
      arenaService.expandQueueRange(interaction.user.id);
    }

    // Verificar se ainda está na fila
    if (!arenaService.isInQueue(interaction.user.id)) {
      return; // Saiu da fila ou encontrou match
    }

    // Tentar encontrar oponente novamente
    const profile = await arenaService.getArenaProfile(interaction.user.id);
    if (!profile?.player) return;

    // Simular tentativa de match
    arenaService.leaveQueue(interaction.user.id);
    const retryResult = await arenaService.joinQueue(interaction.user.id, user.username);

    if (retryResult.status === 'matched' && retryResult.opponent) {
      // Match encontrado!
      const matchEmbed = new EmbedBuilder()
        .setTitle('⚔️ Oponente Encontrado!')
        .setColor(0xFF0000)
        .setDescription(`Oponente: **${retryResult.opponent.username}** (${retryResult.opponent.rating} rating)`)
        .addFields({ name: '⏳', value: 'Iniciando combate automaticamente...', inline: false });

      await interaction.editReply({ embeds: [matchEmbed], components: [] });

      // Iniciar partida automaticamente
      const matchResult = await arenaService.startMatch(
        interaction.user.id,
        retryResult.opponent.discordId
      );

      if (matchResult.success) {
        const resultEmbed = createMatchResultEmbed(
          matchResult,
          interaction.user.id,
          user.username,
          retryResult.opponent.username
        );

        await interaction.editReply({ embeds: [resultEmbed], components: [] });
      }

      return;
    }

    // Atualizar embed
    if (attempts < maxAttempts) {
      const updatedEmbed = new EmbedBuilder()
        .setTitle('⚔️ Buscando Oponente...')
        .setColor(0xFFAA00)
        .setDescription(`Procurando oponente há ${attempts * 5} segundos...\nA busca está sendo expandida.`)
        .addFields(
          { name: '👥 Jogadores na Fila', value: `${arenaService.getQueueSize()}`, inline: true }
        );

      try {
        await interaction.editReply({ embeds: [updatedEmbed], components: [row] });
      } catch {
        // Interação pode ter expirado
      }

      setTimeout(checkForMatch, checkInterval);
    } else {
      // Timeout
      arenaService.leaveQueue(interaction.user.id);
      const timeoutEmbed = new EmbedBuilder()
        .setTitle('⏰ Tempo Esgotado')
        .setColor(0x888888)
        .setDescription('Não foi possível encontrar um oponente.\nTente novamente mais tarde.');

      try {
        await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
      } catch {
        // Ignorar erro
      }
    }
  };

  // Iniciar polling
  setTimeout(checkForMatch, checkInterval);

  // Collector para cancelar
  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120000,
  });

  collector.on('collect', async (btnInteraction: ButtonInteraction) => {
    if (btnInteraction.user.id !== interaction.user.id) {
      return btnInteraction.reply({ content: '❌ Este botão não é para você!', ephemeral: true });
    }

    arenaService.leaveQueue(interaction.user.id);

    const cancelEmbed = new EmbedBuilder()
      .setTitle('❌ Busca Cancelada')
      .setColor(0x888888)
      .setDescription('Você saiu da fila de matchmaking.');

    await btnInteraction.update({ embeds: [cancelEmbed], components: [] });
    collector.stop();
  });
}

async function handleCancel(interaction: ChatInputCommandInteraction) {
  const wasInQueue = arenaService.leaveQueue(interaction.user.id);

  if (wasInQueue) {
    return interaction.reply({
      content: '✅ Você saiu da fila de matchmaking.',
      ephemeral: true,
    });
  } else {
    return interaction.reply({
      content: '❌ Você não está na fila de matchmaking.',
      ephemeral: true,
    });
  }
}

async function handleRanking(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const leaderboard = await arenaService.getLeaderboard(10);

  if (leaderboard.length === 0) {
    return interaction.editReply({
      content: '❌ Nenhum jogador ranqueado ainda nesta temporada.',
    });
  }

  // Buscar usernames
  const userIds = leaderboard.map(p => p.discordId);
  const users = await User.find({ discordId: { $in: userIds } });
  const userMap = new Map(users.map(u => [u.discordId, u.username]));

  const embed = new EmbedBuilder()
    .setTitle('🏆 Ranking da Arena')
    .setColor(0xFFD700)
    .setDescription('Top 10 jogadores da temporada atual');

  const rankingText = leaderboard.map(p => {
    const username = userMap.get(p.discordId) || 'Desconhecido';
    const rankData = getRankByRating(p.rating);
    const medal = p.position <= 3 ? ['🥇', '🥈', '🥉'][p.position - 1] : `#${p.position}`;

    return `${medal} **${username}**\n${rankData.emoji} ${p.rating} | ${p.wins}V/${p.losses}D (${p.winRate}%)`;
  }).join('\n\n');

  embed.addFields({
    name: 'Classificação',
    value: rankingText,
    inline: false,
  });

  // Mostrar posição do jogador se não estiver no top 10
  const profile = await arenaService.getArenaProfile(interaction.user.id);
  if (profile && profile.position > 10) {
    embed.setFooter({ text: `Sua posição: #${profile.position} (${profile.player?.rating} rating)` });
  }

  return interaction.editReply({ embeds: [embed] });
}

async function handleHistory(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const matches = await arenaService.getMatchHistory(interaction.user.id, 5);

  if (matches.length === 0) {
    return interaction.editReply({
      content: '❌ Você ainda não tem partidas nesta temporada.',
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('📜 Histórico de Partidas')
    .setColor(0x3498DB)
    .setDescription('Suas últimas 5 partidas');

  for (const match of matches) {
    const isPlayer1 = match.player1.discordId === interaction.user.id;
    const opponent = isPlayer1 ? match.player2 : match.player1;
    const myData = isPlayer1 ? match.player1 : match.player2;
    const won = match.winnerId === interaction.user.id;

    const ratingChange = won
      ? `+${myData.ratingAfter - myData.ratingBefore}`
      : `${myData.ratingAfter - myData.ratingBefore}`;

    const resultEmoji = won ? '✅' : '❌';
    const date = new Date(match.createdAt).toLocaleDateString('pt-BR');

    embed.addFields({
      name: `${resultEmoji} vs ${opponent.username}`,
      value: `Rating: ${myData.ratingBefore} → ${myData.ratingAfter} (${ratingChange})\nRounds: ${match.totalRounds} | ${date}`,
      inline: true,
    });
  }

  return interaction.editReply({ embeds: [embed] });
}

async function handleRanks(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('🏆 Ranks da Arena')
    .setColor(0xFFD700)
    .setDescription('Informações sobre os ranks e suas recompensas de temporada');

  for (const rank of Object.values(ARENA_RANKS)) {
    const rewardsText = [
      `💰 ${rank.seasonRewards.coins.toLocaleString()} coins`,
      ...rank.seasonRewards.materials.map(m => `📦 ${m.quantity}x ${m.materialId}`),
      rank.seasonRewards.title ? `🏷️ Título: "${rank.seasonRewards.title}"` : '',
    ].filter(Boolean).join('\n');

    embed.addFields({
      name: `${rank.emoji} ${rank.name} (${rank.minRating}+ rating)`,
      value: rewardsText,
      inline: true,
    });
  }

  embed.addFields({
    name: '📊 Sistema de Rating',
    value:
      `• Rating inicial: ${RATING_CONFIG.initialRating}\n` +
      `• ${RATING_CONFIG.placementMatches} partidas de classificação\n` +
      `• Bônus por win streak (3+ vitórias)\n` +
      `• Rating mínimo: ${RATING_CONFIG.minRating}`,
    inline: false,
  });

  return interaction.reply({ embeds: [embed] });
}

// ==================== HELPERS ====================

function createMatchResultEmbed(
  matchResult: any,
  myId: string,
  myUsername: string,
  opponentUsername: string
): EmbedBuilder {
  const won = matchResult.match?.winnerId === myId;
  const ratingChange = won ? matchResult.ratingChange?.winner : matchResult.ratingChange?.loser;

  const embed = new EmbedBuilder()
    .setTitle(won ? '🏆 Vitória!' : '💀 Derrota!')
    .setColor(won ? 0x00FF00 : 0xFF0000)
    .setDescription(`**${myUsername}** vs **${opponentUsername}**`);

  if (ratingChange) {
    const changeText = ratingChange.change >= 0 ? `+${ratingChange.change}` : `${ratingChange.change}`;
    embed.addFields({
      name: '📊 Rating',
      value: `${ratingChange.before} → ${ratingChange.after} (${changeText})`,
      inline: true,
    });
  }

  if (matchResult.match) {
    embed.addFields({
      name: '⚔️ Rounds',
      value: `${matchResult.match.totalRounds}`,
      inline: true,
    });
  }

  // Rank up/down
  if (matchResult.rankUp) {
    embed.addFields({
      name: '🎉 Rank Up!',
      value: `Subiu para **${matchResult.rankUp.newRank}**!`,
      inline: false,
    });
  }

  if (matchResult.rankDown) {
    embed.addFields({
      name: '📉 Rank Down',
      value: `Caiu para **${matchResult.rankDown.newRank}**`,
      inline: false,
    });
  }

  // Log de combate resumido
  if (matchResult.combatLog && matchResult.combatLog.length > 0) {
    embed.addFields({
      name: '📜 Resumo do Combate',
      value: matchResult.combatLog.slice(-4).join('\n'),
      inline: false,
    });
  }

  return embed;
}
