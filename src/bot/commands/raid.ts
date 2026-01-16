import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { bossRaidService } from '../../services/bossRaidService';
import { BOSSES } from '../../database/models/BossRaid';
import { COLORS } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';

export const data = new SlashCommandBuilder()
  .setName('raid')
  .setDescription('Sistema de Boss Raids - Lute junto com outros jogadores!')
  .addSubcommand(sub =>
    sub
      .setName('criar')
      .setDescription('[ADMIN] Criar uma nova raid de boss')
      .addStringOption(opt =>
        opt
          .setName('boss')
          .setDescription('Boss para enfrentar')
          .setRequired(true)
          .addChoices(
            { name: '🐉 Dragao Anciao (Lv.50)', value: 'dragon' },
            { name: '🗿 Tita de Ferro (Lv.60)', value: 'titan' },
            { name: '🐍 Hidra das Profundezas (Lv.75)', value: 'hydra' },
            { name: '🔥 Fenix Imortal (Lv.65)', value: 'phoenix' },
            { name: '🦑 Kraken Abissal (Lv.80)', value: 'kraken' }
          )
      )
      .addIntegerOption(opt =>
        opt
          .setName('dificuldade')
          .setDescription('Nivel de dificuldade (1-5)')
          .setMinValue(1)
          .setMaxValue(5)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('iniciar')
      .setDescription('[ADMIN] Iniciar a raid em recrutamento')
  )
  .addSubcommand(sub =>
    sub
      .setName('cancelar')
      .setDescription('[ADMIN] Cancelar a raid atual')
  )
  .addSubcommand(sub =>
    sub
      .setName('entrar')
      .setDescription('Entrar em uma raid ativa')
  )
  .addSubcommand(sub =>
    sub
      .setName('atacar')
      .setDescription('Atacar o boss da raid')
  )
  .addSubcommand(sub =>
    sub
      .setName('status')
      .setDescription('Ver status da raid atual')
  )
  .addSubcommand(sub =>
    sub
      .setName('ranking')
      .setDescription('Ver ranking de dano da raid atual')
  )
  .addSubcommand(sub =>
    sub
      .setName('historico')
      .setDescription('Ver historico de raids do servidor')
  )
  .addSubcommand(sub =>
    sub
      .setName('stats')
      .setDescription('Ver suas estatisticas de raid')
      .addUserOption(opt =>
        opt.setName('usuario').setDescription('Usuario para ver stats')
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('bosses')
      .setDescription('Ver lista de bosses disponiveis')
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
    case 'entrar':
      await handleJoin(interaction);
      break;
    case 'atacar':
      await handleAttack(interaction);
      break;
    case 'status':
      await handleStatus(interaction);
      break;
    case 'ranking':
      await handleRanking(interaction);
      break;
    case 'historico':
      await handleHistory(interaction);
      break;
    case 'stats':
      await handleStats(interaction);
      break;
    case 'bosses':
      await handleBosses(interaction);
      break;
  }
}

async function handleCreate(interaction: ChatInputCommandInteraction) {
  // Check admin permissions
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: 'Voce precisa de permissao de Gerenciar Servidor para criar raids!',
      ephemeral: true,
    });
    return;
  }

  const bossId = interaction.options.getString('boss', true);
  const difficulty = interaction.options.getInteger('dificuldade') || 1;

  const result = await bossRaidService.createRaid(
    interaction.guildId!,
    interaction.channelId,
    bossId,
    difficulty
  );

  if (!result.success) {
    await interaction.reply({ content: result.message, ephemeral: true });
    return;
  }

  const raid = result.raid!;
  const boss = BOSSES[bossId];

  const embed = new EmbedBuilder()
    .setTitle(`${boss.emoji} RAID: ${boss.name}`)
    .setDescription(boss.description)
    .setColor(COLORS.WARNING)
    .addFields(
      { name: '❤️ HP', value: formatNumber(raid.maxHp), inline: true },
      { name: '⚔️ Ataque', value: formatNumber(raid.attack), inline: true },
      { name: '🛡️ Defesa', value: formatNumber(raid.defense), inline: true },
      { name: '📊 Nivel', value: `${raid.level}`, inline: true },
      { name: '⭐ Dificuldade', value: '⭐'.repeat(difficulty), inline: true },
      { name: '👥 Min. Participantes', value: `${boss.minParticipants}`, inline: true },
      { name: '⏱️ Tempo Limite', value: `${boss.timeLimit} minutos`, inline: true },
    )
    .setFooter({ text: 'Use /raid entrar para participar!' });

  const joinButton = new ButtonBuilder()
    .setCustomId('raid_join')
    .setLabel('Entrar na Raid')
    .setStyle(ButtonStyle.Success)
    .setEmoji('⚔️');

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton);

  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}

