import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} from 'discord.js';
import { duelService } from '../../services/duelService';
import { COLORS } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';

const RANK_EMOJIS: Record<string, string> = {
  bronze: '🥉',
  silver: '⚪',
  gold: '🥇',
  platinum: '💠',
  diamond: '💎',
  master: '🔮',
  grandmaster: '👑',
};

const RANK_NAMES: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Prata',
  gold: 'Ouro',
  platinum: 'Platina',
  diamond: 'Diamante',
  master: 'Mestre',
  grandmaster: 'Grao-Mestre',
};

export const data = new SlashCommandBuilder()
  .setName('duelo')
  .setDescription('Sistema de duelos PvP')
  .addSubcommand(sub =>
    sub
      .setName('desafiar')
      .setDescription('Desafiar outro jogador para um duelo')
      .addUserOption(opt =>
        opt.setName('oponente').setDescription('Jogador para desafiar').setRequired(true)
      )
      .addIntegerOption(opt =>
        opt
          .setName('aposta')
          .setDescription('Quantidade de coins para apostar (0-50000)')
          .setMinValue(0)
          .setMaxValue(50000)
      )
  )
  .addSubcommand(sub =>
    sub.setName('aceitar').setDescription('Aceitar um desafio de duelo pendente')
  )
  .addSubcommand(sub =>
    sub.setName('recusar').setDescription('Recusar um desafio de duelo pendente')
  )
  .addSubcommand(sub =>
    sub.setName('ranking').setDescription('Ver ranking PvP')
  )
  .addSubcommand(sub =>
    sub.setName('stats').setDescription('Ver suas estatisticas de PvP')
  )
  .addSubcommand(sub =>
    sub.setName('historico').setDescription('Ver historico de duelos')
  )
  .addSubcommand(sub =>
    sub
      .setName('perfil')
      .setDescription('Ver perfil PvP de um jogador')
      .addUserOption(opt =>
        opt.setName('jogador').setDescription('Jogador para ver perfil')
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'desafiar':
      await handleDesafiar(interaction);
      break;
    case 'aceitar':
      await handleAceitar(interaction);
      break;
    case 'recusar':
      await handleRecusar(interaction);
      break;
    case 'ranking':
      await handleRanking(interaction);
      break;
    case 'stats':
      await handleStats(interaction);
      break;
    case 'historico':
      await handleHistorico(interaction);
      break;
    case 'perfil':
      await handlePerfil(interaction);
      break;
  }
}

