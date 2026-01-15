import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { rpgService } from '../../services/rpgService';
import { tamingService } from '../../services/tamingService';
import { CharacterClass } from '../../database/models/Character';

export const data = new SlashCommandBuilder()
  .setName('rpg')
  .setDescription('Sistema de RPG com combate')
  .addSubcommand(sub =>
    sub
      .setName('criar')
      .setDescription('Cria um novo personagem')
      .addStringOption(opt =>
        opt
          .setName('nome')
          .setDescription('Nome do seu personagem')
          .setRequired(true)
          .setMinLength(2)
          .setMaxLength(20)
      )
  )
  .addSubcommand(sub =>
    sub.setName('status').setDescription('Ver status do seu personagem')
  )
  .addSubcommand(sub =>
    sub
      .setName('batalhar')
      .setDescription('Batalhar contra um monstro específico')
      .addStringOption(opt =>
        opt
          .setName('monstro')
          .setDescription('ID do monstro para batalhar')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('explorar')
      .setDescription('Explorar uma localização e batalhar')
      .addStringOption(opt =>
        opt
          .setName('local')
          .setDescription('ID da localização para explorar')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub.setName('locais').setDescription('Ver localizações disponíveis')
  )
  .addSubcommand(sub =>
    sub.setName('curar').setDescription('Curar seu personagem (custa coins)')
  )
  .addSubcommand(sub =>
    sub
      .setName('monstros')
      .setDescription('Ver monstros de uma localização')
      .addStringOption(opt =>
        opt
          .setName('local')
          .setDescription('ID da localização (opcional)')
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub.setName('ranking').setDescription('Ver ranking de personagens')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'criar':
      await handleCriar(interaction);
      break;
    case 'status':
      await handleStatus(interaction);
      break;
    case 'batalhar':
      await handleBatalhar(interaction);
      break;
    case 'explorar':
      await handleExplorar(interaction);
      break;
    case 'locais':
      await handleLocais(interaction);
      break;
    case 'curar':
      await handleCurar(interaction);
      break;
    case 'monstros':
      await handleMonstros(interaction);
      break;
    case 'ranking':
      await handleRanking(interaction);
      break;
  }
}

async function handleCriar(interaction: ChatInputCommandInteraction) {
  const nome = interaction.options.getString('nome', true);
  const discordId = interaction.user.id;

  // Check if already has character
  const existing = await rpgService.getCharacter(discordId);
  if (existing) {
    await interaction.reply({
      content: '❌ Você já tem um personagem! Use `/rpg status` para ver.',
      ephemeral: true,
    });
    return;
  }

  // Show class selection menu
  const classEmbed = new EmbedBuilder()
    .setTitle('⚔️ Escolha sua Classe')
    .setDescription(`Criando personagem: **${nome}**\n\nEscolha uma classe abaixo:`)
    .addFields(
      {
        name: '⚔️ Guerreiro',
        value: 'HP: 150 | ATK: 18 | DEF: 15\nAlto HP e defesa, dano moderado.',
        inline: true,
      },
      {
        name: '🔮 Mago',
        value: 'HP: 80 | ATK: 28 | DEF: 6\nAlto dano e crítico, baixa defesa.',
        inline: true,
      },
      {
        name: '🏹 Arqueiro',
        value: 'HP: 100 | ATK: 22 | DEF: 10\nAlta chance de crítico, balanceado.',
        inline: true,
      },
      {
        name: '🛡️ Paladino',
        value: 'HP: 130 | ATK: 14 | DEF: 18\nMáxima defesa, dano baixo.',
        inline: true,
      }
    )
    .setColor('#FFD700');

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('rpg_class_select')
    .setPlaceholder('Escolha sua classe...')
    .addOptions([
      { label: 'Guerreiro', description: 'Tanque equilibrado', value: 'warrior', emoji: '⚔️' },
      { label: 'Mago', description: 'Alto dano mágico', value: 'mage', emoji: '🔮' },
      { label: 'Arqueiro', description: 'Críticos devastadores', value: 'archer', emoji: '🏹' },
      { label: 'Paladino', description: 'Defesa máxima', value: 'paladin', emoji: '🛡️' },
    ]);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  const response = await interaction.reply({
    embeds: [classEmbed],
    components: [row],
    fetchReply: true,
  });

  try {
    const selectInteraction = await response.awaitMessageComponent({
      filter: (i) => i.user.id === interaction.user.id && i.customId === 'rpg_class_select',
      componentType: ComponentType.StringSelect,
      time: 60000,
    }) as StringSelectMenuInteraction;

    const selectedClass = selectInteraction.values[0] as CharacterClass;
    const result = await rpgService.createCharacter(discordId, nome, selectedClass);

    if (result.success && result.character) {
      const char = result.character;
      const className = rpgService.getClassName(selectedClass);
      const classEmoji = rpgService.getClassEmoji(selectedClass);

      const successEmbed = new EmbedBuilder()
        .setTitle('🎉 Personagem Criado!')
        .setDescription(`**${char.name}** - ${classEmoji} ${className}`)
        .addFields(
          { name: '❤️ HP', value: `${char.stats.hp}/${char.stats.maxHp}`, inline: true },
          { name: '⚔️ Ataque', value: `${char.stats.attack}`, inline: true },
          { name: '🛡️ Defesa', value: `${char.stats.defense}`, inline: true },
          { name: '🎯 Crítico', value: `${char.stats.critChance}%`, inline: true },
          { name: '💥 Dano Crit', value: `${char.stats.critDamage}%`, inline: true },
          { name: '📊 Nível', value: '1', inline: true }
        )
        .setColor('#00FF00')
        .setFooter({ text: 'Use /rpg batalhar para começar a lutar!' });

      await selectInteraction.update({ embeds: [successEmbed], components: [] });
    } else {
      await selectInteraction.update({
        content: `❌ ${result.message}`,
        embeds: [],
        components: [],
      });
    }
  } catch {
    await interaction.editReply({
      content: '⏰ Tempo esgotado! Use o comando novamente.',
      embeds: [],
      components: [],
    });
  }
}

async function handleStatus(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const character = await rpgService.getCharacter(discordId);

  if (!character) {
    await interaction.reply({
      content: '❌ Você não tem um personagem! Use `/rpg criar` primeiro.',
      ephemeral: true,
    });
    return;
  }

  const className = rpgService.getClassName(character.class);
  const classEmoji = rpgService.getClassEmoji(character.class);
  const xpNeeded = rpgService.getXpForLevel(character.level);
  const xpProgress = Math.floor((character.experience / xpNeeded) * 100);

  const hpBar = createProgressBar(character.stats.hp, character.stats.maxHp);
  const xpBar = createProgressBar(character.experience, xpNeeded);

  const embed = new EmbedBuilder()
    .setTitle(`${classEmoji} ${character.name}`)
    .setDescription(`**${className}** - Nível ${character.level}`)
    .addFields(
      { name: '❤️ HP', value: `${hpBar} ${character.stats.hp}/${character.stats.maxHp}`, inline: false },
      { name: '✨ XP', value: `${xpBar} ${character.experience}/${xpNeeded} (${xpProgress}%)`, inline: false },
      { name: '⚔️ Ataque', value: `${character.stats.attack}`, inline: true },
      { name: '🛡️ Defesa', value: `${character.stats.defense}`, inline: true },
      { name: '🎯 Crítico', value: `${character.stats.critChance}%`, inline: true },
      { name: '💥 Dano Crit', value: `${character.stats.critDamage}%`, inline: true },
      { name: '🏆 Vitórias', value: `${character.battlesWon}`, inline: true },
      { name: '💀 Derrotas', value: `${character.battlesLost}`, inline: true },
      { name: '👹 Bosses', value: `${character.bossKills}`, inline: true },
      { name: '⚡ Dano Total', value: `${character.totalDamageDealt.toLocaleString()}`, inline: true }
    )
    .setColor(character.stats.hp > 0 ? '#00FF00' : '#FF0000');

  if (character.stats.hp <= 0) {
    embed.setFooter({ text: '💀 Seu personagem está morto! Use /rpg curar' });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleBatalhar(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const monsterId = interaction.options.getString('monstro', true);

  await interaction.deferReply();

  const result = await rpgService.battle(discordId, monsterId);

  if ('error' in result) {
    await interaction.editReply({ content: `❌ ${result.error}` });
    return;
  }

  // Build battle embed
  const color = result.victory ? '#00FF00' : '#FF0000';
  const title = result.victory
    ? `🎉 Vitória contra ${result.monsterEmoji} ${result.monsterName}!`
    : `💀 Derrota para ${result.monsterEmoji} ${result.monsterName}...`;

  // Limit rounds display to avoid huge embeds
  const displayRounds = result.rounds.slice(-10);
  const roundsText = displayRounds.join('\n');

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(roundsText)
    .setColor(color);

  if (result.victory) {
    const rewardLines = [
      `✨ **XP:** +${result.xpEarned}`,
      `💰 **Coins:** +${result.coinsEarned}`,
    ];

    if (result.drops.length > 0) {
      const dropsText = result.drops.map(d => `${d.resourceId} x${d.amount}`).join(', ');
      rewardLines.push(`📦 **Drops:** ${dropsText}`);
    }

    embed.addFields({ name: '🎁 Recompensas', value: rewardLines.join('\n'), inline: false });
  }

  embed.addFields(
    { name: '⚔️ Dano Causado', value: `${result.damageDealt}`, inline: true },
    { name: '💥 Dano Recebido', value: `${result.damageTaken}`, inline: true }
  );

  if (result.characterDied) {
    embed.setFooter({ text: '💀 Seu personagem morreu! Use /rpg curar para reviver.' });
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleCurar(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const result = await rpgService.healCharacter(discordId);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('💚 Personagem Curado!')
      .setDescription(result.message)
      .setColor('#00FF00');
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
  }
}

async function handleExplorar(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const locationId = interaction.options.getString('local', true);

  await interaction.deferReply();

  const result = await rpgService.battleInLocation(discordId, locationId);

  if ('error' in result) {
    await interaction.editReply({ content: `❌ ${result.error}` });
    return;
  }

  const location = rpgService.getLocation(locationId);
  const locationName = location ? `${location.emoji} ${location.name}` : locationId;

  const color = result.victory ? '#00FF00' : '#FF0000';
  const title = result.victory
    ? `🎉 Vitória em ${locationName}!`
    : `💀 Derrota em ${locationName}...`;

  const displayRounds = result.rounds.slice(-10);
  const roundsText = displayRounds.join('\n');

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(`**${result.monsterEmoji} ${result.monsterName}**\n\n${roundsText}`)
    .setColor(color);

  if (result.victory) {
    const rewardLines = [
      `✨ **XP:** +${result.xpEarned}`,
      `💰 **Coins:** +${result.coinsEarned}`,
    ];

    if (result.drops.length > 0) {
      const dropsText = result.drops.map(d => `${d.resourceId} x${d.amount}`).join(', ');
      rewardLines.push(`📦 **Drops:** ${dropsText}`);
    }

    embed.addFields({ name: '🎁 Recompensas', value: rewardLines.join('\n'), inline: false });
  }

  embed.addFields(
    { name: '⚔️ Dano Causado', value: `${result.damageDealt}`, inline: true },
    { name: '💥 Dano Recebido', value: `${result.damageTaken}`, inline: true }
  );

  if (result.characterDied) {
    embed.setFooter({ text: '💀 Seu personagem morreu! Use /rpg curar para reviver.' });
  }

  // Add capture button if victory and monster is capturable
  if (result.victory && result.monsterId && !result.isBoss) {
    const captureButton = new ButtonBuilder()
      .setCustomId(`capture_${result.monsterId}_${result.monsterHpRemaining || 0}_${result.monsterMaxHp || 100}`)
      .setLabel('🐾 Tentar Capturar')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(captureButton);

    const response = await interaction.editReply({ embeds: [embed], components: [row] });

    try {
      const buttonInteraction = await response.awaitMessageComponent({
        filter: (i) => i.user.id === discordId && i.customId.startsWith('capture_'),
        componentType: ComponentType.Button,
        time: 30000,
      });

      const [, monsterId, hpRemaining, maxHp] = buttonInteraction.customId.split('_');
      const character = await rpgService.getCharacter(discordId);
      const captureResult = await tamingService.attemptCapture(
        discordId,
        monsterId,
        parseInt(hpRemaining),
        parseInt(maxHp),
        character?.level || 1
      );

      if (captureResult.success) {
        const captureEmbed = new EmbedBuilder()
          .setTitle('🎉 Captura Bem-Sucedida!')
          .setDescription(captureResult.message)
          .setColor('#9B59B6')
          .setFooter({ text: `Chance: ${captureResult.captureChance?.toFixed(1)}% | Use /domar para gerenciar` });
        await buttonInteraction.update({ embeds: [embed, captureEmbed], components: [] });
      } else {
        const failEmbed = new EmbedBuilder()
          .setTitle('😔 Captura Falhou')
          .setDescription(captureResult.message)
          .setColor('#FF6600');
        await buttonInteraction.update({ embeds: [embed, failEmbed], components: [] });
      }
    } catch {
      await interaction.editReply({ embeds: [embed], components: [] });
    }
  } else {
    await interaction.editReply({ embeds: [embed] });
  }
}

async function handleLocais(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const character = await rpgService.getCharacter(discordId);
  const charLevel = character?.level || 1;

  const allLocations = rpgService.getAllLocations();
  const availableLocations = rpgService.getLocationsForCharacterLevel(charLevel);

  // Group by tier
  const tiers: Record<number, typeof allLocations> = {};
  for (const loc of allLocations) {
    if (!tiers[loc.tier]) tiers[loc.tier] = [];
    tiers[loc.tier].push(loc);
  }

  const tierNames: Record<number, string> = {
    1: '🌱 Tier 1 - Iniciante (Lv.1-7)',
    2: '🌿 Tier 2 - Novato (Lv.5-12)',
    3: '🌲 Tier 3 - Intermediário (Lv.10-22)',
    4: '⚡ Tier 4 - Avançado (Lv.20-35)',
    5: '🔥 Tier 5 - Expert (Lv.35-52)',
    6: '💀 Tier 6 - Mestre (Lv.50-80)',
    7: '👑 Tier 7 - Dungeons Especiais',
  };

  const fields = [];
  for (let tier = 1; tier <= 7; tier++) {
    const tierLocs = tiers[tier] || [];
    if (tierLocs.length === 0) continue;

    const locsText = tierLocs.map(loc => {
      const isAvailable = availableLocations.some(l => l.id === loc.id);
      const status = isAvailable ? '✅' : '🔒';
      return `${status} ${loc.emoji} **${loc.name}** (Lv.${loc.minLevel}-${loc.maxLevel})\n   ID: \`${loc.id}\``;
    }).join('\n');

    fields.push({
      name: tierNames[tier],
      value: locsText || 'Nenhuma localização',
      inline: false,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('🗺️ Localizações do Mundo')
    .setDescription(character
      ? `Seu nível: **${charLevel}** - Localizações disponíveis: **${availableLocations.length}**`
      : 'Crie um personagem para desbloquear localizações!')
    .addFields(fields.slice(0, 6))
    .setColor('#8B4513')
    .setFooter({ text: 'Use: /rpg explorar <id> para batalhar!' });

  await interaction.reply({ embeds: [embed] });
}

async function handleMonstros(interaction: ChatInputCommandInteraction) {
  const locationId = interaction.options.getString('local');

  let monsters;
  let title = '👹 Monstros';
  let locationInfo = '';

  if (locationId) {
    const location = rpgService.getLocation(locationId);
    if (!location) {
      await interaction.reply({ content: '❌ Localização não encontrada.', ephemeral: true });
      return;
    }
    monsters = rpgService.getMonstersInLocation(locationId);
    title = `👹 Monstros em ${location.emoji} ${location.name}`;
    locationInfo = `Nível recomendado: ${location.minLevel}-${location.maxLevel}\n\n`;
  } else {
    // Show first 15 monsters from stats
    const stats = rpgService.getMonsterStats();
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('👹 Sistema de Monstros')
          .setDescription(
            `**Total de Monstros:** ${stats.total}\n` +
            `**Localizações:** ${stats.totalLocations}\n\n` +
            `**Por Tier:**\n` +
            `🌱 Tier 1 (Iniciante): ${stats.byTier.tier1}\n` +
            `🌿 Tier 2 (Novato): ${stats.byTier.tier2}\n` +
            `🌲 Tier 3 (Intermediário): ${stats.byTier.tier3}\n` +
            `⚡ Tier 4 (Avançado): ${stats.byTier.tier4}\n` +
            `🔥 Tier 5 (Expert): ${stats.byTier.tier5}\n` +
            `💀 Tier 6 (Mestre): ${stats.byTier.tier6}\n\n` +
            `**Por Tipo:**\n` +
            `🟢 Normal: ${stats.byType.normal}\n` +
            `🟡 Elite: ${stats.byType.elite}\n` +
            `🔴 Boss: ${stats.byType.boss}`
          )
          .setColor('#FF6600')
          .setFooter({ text: 'Use: /rpg monstros local:<id> para ver monstros específicos' }),
      ],
    });
    return;
  }

  if (monsters.length === 0) {
    await interaction.reply({ content: '❌ Nenhum monstro nesta localização.', ephemeral: true });
    return;
  }

  const typeEmojis: Record<string, string> = {
    normal: '🟢',
    elite: '🟡',
    boss: '🔴',
  };

  // Limit to 10 monsters to avoid huge embeds
  const displayMonsters = monsters.slice(0, 10);
  const monsterList = displayMonsters.map(m => {
    const typeEmoji = typeEmojis[m.type] || '⚪';
    return `${typeEmoji} **${m.emoji} ${m.name}** (Lv.${m.level})\n` +
      `   HP: ${m.hp} | ATK: ${m.attack} | DEF: ${m.defense}\n` +
      `   XP: ${m.xpReward} | Coins: ${m.coinsReward.min}-${m.coinsReward.max}\n` +
      `   ID: \`${m.id}\``;
  }).join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(locationInfo + monsterList + (monsters.length > 10 ? `\n\n... e mais ${monsters.length - 10} monstros` : ''))
    .setColor('#FF6600')
    .addFields({
      name: 'Legenda',
      value: '🟢 Normal | 🟡 Elite | 🔴 Boss',
      inline: false,
    })
    .setFooter({ text: 'Use: /rpg batalhar <id> ou /rpg explorar <local>' });

  await interaction.reply({ embeds: [embed] });
}

async function handleRanking(interaction: ChatInputCommandInteraction) {
  const characters = await rpgService.getLeaderboard(10);

  if (characters.length === 0) {
    await interaction.reply({ content: '❌ Nenhum personagem criado ainda.', ephemeral: true });
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  const rankingList = characters.map((char, index) => {
    const medal = medals[index] || `**${index + 1}.**`;
    const classEmoji = rpgService.getClassEmoji(char.class);
    return `${medal} ${classEmoji} **${char.name}** - Lv.${char.level} (${char.experience} XP)\n` +
      `   Vitórias: ${char.battlesWon} | Bosses: ${char.bossKills}`;
  }).join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle('🏆 Ranking de Personagens')
    .setDescription(rankingList)
    .setColor('#FFD700')
    .setFooter({ text: 'Suba de nível e derrote bosses para subir no ranking!' });

  await interaction.reply({ embeds: [embed] });
}

function createProgressBar(current: number, max: number): string {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const filled = Math.floor(percentage / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