async function handleStart(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: 'Voce precisa de permissao de Gerenciar Servidor para iniciar raids!',
      ephemeral: true,
    });
    return;
  }

  const result = await bossRaidService.startRaid(interaction.guildId!);

  if (!result.success) {
    await interaction.reply({ content: result.message, ephemeral: true });
    return;
  }

  const raid = result.raid!;

  const embed = new EmbedBuilder()
    .setTitle(`${raid.bossEmoji} A RAID COMECOU!`)
    .setDescription(`A batalha contra **${raid.bossName}** comecou!\n\nUse \`/raid atacar\` para atacar o boss!`)
    .setColor(COLORS.ERROR)
    .addFields(
      { name: '❤️ HP do Boss', value: `${formatNumber(raid.currentHp)}/${formatNumber(raid.maxHp)}`, inline: true },
      { name: '👥 Participantes', value: `${raid.participants.length}`, inline: true },
      { name: '⏱️ Termina em', value: `<t:${Math.floor(raid.endsAt!.getTime() / 1000)}:R>`, inline: true },
    );

  await interaction.reply({ embeds: [embed] });
}

async function handleCancel(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: 'Voce precisa de permissao de Gerenciar Servidor para cancelar raids!',
      ephemeral: true,
    });
    return;
  }

  const result = await bossRaidService.cancelRaid(interaction.guildId!);
  await interaction.reply({ content: result.message, ephemeral: !result.success });
}