async function handleDesafiar(interaction: ChatInputCommandInteraction) {
  const opponent = interaction.options.getUser('oponente', true);
  const aposta = interaction.options.getInteger('aposta') || 0;

  if (opponent.bot) {
    await interaction.reply({ content: 'Voce nao pode desafiar bots!', ephemeral: true });
    return;
  }

  if (opponent.id === interaction.user.id) {
    await interaction.reply({ content: 'Voce nao pode se desafiar!', ephemeral: true });
    return;
  }

  const result = await duelService.challengePlayer(
    interaction.user.id,
    interaction.user.username,
    opponent.id,
    opponent.username,
    aposta
  );

  if (!result.success) {
    await interaction.reply({ content: `${result.message}`, ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('⚔️ Desafio de Duelo!')
    .setDescription(
      `**${interaction.user.username}** desafiou **${opponent.username}** para um duelo!`
    )
    .addFields(
      { name: 'Desafiante', value: interaction.user.username, inline: true },
      { name: 'Oponente', value: opponent.username, inline: true },
      { name: 'Aposta', value: aposta > 0 ? `${formatNumber(aposta)} coins` : 'Nenhuma', inline: true }
    )
    .setColor(COLORS.WARNING)
    .setFooter({ text: `O desafio expira em 5 minutos | ${opponent.username} use /duelo aceitar` });

  // Create buttons
  const acceptBtn = new ButtonBuilder()
    .setCustomId(`duel_accept_${result.duel!._id}`)
    .setLabel('Aceitar')
    .setStyle(ButtonStyle.Success)
    .setEmoji('⚔️');

  const declineBtn = new ButtonBuilder()
    .setCustomId(`duel_decline_${result.duel!._id}`)
    .setLabel('Recusar')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('❌');

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(acceptBtn, declineBtn);

  const message = await interaction.reply({
    content: `<@${opponent.id}>`,
    embeds: [embed],
    components: [row],
    fetchReply: true
  });

  // Handle button interaction
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 5 * 60 * 1000, // 5 minutes
    filter: (i) => i.user.id === opponent.id
  });

  collector.on('collect', async (buttonInteraction) => {
    if (buttonInteraction.customId.startsWith('duel_accept_')) {
      await buttonInteraction.deferUpdate();
      const duelResult = await duelService.acceptDuel(opponent.id);

      if (!duelResult.success) {
        await buttonInteraction.followUp({ content: `${duelResult.message}`, ephemeral: true });
        return;
      }

      // Show battle result
      const displayRounds = duelResult.rounds!.slice(-15);
      const roundsText = displayRounds.join('\n');

      const resultEmbed = new EmbedBuilder()
        .setTitle(`⚔️ Resultado do Duelo`)
        .setDescription(roundsText)
        .addFields(
          {
            name: '📊 Estatisticas',
            value: `**${interaction.user.username}**: ${duelResult.challengerDamage} dano\n` +
                   `**${opponent.username}**: ${duelResult.opponentDamage} dano`,
            inline: false
          }
        )
        .setColor(duelResult.winner === interaction.user.id ? '#00FF00' : '#FF0000');

      if (duelResult.winner) {
        resultEmbed.addFields({
          name: '🎁 Recompensas',
          value: `**${duelResult.winnerName}**: +${duelResult.xpWinner} XP` +
                 (duelResult.coinsWon ? ` | +${formatNumber(duelResult.coinsWon!)} coins` : '') +
                 `\n**${duelResult.loserName}**: +${duelResult.xpLoser} XP` +
                 (duelResult.coinsWon ? ` | -${formatNumber(duelResult.coinsWon!)} coins` : ''),
          inline: false
        });
      }

      await buttonInteraction.editReply({ embeds: [resultEmbed], components: [] });
      collector.stop();

    } else if (buttonInteraction.customId.startsWith('duel_decline_')) {
      await duelService.declineDuel(opponent.id);

      const declinedEmbed = new EmbedBuilder()
        .setTitle('❌ Desafio Recusado')
        .setDescription(`**${opponent.username}** recusou o desafio de **${interaction.user.username}**.`)
        .setColor(COLORS.ERROR);

      await buttonInteraction.update({ embeds: [declinedEmbed], components: [] });
      collector.stop();
    }
  });

  collector.on('end', async (_, reason) => {
    if (reason === 'time') {
      const expiredEmbed = new EmbedBuilder()
        .setTitle('⏰ Desafio Expirado')
        .setDescription(`O desafio de **${interaction.user.username}** para **${opponent.username}** expirou.`)
        .setColor(COLORS.ERROR);

      await message.edit({ embeds: [expiredEmbed], components: [] }).catch(() => {});
    }
  });
}

async function handleAceitar(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const pendingDuel = await duelService.getPendingDuel(interaction.user.id);

  if (!pendingDuel || pendingDuel.opponentId !== interaction.user.id) {
    await interaction.editReply({ content: 'Voce nao tem nenhum desafio pendente para aceitar!' });
    return;
  }

  const result = await duelService.acceptDuel(interaction.user.id);

  if (!result.success) {
    await interaction.editReply({ content: result.message });
    return;
  }

  const displayRounds = result.rounds!.slice(-15);
  const roundsText = displayRounds.join('\n');

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ Resultado do Duelo`)
    .setDescription(roundsText)
    .addFields(
      {
        name: '📊 Estatisticas',
        value: `**${pendingDuel.challengerName}**: ${result.challengerDamage} dano\n` +
               `**${pendingDuel.opponentName}**: ${result.opponentDamage} dano`,
        inline: false
      }
    )
    .setColor(result.winner === interaction.user.id ? '#00FF00' : '#FF0000');

  if (result.winner) {
    embed.addFields({
      name: '🎁 Recompensas',
      value: `**${result.winnerName}**: +${result.xpWinner} XP` +
             (result.coinsWon ? ` | +${formatNumber(result.coinsWon!)} coins` : '') +
             `\n**${result.loserName}**: +${result.xpLoser} XP` +
             (result.coinsWon ? ` | -${formatNumber(result.coinsWon!)} coins` : ''),
      inline: false
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleRecusar(interaction: ChatInputCommandInteraction) {
  const result = await duelService.declineDuel(interaction.user.id);

  if (!result.success) {
    await interaction.reply({ content: result.message, ephemeral: true });
    return;
  }

  await interaction.reply({ content: result.message });
}

async function handleRanking(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const leaderboard = await duelService.getLeaderboard(15);

  if (leaderboard.length === 0) {
    await interaction.editReply({ content: 'Ninguem duelou ainda! Seja o primeiro com `/duelo desafiar`' });
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  const lines = leaderboard.map((player, i) => {
    const medal = medals[i] || `**${i + 1}.**`;
    const rankEmoji = RANK_EMOJIS[player.rank] || '🥉';
    const winRate = player.wins + player.losses > 0
      ? Math.round((player.wins / (player.wins + player.losses)) * 100)
      : 0;

    return `${medal} ${rankEmoji} **${player.username}**\n` +
           `   ELO: ${player.elo} | ${player.wins}V/${player.losses}D (${winRate}%)`;
  });

  const embed = new EmbedBuilder()
    .setTitle('🏆 Ranking PvP')
    .setDescription(lines.join('\n\n'))
    .setColor(COLORS.PRIMARY)
    .setFooter({ text: 'Use /duelo desafiar para batalhar!' });

  await interaction.editReply({ embeds: [embed] });
}

async function handleStats(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const stats = await duelService.getStats(interaction.user.id);

  if (!stats) {
    await interaction.editReply({
      content: 'Voce ainda nao participou de nenhum duelo! Use `/duelo desafiar @usuario` para comecar.'
    });
    return;
  }

  const winRate = stats.wins + stats.losses > 0
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    : 0;

  const rankEmoji = RANK_EMOJIS[stats.rank] || '🥉';
  const rankName = RANK_NAMES[stats.rank] || 'Bronze';

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ Stats PvP de ${interaction.user.username}`)
    .setThumbnail(interaction.user.displayAvatarURL())
    .addFields(
      { name: 'Rank', value: `${rankEmoji} ${rankName}`, inline: true },
      { name: 'ELO', value: `${stats.elo}`, inline: true },
      { name: 'Taxa de Vitoria', value: `${winRate}%`, inline: true },
      { name: 'Vitorias', value: `${stats.wins}`, inline: true },
      { name: 'Derrotas', value: `${stats.losses}`, inline: true },
      { name: 'Sequencia', value: `${stats.winStreak} (Melhor: ${stats.bestWinStreak})`, inline: true },
      { name: 'Coins Ganhos', value: formatNumber(stats.totalBetsWon), inline: true },
      { name: 'Coins Perdidos', value: formatNumber(stats.totalBetsLost), inline: true },
    )
    .setColor(COLORS.PRIMARY)
    .setFooter({ text: 'Desafie outros jogadores para subir no ranking!' });

  await interaction.editReply({ embeds: [embed] });
}

