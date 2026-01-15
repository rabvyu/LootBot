import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ComponentType,
} from 'discord.js';
import { rpgService } from '../../services/rpgService';
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
      .setDescription('Batalhar contra um monstro')
      .addStringOption(opt =>
        opt
          .setName('monstro')
          .setDescription('ID do monstro para batalhar')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub.setName('curar').setDescription('Curar seu personagem (custa coins)')
  )
  .addSubcommand(sub =>
    sub.setName('monstros').setDescription('Ver lista de monstros disponíveis')
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
    .setColor(character.stats.hp > 0 ? '#00FF00' : '#FF0000')
    .setFooter({ text: character.stats.hp <= 0 ? '💀 Seu personagem está morto! Use /rpg curar' : '' });

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

async function handleMonstros(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const character = await rpgService.getCharacter(discordId);

  let monsters;
  if (character) {
    monsters = await rpgService.getMonstersByLevel(character.level);
  } else {
    monsters = await rpgService.getMonsters();
  }

  if (monsters.length === 0) {
    await interaction.reply({ content: '❌ Nenhum monstro disponível.', ephemeral: true });
    return;
  }

  const typeEmojis: Record<string, string> = {
    normal: '🟢',
    elite: '🟡',
    boss: '🔴',
  };

  const monsterList = monsters.map(m => {
    const typeEmoji = typeEmojis[m.type] || '⚪';
    return `${typeEmoji} **${m.emoji} ${m.name}** (Lv.${m.level})\n` +
      `   HP: ${m.hp} | ATK: ${m.attack} | DEF: ${m.defense}\n` +
      `   XP: ${m.xpReward} | Coins: ${m.coinsReward.min}-${m.coinsReward.max}\n` +
      `   ID: \`${m.id}\``;
  }).join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle('👹 Monstros Disponíveis')
    .setDescription(monsterList)
    .setColor('#FF6600')
    .addFields({
      name: 'Legenda',
      value: '🟢 Normal | 🟡 Elite | 🔴 Boss',
      inline: false,
    })
    .setFooter({ text: 'Use: /rpg batalhar <id> para lutar!' });

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
