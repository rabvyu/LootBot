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
import { equipmentService } from '../../services/equipmentService';
import { CharacterClass, BaseCharacterClass } from '../../database/models/Character';

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
  )
  .addSubcommand(sub =>
    sub.setName('tutorial').setDescription('Tutorial completo do bot - Aprenda todos os sistemas!')
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
    case 'tutorial':
      await handleTutorial(interaction);
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

    const selectedClass = selectInteraction.values[0] as BaseCharacterClass;
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

    if (result.equipmentDrop) {
      const eq = result.equipmentDrop;
      const rarityEmoji = equipmentService.getRarityEmoji(eq.rarity);
      rewardLines.push(`⚔️ **EQUIPAMENTO:** ${rarityEmoji} ${eq.name}`);
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

    if (result.equipmentDrop) {
      const eq = result.equipmentDrop;
      const rarityEmoji = equipmentService.getRarityEmoji(eq.rarity);
      rewardLines.push(`⚔️ **EQUIPAMENTO:** ${rarityEmoji} ${eq.name}`);
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

// Tutorial pages
const TUTORIAL_PAGES = [
  // Page 0: Welcome
  {
    title: '📖 Tutorial - Bem-vindo!',
    description: `**Bem-vindo ao Bot de Gamificacao!**

Este bot transforma seu servidor Discord em um RPG completo com:

🎮 **980 Equipamentos** em 16 sets diferentes
👹 **150 Monstros** em 32 localizacoes
🏅 **174 Badges** para conquistar
🐾 **10 Pets** para colecionar
⚔️ **Sistema de RPG** com 4 classes
💰 **Economia** com loja, cassino e trabalhos
🎯 **Missoes** diarias e semanais
📦 **Crafting** com 10 receitas
🗺️ **Expedicoes** e muito mais!

Use os botoes abaixo para navegar pelo tutorial.`,
    color: '#FFD700',
  },
  // Page 1: Getting Started
  {
    title: '📖 Tutorial - Primeiros Passos',
    description: `**Como Comecar:**

**1. Crie seu Personagem**
\`/rpg criar <nome>\`
Escolha entre 4 classes:
⚔️ **Guerreiro** - Alto HP e defesa
🔮 **Mago** - Alto dano magico e critico
🏹 **Arqueiro** - Criticos devastadores
🛡️ **Paladino** - Defesa maxima

**2. Ganhe XP no Servidor**
- Envie mensagens: 15-25 XP (cooldown 60s)
- Fique em call de voz: 5 XP/min
- De reacoes: 2 XP cada
- Receba reacoes: 5 XP cada

**3. Colete sua Recompensa Diaria**
\`/daily\` - Ganhe coins e XP diariamente!
Mantenha um streak para bonus!`,
    color: '#00FF00',
  },
  // Page 2: Combat System
  {
    title: '📖 Tutorial - Sistema de Combate',
    description: `**Batalhas e Exploracao:**

**Explorar Locais**
\`/rpg locais\` - Ver todas as 32 localizacoes
\`/rpg explorar <local>\` - Batalhar em um local

**Localizacoes por Tier:**
🌱 Tier 1 (Lv.1-7): Floresta, Planicie, Caverna...
🌿 Tier 2 (Lv.5-12): Pantano, Montanha...
🌲 Tier 3 (Lv.10-22): Vulcao, Cemiterio...
⚡ Tier 4 (Lv.20-35): Castelo, Abismo...
🔥 Tier 5 (Lv.35-52): Inferno, Templo...
💀 Tier 6 (Lv.50-80): Void, Dragao...

**Tipos de Monstros:**
🟢 Normal - Faceis, drops basicos
🟡 Elite - Mais fortes, melhores drops
🔴 Boss - Muito fortes, drops raros

**Curar**
\`/rpg curar\` - Restaura HP (custa coins)`,
    color: '#FF6600',
  },
  // Page 3: Taming System
  {
    title: '📖 Tutorial - Sistema de Doma',
    description: `**Capture e Treine Monstros!**

**Como Capturar:**
1. Derrote um monstro em \`/rpg explorar\`
2. Clique no botao "Tentar Capturar"
3. Chance de captura baseada no HP restante

**Gerenciar Monstros:**
\`/domar lista\` - Ver seus monstros
\`/domar ativo\` - Ver monstro ativo
\`/domar selecionar <nome>\` - Trocar ativo
\`/domar alimentar <comida>\` - Alimentar
\`/domar curar\` - Curar monstro
\`/domar batalhar <local>\` - Batalhar com pet

**Tipos de Comida:**
🍞 Pao (50 coins) | 🐟 Peixe (100 coins)
🍖 Carne (150 coins) | 🎂 Bolo (200 coins)
🧪 Elixir (500 coins)

Maximo: 10 monstros domados`,
    color: '#9B59B6',
  },
  // Page 4: Equipment System
  {
    title: '📖 Tutorial - Sistema de Equipamentos',
    description: `**980 Equipamentos em 16 Sets!**

**Slots de Equipamento:**
⚔️ Arma | 🛡️ Armadura | ⛑️ Elmo
👢 Botas | 🧤 Luvas | 💍 Anel | 📿 Amuleto

**Raridades:**
⬜ Comum | 🟢 Incomum | 🔵 Raro
🟣 Epico | 🟡 Lendario

**Comandos:**
\`/equipamento inventario\` - Ver itens
\`/equipamento equipados\` - Ver equipados
\`/equipamento equipar <id>\` - Equipar item
\`/equipamento desequipar <slot>\` - Remover
\`/equipamento vender <id>\` - Vender por coins

**Bonus de Set:**
Equipe 2+ pecas do mesmo set para bonus!
4 pecas = bonus ainda maior!

Sets: Iniciante, Cacador, Lobisomem, Assassino,
Elemental, Vampiro, Infernal, Celestial, Draconico...`,
    color: '#8B4513',
  },
  // Page 5: Jobs & Training
  {
    title: '📖 Tutorial - Trabalhos e Treinamento',
    description: `**Ganhe Coins e XP Passivamente!**

**Sistema de Trabalhos:**
\`/trabalho lista\` - Ver trabalhos
\`/trabalho aceitar <trabalho>\` - Aceitar
\`/trabalho turno\` - Completar turno
\`/trabalho status\` - Ver status

Trabalhos: Taverneiro, Mensageiro, Guarda,
Ferreiro, Pescador, Lenhador, Mineiro...

**Sistema de Treinamento:**
\`/treinar lista\` - Ver opcoes
\`/treinar iniciar <tipo>\` - Comecar
\`/treinar coletar\` - Coletar XP
\`/treinar parar\` - Parar treino

Tipos: Socar Arvore, Chutar Arvore, Cortar,
Minerar, Meditar, Correr, Nadar, Escalar

XP acumula automaticamente (max 8h)!`,
    color: '#DAA520',
  },
  // Page 6: Pets & Resources
  {
    title: '📖 Tutorial - Pets e Recursos',
    description: `**10 Pets para Colecionar!**

**Comandos de Pet:**
\`/pet lista\` - Ver pets disponiveis
\`/pet comprar <pet>\` - Comprar pet
\`/pet meus\` - Ver seus pets
\`/pet ativar <pet>\` - Ativar pet
\`/pet alimentar\` - Alimentar pet
\`/pet coletar\` - Coletar coins/XP

Pets geram coins e XP por hora!

**Sistema de Recursos:**
\`/recursos\` - Ver seus recursos
\`/pescar\` - Pescar peixes

Recursos: 🪵 Madeira, 🪨 Pedra, 🔩 Ferro,
🥇 Ouro, 💎 Diamante, ✨ Essencia

Use recursos para crafting!`,
    color: '#00CED1',
  },
  // Page 7: Crafting & Expeditions
  {
    title: '📖 Tutorial - Crafting e Expedicoes',
    description: `**Crie Itens e Explore!**

**Crafting (10 Receitas):**
\`/crafting receitas\` - Ver receitas
\`/crafting criar <receita>\` - Criar item
\`/crafting info <receita>\` - Detalhes

Crie: Barras de metal, Pocoes de XP,
Varas de pesca, Ovos de pet, Amuletos...

**Expedicoes (7 Disponíveis):**
\`/expedicao lista\` - Ver expedicoes
\`/expedicao iniciar <exp>\` - Iniciar
\`/expedicao status\` - Ver progresso
\`/expedicao resgatar\` - Coletar rewards

Dificuldades: Facil, Medio, Dificil, Extremo
Duracoes: 1h ate 24h
Rewards: Coins, XP, Recursos, Badges raras!`,
    color: '#9C27B0',
  },
  // Page 8: Groups & Economy
  {
    title: '📖 Tutorial - Grupos e Economia',
    description: `**Jogue em Grupo!**

**Sistema de Grupos (1-8 jogadores):**
\`/grupo criar\` - Criar grupo
\`/grupo convidar @user\` - Convidar
\`/grupo batalhar <local>\` - Batalha em grupo
\`/grupo info\` - Ver membros

Rewards divididos por contribuicao!

**Economia:**
\`/saldo\` - Ver seus coins
\`/transferir @user <valor>\` - Enviar coins
\`/loja\` - Comprar itens
\`/comprar <item>\` - Comprar item

**Cassino:**
\`/cassino coinflip\` - Cara ou coroa
\`/cassino dados\` - Jogo de dados
\`/cassino slots\` - Maquina de slots
\`/cassino roleta\` - Roleta
\`/cassino crash\` - Crash game`,
    color: '#E91E63',
  },
  // Page 9: Badges & Leaderboard
  {
    title: '📖 Tutorial - Badges e Rankings',
    description: `**174 Badges para Conquistar!**

**Categorias de Badges:**
🎯 **Nivel** - Por alcancar niveis
📅 **Tempo** - Por tempo no servidor
🏆 **Conquistas** - Por acoes especificas
⭐ **Especiais** - Eventos e raras

\`/badges\` - Ver suas badges
\`/badges @user\` - Ver de outro usuario

**Leaderboards:**
\`/leaderboard\` - Top 10 por XP
\`/rank\` - Ver seu rank
\`/rpg ranking\` - Top personagens RPG

**Outros Comandos Uteis:**
\`/profile\` - Seu perfil completo
\`/stats\` - Estatisticas do servidor
\`/streak\` - Ver seu streak
\`/missoes\` - Missoes diarias/semanais
\`/help\` - Lista de comandos`,
    color: '#3F51B5',
  },
  // Page 10: Summary
  {
    title: '📖 Tutorial - Resumo Final',
    description: `**Resumo dos Sistemas:**

⚔️ **RPG**: 4 classes, 150 monstros, 32 locais
🎒 **Equipamentos**: 980 itens, 16 sets
🐾 **Doma**: Capture e treine monstros
🐕 **Pets**: 10 pets que geram recursos
💼 **Trabalhos**: 10 profissoes
🏋️ **Treino**: 8 tipos de treino idle
📦 **Crafting**: 10 receitas
🗺️ **Expedicoes**: 7 expedicoes
👥 **Grupos**: Batalhas cooperativas
🎰 **Cassino**: 6 jogos de aposta
🏅 **Badges**: 174 conquistas
💰 **Economia**: Loja, transferencias

**Dica Final:**
Comece com \`/rpg criar\` e \`/daily\`!
Explore, batalhe, e divirta-se!

Boa sorte, aventureiro! ⚔️`,
    color: '#4CAF50',
  },
];

async function handleTutorial(interaction: ChatInputCommandInteraction) {
  let currentPage = 0;

  const createTutorialEmbed = (pageIndex: number): EmbedBuilder => {
    const page = TUTORIAL_PAGES[pageIndex];
    return new EmbedBuilder()
      .setTitle(page.title)
      .setDescription(page.description)
      .setColor(page.color as `#${string}`)
      .setFooter({ text: `Pagina ${pageIndex + 1}/${TUTORIAL_PAGES.length} | Use os botoes para navegar` });
  };

  const createButtons = (pageIndex: number): ActionRowBuilder<ButtonBuilder> => {
    const row = new ActionRowBuilder<ButtonBuilder>();

    // First page button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('tutorial_first')
        .setLabel('⏮️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pageIndex === 0)
    );

    // Previous button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('tutorial_prev')
        .setLabel('◀️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pageIndex === 0)
    );

    // Page indicator
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('tutorial_page')
        .setLabel(`${pageIndex + 1}/${TUTORIAL_PAGES.length}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    // Next button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('tutorial_next')
        .setLabel('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pageIndex === TUTORIAL_PAGES.length - 1)
    );

    // Last page button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('tutorial_last')
        .setLabel('⏭️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pageIndex === TUTORIAL_PAGES.length - 1)
    );

    return row;
  };

  const response = await interaction.reply({
    embeds: [createTutorialEmbed(currentPage)],
    components: [createButtons(currentPage)],
    fetchReply: true,
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => i.user.id === interaction.user.id,
    time: 300000, // 5 minutes
  });

  collector.on('collect', async (buttonInteraction) => {
    switch (buttonInteraction.customId) {
      case 'tutorial_first':
        currentPage = 0;
        break;
      case 'tutorial_prev':
        currentPage = Math.max(0, currentPage - 1);
        break;
      case 'tutorial_next':
        currentPage = Math.min(TUTORIAL_PAGES.length - 1, currentPage + 1);
        break;
      case 'tutorial_last':
        currentPage = TUTORIAL_PAGES.length - 1;
        break;
    }

    await buttonInteraction.update({
      embeds: [createTutorialEmbed(currentPage)],
      components: [createButtons(currentPage)],
    });
  });

  collector.on('end', async () => {
    try {
      await interaction.editReply({
        components: [],
      });
    } catch {
      // Message might be deleted
    }
  });
}
