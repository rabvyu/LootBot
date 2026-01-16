import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ButtonInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';
import { dungeonService } from '../../services/dungeonService';
import { guildService } from '../../services/guildService';
import { Character } from '../../database/models';
import {
  DUNGEONS,
  getAvailableDungeons,
  getDungeonById,
  getDifficultyColor,
  getDifficultyName,
} from '../../data/dungeons';

export const data = new SlashCommandBuilder()
  .setName('dungeon')
  .setDescription('Sistema de Dungeons Cooperativas')
  .addSubcommand(sub =>
    sub
      .setName('listar')
      .setDescription('Ver dungeons disponíveis')
  )
  .addSubcommand(sub =>
    sub
      .setName('criar')
      .setDescription('Criar uma nova dungeon')
      .addStringOption(opt =>
        opt
          .setName('dungeon')
          .setDescription('Qual dungeon criar')
          .setRequired(true)
          .addChoices(
            { name: '🏚️ Catacumbas Antigas (Normal)', value: 'catacombs' },
            { name: '🏰 Fortaleza Sombria (Difícil)', value: 'shadow_fortress' },
            { name: '🌀 Abismo do Caos (Extremo)', value: 'chaos_abyss' },
            { name: '👑🔥 Trono do Demônio (Impossível)', value: 'demon_throne' }
          )
      )
      .addBooleanOption(opt =>
        opt
          .setName('guilda')
          .setDescription('Restringir para membros da sua guilda')
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('entrar')
      .setDescription('Entrar em uma dungeon aberta')
      .addStringOption(opt =>
        opt
          .setName('id')
          .setDescription('ID da dungeon (deixe vazio para ver abertas)')
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('sair')
      .setDescription('Sair da dungeon atual')
  )
  .addSubcommand(sub =>
    sub
      .setName('pronto')
      .setDescription('Marcar-se como pronto')
  )
  .addSubcommand(sub =>
    sub
      .setName('iniciar')
      .setDescription('Iniciar a dungeon (apenas líder)')
  )
  .addSubcommand(sub =>
    sub
      .setName('status')
      .setDescription('Ver status da dungeon atual')
  )
  .addSubcommand(sub =>
    sub
      .setName('atacar')
      .setDescription('Atacar a wave/boss atual')
  )
  .addSubcommand(sub =>
    sub
      .setName('abertas')
      .setDescription('Ver dungeons abertas para entrar')
  )
  .addSubcommand(sub =>
    sub
      .setName('historico')
      .setDescription('Ver seu histórico de dungeons')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'listar':
      return handleList(interaction);
    case 'criar':
      return handleCreate(interaction);
    case 'entrar':
      return handleJoin(interaction);
    case 'sair':
      return handleLeave(interaction);
    case 'pronto':
      return handleReady(interaction);
    case 'iniciar':
      return handleStart(interaction);
    case 'status':
      return handleStatus(interaction);
    case 'atacar':
      return handleAttack(interaction);
    case 'abertas':
      return handleOpenRuns(interaction);
    case 'historico':
      return handleHistory(interaction);
    default:
      return handleList(interaction);
  }
}

// ==================== HANDLERS ====================

async function handleList(interaction: ChatInputCommandInteraction) {
  const character = await Character.findOne({ discordId: interaction.user.id });
  const playerLevel = character?.level || 1;
  const playerGuild = await guildService.getPlayerGuild(interaction.user.id);

  const availableDungeons = getAvailableDungeons(playerLevel, !!playerGuild);

  if (availableDungeons.length === 0) {
    return interaction.reply({
      content: '❌ Nenhuma dungeon disponível para seu nível. Continue evoluindo!',
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('🏰 Dungeons Disponíveis')
    .setColor(0x3498DB)
    .setDescription('Selecione uma dungeon para ver detalhes ou use `/dungeon criar <dungeon>`');

  for (const dungeon of availableDungeons) {
    const diffName = getDifficultyName(dungeon.difficulty);
    const guildReq = dungeon.requiresGuild ? ' 🛡️' : '';

    embed.addFields({
      name: `${dungeon.emoji} ${dungeon.name} ${diffName}${guildReq}`,
      value: `${dungeon.description}\n` +
        `👥 ${dungeon.minPlayers}-${dungeon.maxPlayers} jogadores | ⭐ Nível ${dungeon.minLevel}+ | 🕐 ${dungeon.cooldownHours}h cooldown`,
      inline: false,
    });
  }

  // Listar dungeons bloqueadas
  const allDungeons = Object.values(DUNGEONS);
  const lockedDungeons = allDungeons.filter(d => !availableDungeons.includes(d));

  if (lockedDungeons.length > 0) {
    const lockedList = lockedDungeons.map(d => {
      const reasons = [];
      if (d.minLevel > playerLevel) reasons.push(`Nível ${d.minLevel}`);
      if (d.requiresGuild && !playerGuild) reasons.push('Requer Guilda');
      return `🔒 ${d.name} - ${reasons.join(', ')}`;
    }).join('\n');

    embed.addFields({ name: 'Bloqueadas', value: lockedList, inline: false });
  }

  return interaction.reply({ embeds: [embed] });
}

async function handleCreate(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const dungeonId = interaction.options.getString('dungeon', true);
  const guildMode = interaction.options.getBoolean('guilda') || false;

  const result = await dungeonService.createRun(
    dungeonId,
    interaction.user.id,
    interaction.user.username,
    interaction.channelId,
    guildMode
  );

  if (!result.success) {
    return interaction.editReply({ content: `❌ ${result.message}` });
  }

  const run = result.run!;
  const dungeon = getDungeonById(dungeonId)!;

  const embed = new EmbedBuilder()
    .setTitle(`${dungeon.emoji} ${dungeon.name}`)
    .setColor(getDifficultyColor(dungeon.difficulty))
    .setDescription(
      `${dungeon.description}\n\n` +
      `**Líder:** ${interaction.user.username}\n` +
      `**ID da Run:** \`${run.runId.substring(0, 8)}\`\n\n` +
      `Jogadores: **1**/${dungeon.maxPlayers} (mínimo: ${dungeon.minPlayers})`
    )
    .addFields(
      { name: 'Dificuldade', value: getDifficultyName(dungeon.difficulty), inline: true },
      { name: 'Waves', value: `${dungeon.totalWaves}`, inline: true },
      { name: 'Boss', value: `${dungeon.boss.emoji} ${dungeon.boss.name}`, inline: true }
    )
    .setFooter({ text: 'Use /dungeon entrar para participar!' });

  if (run.guildName) {
    embed.addFields({ name: 'Guilda', value: `🛡️ ${run.guildName}`, inline: true });
  }

  // Botões de ação
  const joinBtn = new ButtonBuilder()
    .setCustomId(`dungeon_join_${run.runId}`)
    .setLabel('Entrar')
    .setStyle(ButtonStyle.Success)
    .setEmoji('➕');

  const readyBtn = new ButtonBuilder()
    .setCustomId(`dungeon_ready_${run.runId}`)
    .setLabel('Pronto')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('✅');

  const startBtn = new ButtonBuilder()
    .setCustomId(`dungeon_start_${run.runId}`)
    .setLabel('Iniciar')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('⚔️');

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(joinBtn, readyBtn, startBtn);

  const response = await interaction.editReply({
    embeds: [embed],
    components: [row],
  });

  // Collector para botões
  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 3600000, // 1 hora
  });

  collector.on('collect', async (btnInteraction: ButtonInteraction) => {
    const action = btnInteraction.customId.split('_')[1];

    switch (action) {
      case 'join': {
        const joinResult = await dungeonService.joinRun(
          run.runId,
          btnInteraction.user.id,
          btnInteraction.user.username
        );
        if (!joinResult.success) {
          return btnInteraction.reply({ content: `❌ ${joinResult.message}`, ephemeral: true });
        }
        await btnInteraction.reply({ content: `✅ ${joinResult.message}`, ephemeral: true });
        await updateDungeonEmbed(interaction, run.runId);
        break;
      }

      case 'ready': {
        const readyResult = await dungeonService.setReady(btnInteraction.user.id, true);
        if (!readyResult.success) {
          return btnInteraction.reply({ content: `❌ ${readyResult.message}`, ephemeral: true });
        }
        await btnInteraction.reply({ content: readyResult.message, ephemeral: true });
        await updateDungeonEmbed(interaction, run.runId);
        break;
      }

      case 'start': {
        if (btnInteraction.user.id !== run.leaderId) {
          return btnInteraction.reply({ content: '❌ Apenas o líder pode iniciar!', ephemeral: true });
        }
        const startResult = await dungeonService.startRun(btnInteraction.user.id);
        if (!startResult.success) {
          return btnInteraction.reply({ content: `❌ ${startResult.message}`, ephemeral: true });
        }
        await btnInteraction.reply({ content: startResult.message });
        collector.stop();
        // Iniciar loop de combate
        await startCombatLoop(interaction, run.runId);
        break;
      }
    }
  });
}

async function handleJoin(interaction: ChatInputCommandInteraction) {
  const runId = interaction.options.getString('id');

  if (!runId) {
    // Mostrar dungeons abertas
    return handleOpenRuns(interaction);
  }

  await interaction.deferReply();

  const result = await dungeonService.joinRun(
    runId,
    interaction.user.id,
    interaction.user.username
  );

  return interaction.editReply({
    content: result.success ? `✅ ${result.message}` : `❌ ${result.message}`,
  });
}

async function handleLeave(interaction: ChatInputCommandInteraction) {
  const result = await dungeonService.leaveRun(interaction.user.id);

  return interaction.reply({
    content: result.success ? `✅ ${result.message}` : `❌ ${result.message}`,
    ephemeral: true,
  });
}

async function handleReady(interaction: ChatInputCommandInteraction) {
  const result = await dungeonService.setReady(interaction.user.id, true);

  return interaction.reply({
    content: result.success ? result.message : `❌ ${result.message}`,
    ephemeral: true,
  });
}

async function handleStart(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const result = await dungeonService.startRun(interaction.user.id);

  if (!result.success) {
    return interaction.editReply({ content: `❌ ${result.message}` });
  }

  await interaction.editReply({ content: result.message });

  // Iniciar loop de combate
  const run = await dungeonService.getActiveRunForPlayer(interaction.user.id);
  if (run) {
    await startCombatLoop(interaction, run.runId);
  }
}

async function handleStatus(interaction: ChatInputCommandInteraction) {
  const run = await dungeonService.getActiveRunForPlayer(interaction.user.id);

  if (!run) {
    return interaction.reply({
      content: '❌ Você não está em nenhuma dungeon.',
      ephemeral: true,
    });
  }

  const dungeon = getDungeonById(run.dungeonId);
  if (!dungeon) {
    return interaction.reply({ content: '❌ Erro ao carregar dungeon.', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle(`${dungeon.emoji} ${run.dungeonName}`)
    .setColor(getDifficultyColor(run.difficulty));

  if (run.status === 'forming') {
    const readyCount = run.participants.filter(p => p.isReady).length;
    const playerList = run.participants.map(p =>
      `${p.isReady ? '✅' : '⏳'} ${p.username} (Nv.${p.level} ${p.class})`
    ).join('\n');

    embed.setDescription(
      `**Status:** Formando grupo\n` +
      `**Jogadores:** ${run.participants.length}/${run.maxPlayers}\n` +
      `**Prontos:** ${readyCount}/${run.participants.length}\n\n` +
      `**Participantes:**\n${playerList}`
    );
  } else if (run.status === 'in_progress') {
    const currentWave = run.waves[run.currentWave - 1];
    const aliveMonsters = currentWave?.monsters.filter(m => m.isAlive).length || 0;

    let statusText = `**Wave:** ${run.currentWave}/${run.totalWaves}\n`;

    if (currentWave && !currentWave.completed) {
      statusText += `**Monstros vivos:** ${aliveMonsters}\n`;
    } else if (run.currentWave >= run.totalWaves && run.boss?.isAlive) {
      const bossHpPercent = Math.floor((run.boss.hp / run.boss.maxHp) * 100);
      statusText += `\n**🔥 BOSS FIGHT 🔥**\n`;
      statusText += `${dungeon.boss.emoji} **${run.boss.name}**\n`;
      statusText += `HP: ${run.boss.hp.toLocaleString()}/${run.boss.maxHp.toLocaleString()} (${bossHpPercent}%)\n`;
      statusText += `Fase: ${run.boss.phase}/${dungeon.boss.phases}\n`;
      if (run.boss.enraged) statusText += `⚠️ **ENRAGED!**\n`;
    }

    // Top dano
    const topDamage = [...run.participants]
      .sort((a, b) => b.damageDealt - a.damageDealt)
      .slice(0, 5)
      .map((p, i) => `${i + 1}. ${p.username}: ${p.damageDealt.toLocaleString()}`)
      .join('\n');

    embed.setDescription(statusText);
    embed.addFields({ name: '⚔️ Top Dano', value: topDamage || 'Nenhum dano ainda', inline: false });
  } else if (run.status === 'completed') {
    embed.setColor(0x00FF00);
    embed.setDescription(
      `✅ **Dungeon Completada!**\n\n` +
      `Dano Total: ${run.totalDamageDealt.toLocaleString()}\n` +
      `Mortes: ${run.totalDeaths}`
    );

    // Mostrar loot
    const playerLoot = run.loot.find(l => l.discordId === interaction.user.id);
    if (playerLoot) {
      let lootText = `💰 ${playerLoot.coins.toLocaleString()} coins\n`;
      lootText += `✨ ${playerLoot.xp.toLocaleString()} XP\n`;
      if (playerLoot.materials.length > 0) {
        lootText += `📦 Materiais: ${playerLoot.materials.map(m => `${m.materialName} x${m.quantity}`).join(', ')}\n`;
      }
      if (playerLoot.items.length > 0) {
        lootText += `🎁 Itens: ${playerLoot.items.map(i => `${i.itemName} (${i.rarity})`).join(', ')}`;
      }
      embed.addFields({ name: 'Seu Loot', value: lootText, inline: false });
    }
  } else if (run.status === 'failed') {
    embed.setColor(0xFF0000);
    embed.setDescription(`❌ **Dungeon Falhou**\n\nO grupo foi derrotado.`);
  }

  return interaction.reply({ embeds: [embed] });
}

async function handleAttack(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const run = await dungeonService.getActiveRunForPlayer(interaction.user.id);

  if (!run || run.status !== 'in_progress') {
    return interaction.editReply({ content: '❌ Você não está em uma dungeon ativa.' });
  }

  // Verificar se está na wave ou no boss
  if (run.currentWave >= run.totalWaves && run.waves[run.totalWaves - 1]?.completed) {
    // Boss fight
    const bossResult = await dungeonService.processBoss(run.runId);

    const embed = new EmbedBuilder()
      .setTitle(bossResult.bossDefeated ? '🏆 Boss Derrotado!' : '⚔️ Ataque ao Boss')
      .setColor(bossResult.bossDefeated ? 0x00FF00 : 0xFF0000)
      .setDescription(bossResult.message);

    if (!bossResult.bossDefeated) {
      const topDamage = Object.entries(bossResult.damageDealt)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id, dmg], i) => {
          const p = run.participants.find(p => p.discordId === id);
          return `${i + 1}. ${p?.username || 'Desconhecido'}: ${dmg.toLocaleString()}`;
        })
        .join('\n');

      embed.addFields({ name: 'Dano neste turno', value: topDamage, inline: false });
    }

    return interaction.editReply({ embeds: [embed] });
  } else {
    // Wave fight
    const waveResult = await dungeonService.processWave(run.runId);

    const embed = new EmbedBuilder()
      .setTitle(waveResult.waveCompleted ? `✅ Wave Completada!` : '⚔️ Combate')
      .setColor(waveResult.waveCompleted ? 0x00FF00 : 0xFFFF00)
      .setDescription(waveResult.message);

    if (waveResult.waveCompleted) {
      if (waveResult.isBossWave) {
        embed.addFields({
          name: '🔥 BOSS FIGHT',
          value: 'Todas as waves foram completadas! Use `/dungeon atacar` para enfrentar o Boss!',
          inline: false,
        });
      } else if (waveResult.nextWave) {
        embed.addFields({
          name: 'Próxima Wave',
          value: `Prepare-se para a Wave ${waveResult.nextWave}!`,
          inline: false,
        });
      }
    }

    if (waveResult.deaths.length > 0) {
      embed.addFields({
        name: '💀 Mortes',
        value: waveResult.deaths.join(', '),
        inline: false,
      });
    }

    return interaction.editReply({ embeds: [embed] });
  }
}

async function handleOpenRuns(interaction: ChatInputCommandInteraction) {
  const openRuns = await dungeonService.getOpenRuns();

  if (openRuns.length === 0) {
    return interaction.reply({
      content: '📭 Nenhuma dungeon aberta no momento. Use `/dungeon criar` para criar uma!',
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('🏰 Dungeons Abertas')
    .setColor(0x3498DB)
    .setDescription('Selecione uma dungeon para entrar');

  for (const run of openRuns) {
    const dungeon = getDungeonById(run.dungeonId);
    const guildTag = run.guildName ? ` [${run.guildName}]` : '';

    embed.addFields({
      name: `${dungeon?.emoji || '🏰'} ${run.dungeonName}${guildTag}`,
      value: `Líder: ${run.leaderUsername}\n` +
        `Jogadores: ${run.participants.length}/${run.maxPlayers}\n` +
        `ID: \`${run.runId.substring(0, 8)}\``,
      inline: true,
    });
  }

  // Criar select menu
  const options = openRuns.slice(0, 25).map(run => ({
    label: run.dungeonName,
    description: `Líder: ${run.leaderUsername} (${run.participants.length}/${run.maxPlayers})`,
    value: run.runId,
  }));

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_dungeon')
    .setPlaceholder('Selecione uma dungeon para entrar')
    .addOptions(options);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true,
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 60000,
  });

  collector.on('collect', async (selectInteraction: StringSelectMenuInteraction) => {
    const runId = selectInteraction.values[0];
    const result = await dungeonService.joinRun(
      runId,
      selectInteraction.user.id,
      selectInteraction.user.username
    );

    await selectInteraction.reply({
      content: result.success ? `✅ ${result.message}` : `❌ ${result.message}`,
      ephemeral: true,
    });
  });
}

async function handleHistory(interaction: ChatInputCommandInteraction) {
  const history = await dungeonService.getPlayerHistory(interaction.user.id, 10);

  if (history.length === 0) {
    return interaction.reply({
      content: '📭 Você ainda não completou nenhuma dungeon.',
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('📜 Histórico de Dungeons')
    .setColor(0x3498DB);

  let totalCoins = 0;
  let totalXP = 0;
  let victories = 0;

  for (const run of history) {
    const dungeon = getDungeonById(run.dungeonId);
    const participant = run.participants.find(p => p.discordId === interaction.user.id);
    const loot = run.loot.find(l => l.discordId === interaction.user.id);

    const statusEmoji = run.success ? '✅' : '❌';
    const date = run.completedAt ? run.completedAt.toLocaleDateString('pt-BR') : 'N/A';

    if (run.success) victories++;
    if (loot) {
      totalCoins += loot.coins;
      totalXP += loot.xp;
    }

    embed.addFields({
      name: `${statusEmoji} ${dungeon?.emoji || ''} ${run.dungeonName}`,
      value: `Data: ${date}\n` +
        `Dano: ${participant?.damageDealt.toLocaleString() || 0}\n` +
        `Loot: ${loot?.coins.toLocaleString() || 0} coins, ${loot?.xp.toLocaleString() || 0} XP`,
      inline: true,
    });
  }

  embed.setDescription(
    `**Estatísticas Totais**\n` +
    `Vitórias: ${victories}/${history.length}\n` +
    `Coins ganhos: ${totalCoins.toLocaleString()}\n` +
    `XP ganho: ${totalXP.toLocaleString()}`
  );

  return interaction.reply({ embeds: [embed], ephemeral: true });
}

// ==================== HELPERS ====================

async function updateDungeonEmbed(interaction: ChatInputCommandInteraction, runId: string): Promise<void> {
  const run = await dungeonService.getRunById(runId);
  if (!run) return;

  const dungeon = getDungeonById(run.dungeonId);
  if (!dungeon) return;

  const readyCount = run.participants.filter(p => p.isReady).length;
  const playerList = run.participants.map(p =>
    `${p.isReady ? '✅' : '⏳'} ${p.username} (Nv.${p.level})`
  ).join('\n');

  const embed = new EmbedBuilder()
    .setTitle(`${dungeon.emoji} ${dungeon.name}`)
    .setColor(getDifficultyColor(dungeon.difficulty))
    .setDescription(
      `${dungeon.description}\n\n` +
      `**Líder:** ${run.leaderUsername}\n` +
      `**ID:** \`${run.runId.substring(0, 8)}\`\n\n` +
      `**Jogadores:** ${run.participants.length}/${run.maxPlayers}\n` +
      `**Prontos:** ${readyCount}/${run.participants.length}\n\n` +
      `**Participantes:**\n${playerList}`
    );

  try {
    await interaction.editReply({ embeds: [embed] });
  } catch {
    // Ignore edit errors
  }
}

async function startCombatLoop(interaction: ChatInputCommandInteraction, runId: string): Promise<void> {
  // Este é um loop simplificado - em produção, seria melhor usar um sistema de eventos
  // Por enquanto, os jogadores usam /dungeon atacar manualmente

  const run = await dungeonService.getRunById(runId);
  if (!run) return;

  const dungeon = getDungeonById(run.dungeonId);
  if (!dungeon) return;

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ ${dungeon.name} - Wave 1/${run.totalWaves}`)
    .setColor(getDifficultyColor(run.difficulty))
    .setDescription(
      `A dungeon começou! Enfrentem as waves de monstros!\n\n` +
      `Use \`/dungeon atacar\` para atacar a wave atual.\n` +
      `Use \`/dungeon status\` para ver o status.`
    );

  const wave = run.waves[0];
  if (wave) {
    const monsterList = wave.monsters.map(m => `${m.name} (HP: ${m.hp})`).join('\n');
    embed.addFields({ name: '👹 Monstros', value: monsterList, inline: false });
  }

  const attackBtn = new ButtonBuilder()
    .setCustomId(`dungeon_attack_${runId}`)
    .setLabel('Atacar')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('⚔️');

  const statusBtn = new ButtonBuilder()
    .setCustomId(`dungeon_status_${runId}`)
    .setLabel('Status')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('📊');

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(attackBtn, statusBtn);

  await interaction.followUp({ embeds: [embed], components: [row] });
}