async function handleHistorico(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const history = await duelService.getHistory(interaction.user.id, 10);

  if (history.length === 0) {
    await interaction.editReply({
      content: 'Voce ainda nao participou de nenhum duelo!'
    });
    return;
  }

  const lines = history.map(duel => {
    const isWinner = duel.winnerId === interaction.user.id;
    const opponentName = duel.challengerId === interaction.user.id
      ? duel.opponentName
      : duel.challengerName;
    const result = isWinner ? '✅ Vitoria' : '❌ Derrota';
    const bet = duel.betAmount > 0 ? ` | ${formatNumber(duel.betAmount)} coins` : '';

    return `${result} vs **${opponentName}**${bet}`;
  });

  const embed = new EmbedBuilder()
    .setTitle(`📜 Historico de Duelos`)
    .setDescription(lines.join('\n'))
    .setColor(COLORS.PRIMARY)
    .setFooter({ text: 'Ultimos 10 duelos' });

  await interaction.editReply({ embeds: [embed] });
}

async function handlePerfil(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const target = interaction.options.getUser('jogador') || interaction.user;
  const stats = await duelService.getStats(target.id);

  if (!stats) {
    await interaction.editReply({
      content: `${target.username} ainda nao participou de nenhum duelo!`
    });
    return;
  }

  const winRate = stats.wins + stats.losses > 0
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    : 0;

  const rankEmoji = RANK_EMOJIS[stats.rank] || '🥉';
  const rankName = RANK_NAMES[stats.rank] || 'Bronze';

  // Get recent matches
  const history = await duelService.getHistory(target.id, 5);
  const recentMatches = history.map(duel => {
    const isWinner = duel.winnerId === target.id;
    return isWinner ? '✅' : '❌';
  }).join(' ') || 'Nenhum';

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ Perfil PvP`)
    .setDescription(`**${target.username}**`)
    .setThumbnail(target.displayAvatarURL())
    .addFields(
      { name: 'Rank', value: `${rankEmoji} ${rankName}`, inline: true },
      { name: 'ELO', value: `${stats.elo}`, inline: true },
      { name: 'Taxa de Vitoria', value: `${winRate}%`, inline: true },
      { name: 'Vitorias/Derrotas', value: `${stats.wins}/${stats.losses}`, inline: true },
      { name: 'Melhor Sequencia', value: `${stats.bestWinStreak}`, inline: true },
      { name: 'Partidas Recentes', value: recentMatches, inline: true },
    )
    .setColor(COLORS.PRIMARY);

  await interaction.editReply({ embeds: [embed] });
}