async function handleJoin(interaction: ChatInputCommandInteraction) {
  const result = await bossRaidService.joinRaid(
    interaction.guildId!,
    interaction.user.id,
    interaction.user.username
  );

  if (!result.success) {
    await interaction.reply({ content: result.message, ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('⚔️ Voce entrou na raid!')
    .setDescription(result.message)
    .setColor(COLORS.SUCCESS)
    .addFields(
      { name: '👥 Total de Participantes', value: `${result.raid!.participants.length}` },
    )
    .setFooter({ text: 'Aguarde a raid iniciar para comecar a atacar!' });

  await interaction.reply({ embeds: [embed] });
}

async function handleAttack(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const result = await bossRaidService.attackBoss(interaction.guildId!, interaction.user.id);

  if (!result.success) {
    await interaction.editReply({ content: result.message });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(result.criticalHit ? COLORS.WARNING : COLORS.SUCCESS);

  if (result.bossDefeated) {
    embed
      .setTitle('🎉 BOSS DERROTADO!')
      .setDescription(result.message)
      .addFields(
        { name: '💥 Seu Dano Final', value: `${formatNumber(result.damage!)}${result.criticalHit ? ' (CRITICO!)' : ''}` },
      );
  } else {
    const hpPercent = ((result.currentHp! / result.maxHp!) * 100).toFixed(1);
    const hpBar = createHpBar(result.currentHp!, result.maxHp!);

    embed
      .setTitle(`⚔️ ${result.criticalHit ? 'GOLPE CRITICO!' : 'Ataque!'}`)
      .addFields(
        { name: '💥 Dano Causado', value: `${formatNumber(result.damage!)}`, inline: true },
        { name: '💔 Dano Recebido', value: `${formatNumber(result.bossDamageToPlayer!)}`, inline: true },
        { name: '❤️ HP do Boss', value: `${hpBar}\n${formatNumber(result.currentHp!)}/${formatNumber(result.maxHp!)} (${hpPercent}%)` },
      );
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleStatus(interaction: ChatInputCommandInteraction) {
  const raid = await bossRaidService.getActiveRaid(interaction.guildId!);

  if (!raid) {
    await interaction.reply({
      content: 'Nao ha nenhuma raid ativa no momento.',
      ephemeral: true,
    });
    return;
  }

  const hpPercent = ((raid.currentHp / raid.maxHp) * 100).toFixed(1);
  const hpBar = createHpBar(raid.currentHp, raid.maxHp);

  const statusText = raid.status === 'recruiting'
    ? '📋 Recrutando participantes...'
    : '⚔️ EM BATALHA!';

  const embed = new EmbedBuilder()
    .setTitle(`${raid.bossEmoji} ${raid.bossName}`)
    .setDescription(statusText)
    .setColor(raid.status === 'recruiting' ? COLORS.WARNING : COLORS.ERROR)
    .addFields(
      { name: '❤️ HP', value: `${hpBar}\n${formatNumber(raid.currentHp)}/${formatNumber(raid.maxHp)} (${hpPercent}%)` },
      { name: '👥 Participantes', value: `${raid.participants.length}`, inline: true },
      { name: '⭐ Dificuldade', value: '⭐'.repeat(raid.difficulty), inline: true },
    );

  if (raid.endsAt) {
    embed.addFields({
      name: '⏱️ Tempo Restante',
      value: `<t:${Math.floor(raid.endsAt.getTime() / 1000)}:R>`,
      inline: true,
    });
  }

  // Top 5 damage dealers
  if (raid.participants.length > 0) {
    const leaderboard = bossRaidService.getRaidLeaderboard(raid).slice(0, 5);
    const leaderboardText = leaderboard
      .map((p, i) => `${i + 1}. ${p.username}: ${formatNumber(p.damage)} (${p.percent.toFixed(1)}%)`)
      .join('\n');

    embed.addFields({ name: '🏆 Top Dano', value: leaderboardText || 'Nenhum ataque ainda' });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleRanking(interaction: ChatInputCommandInteraction) {
  const raid = await bossRaidService.getActiveRaid(interaction.guildId!);

  if (!raid) {
    await interaction.reply({
      content: 'Nao ha nenhuma raid ativa no momento.',
      ephemeral: true,
    });
    return;
  }

  const leaderboard = bossRaidService.getRaidLeaderboard(raid);

  if (leaderboard.length === 0) {
    await interaction.reply({
      content: 'Nenhum ataque foi feito ainda!',
      ephemeral: true,
    });
    return;
  }

  const rankEmojis = ['🥇', '🥈', '🥉'];
  const lines = leaderboard.map((p, i) => {
    const emoji = i < 3 ? rankEmojis[i] : `${i + 1}.`;
    return `${emoji} **${p.username}** - ${formatNumber(p.damage)} dano (${p.percent.toFixed(1)}%)`;
  });

  const embed = new EmbedBuilder()
    .setTitle(`🏆 Ranking - ${raid.bossEmoji} ${raid.bossName}`)
    .setDescription(lines.join('\n'))
    .setColor(COLORS.PRIMARY)
    .setFooter({ text: `Total de ${leaderboard.length} participantes` });

  await interaction.reply({ embeds: [embed] });
}

async function handleHistory(interaction: ChatInputCommandInteraction) {
  const history = await bossRaidService.getRaidHistory(interaction.guildId!, 10);

  if (history.length === 0) {
    await interaction.reply({
      content: 'Nenhuma raid foi realizada ainda!',
      ephemeral: true,
    });
    return;
  }

  const lines = history.map(raid => {
    const status = raid.status === 'completed' ? '✅' : '❌';
    const date = raid.completedAt ? `<t:${Math.floor(raid.completedAt.getTime() / 1000)}:R>` : 'N/A';
    return `${status} ${raid.bossEmoji} **${raid.bossName}** - ${raid.participants.length} jogadores - ${date}`;
  });

  const embed = new EmbedBuilder()
    .setTitle('📜 Historico de Raids')
    .setDescription(lines.join('\n'))
    .setColor(COLORS.PRIMARY);

  await interaction.reply({ embeds: [embed] });
}

async function handleStats(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('usuario') || interaction.user;

  const stats = await bossRaidService.getPlayerRaidStats(target.id);

  if (stats.totalRaids === 0) {
    await interaction.reply({
      content: target.id === interaction.user.id
        ? 'Voce ainda nao participou de nenhuma raid!'
        : `${target.username} ainda nao participou de nenhuma raid!`,
      ephemeral: true,
    });
    return;
  }

  const winRate = ((stats.raidsWon / stats.totalRaids) * 100).toFixed(1);
  const bossesText = stats.bossesDefeated.map(b => BOSSES[b]?.emoji || '❓').join(' ') || 'Nenhum';

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ Stats de Raid - ${target.username}`)
    .setThumbnail(target.displayAvatarURL())
    .setColor(COLORS.PRIMARY)
    .addFields(
      { name: '🎯 Raids Participadas', value: `${stats.totalRaids}`, inline: true },
      { name: '✅ Vitorias', value: `${stats.raidsWon} (${winRate}%)`, inline: true },
      { name: '💥 Dano Total', value: formatNumber(stats.totalDamage), inline: true },
      { name: '📊 Media de Participacao', value: `${stats.avgDamagePercent.toFixed(1)}%`, inline: true },
      { name: '🏆 Bosses Derrotados', value: bossesText, inline: false },
    );

  await interaction.reply({ embeds: [embed] });
}

async function handleBosses(interaction: ChatInputCommandInteraction) {
  const bosses = bossRaidService.getAvailableBosses();

  const embed = new EmbedBuilder()
    .setTitle('📖 Bestiario de Bosses')
    .setDescription('Bosses disponiveis para raids:\n')
    .setColor(COLORS.PRIMARY);

  for (const boss of bosses) {
    embed.addFields({
      name: `${boss.emoji} ${boss.name} (Lv.${boss.level})`,
      value: `${boss.description}\n❤️ HP: ${formatNumber(boss.baseHp)} | ⚔️ ATK: ${boss.baseAttack} | 🛡️ DEF: ${boss.baseDefense}\n👥 Min: ${boss.minParticipants} | ⏱️ ${boss.timeLimit}min`,
      inline: false,
    });
  }

  await interaction.reply({ embeds: [embed] });
}

function createHpBar(current: number, max: number): string {
  const percent = current / max;
  const filled = Math.round(percent * 10);
  const empty = 10 - filled;

  let color = '🟩'; // Green
  if (percent <= 0.5) color = '🟨'; // Yellow
  if (percent <= 0.25) color = '🟥'; // Red

  return color.repeat(filled) + '⬛'.repeat(empty);
}
