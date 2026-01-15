import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { tamingService } from '../../services/tamingService';
import { rpgService } from '../../services/rpgService';

export const data = new SlashCommandBuilder()
  .setName('domar')
  .setDescription('Sistema de doma de monstros')
  .addSubcommand(sub =>
    sub.setName('lista').setDescription('Ver seus monstros domados')
  )
  .addSubcommand(sub =>
    sub.setName('ativo').setDescription('Ver seu monstro ativo')
  )
  .addSubcommand(sub =>
    sub
      .setName('selecionar')
      .setDescription('Selecionar monstro ativo')
      .addStringOption(opt =>
        opt
          .setName('nome')
          .setDescription('Nome ou ID do monstro')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('alimentar')
      .setDescription('Alimentar seu monstro ativo')
      .addStringOption(opt =>
        opt
          .setName('comida')
          .setDescription('Tipo de comida')
          .setRequired(true)
          .addChoices(
            { name: 'Pão (50 coins)', value: 'bread' },
            { name: 'Peixe (100 coins)', value: 'fish' },
            { name: 'Carne (150 coins)', value: 'meat' },
            { name: 'Bolo (200 coins)', value: 'cake' },
            { name: 'Elixir (500 coins)', value: 'elixir' }
          )
      )
  )
  .addSubcommand(sub =>
    sub.setName('curar').setDescription('Curar seu monstro ativo')
  )
  .addSubcommand(sub =>
    sub
      .setName('renomear')
      .setDescription('Renomear seu monstro ativo')
      .addStringOption(opt =>
        opt
          .setName('nome')
          .setDescription('Novo nome')
          .setRequired(true)
          .setMinLength(2)
          .setMaxLength(20)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('liberar')
      .setDescription('Liberar um monstro')
      .addStringOption(opt =>
        opt
          .setName('nome')
          .setDescription('Nome ou ID do monstro')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('batalhar')
      .setDescription('Batalhar com seu monstro domado')
      .addStringOption(opt =>
        opt
          .setName('local')
          .setDescription('ID da localização')
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'lista':
      await handleLista(interaction);
      break;
    case 'ativo':
      await handleAtivo(interaction);
      break;
    case 'selecionar':
      await handleSelecionar(interaction);
      break;
    case 'alimentar':
      await handleAlimentar(interaction);
      break;
    case 'curar':
      await handleCurar(interaction);
      break;
    case 'renomear':
      await handleRenomear(interaction);
      break;
    case 'liberar':
      await handleLiberar(interaction);
      break;
    case 'batalhar':
      await handleBatalhar(interaction);
      break;
  }
}

async function handleLista(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const monsters = await tamingService.getTamedMonsters(discordId);

  if (monsters.length === 0) {
    await interaction.reply({
      content: '❌ Você não tem monstros domados. Capture-os durante batalhas!',
      ephemeral: true,
    });
    return;
  }

  const monsterList = monsters.map((m, i) => {
    const active = m.isActive ? '⭐ ' : '';
    const hpBar = createBar(m.stats.hp, m.stats.maxHp, 5);
    return `${active}**${m.emoji} ${m.nickname}** (Lv.${m.level})\n` +
      `   ❤️ ${hpBar} ${m.stats.hp}/${m.stats.maxHp}\n` +
      `   😊 ${m.stats.happiness}% | 💖 ${m.stats.loyalty}%`;
  }).join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle('🐾 Seus Monstros Domados')
    .setDescription(monsterList)
    .setColor('#9B59B6')
    .setFooter({ text: `${monsters.length}/10 monstros | ⭐ = Ativo` });

  await interaction.reply({ embeds: [embed] });
}

async function handleAtivo(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const monster = await tamingService.getActiveMonster(discordId);

  if (!monster) {
    await interaction.reply({
      content: '❌ Você não tem um monstro ativo! Use `/domar selecionar`',
      ephemeral: true,
    });
    return;
  }

  const xpNeeded = tamingService.getXpForLevel(monster.level);
  const xpProgress = Math.floor((monster.experience / xpNeeded) * 100);

  const embed = new EmbedBuilder()
    .setTitle(`${monster.emoji} ${monster.nickname}`)
    .setDescription(`**${monster.originalName}** - Nível ${monster.level}`)
    .addFields(
      { name: '❤️ HP', value: `${createBar(monster.stats.hp, monster.stats.maxHp, 10)} ${monster.stats.hp}/${monster.stats.maxHp}`, inline: false },
      { name: '✨ XP', value: `${createBar(monster.experience, xpNeeded, 10)} ${monster.experience}/${xpNeeded} (${xpProgress}%)`, inline: false },
      { name: '⚔️ Ataque', value: `${monster.stats.attack}`, inline: true },
      { name: '🛡️ Defesa', value: `${monster.stats.defense}`, inline: true },
      { name: '😊 Felicidade', value: `${monster.stats.happiness}%`, inline: true },
      { name: '💖 Lealdade', value: `${monster.stats.loyalty}%`, inline: true },
      { name: '🏆 Vitórias', value: `${monster.battlesWon}`, inline: true },
      { name: '💀 Derrotas', value: `${monster.battlesLost}`, inline: true }
    )
    .setColor(monster.stats.hp > 0 ? '#9B59B6' : '#FF0000')
    .setFooter({ text: `Capturado em ${monster.capturedAt.toLocaleDateString()}` });

  await interaction.reply({ embeds: [embed] });
}

async function handleSelecionar(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const nome = interaction.options.getString('nome', true);

  const result = await tamingService.setActiveMonster(discordId, nome);

  if (result.success) {
    await interaction.reply({ content: `✅ ${result.message}` });
  } else {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
  }
}

async function handleAlimentar(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const comida = interaction.options.getString('comida', true);

  const result = await tamingService.feedMonster(discordId, comida);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('🍖 Monstro Alimentado!')
      .setDescription(result.message)
      .setColor('#00FF00');
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
  }
}

async function handleCurar(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const result = await tamingService.healTamedMonster(discordId);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('💚 Monstro Curado!')
      .setDescription(result.message)
      .setColor('#00FF00');
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
  }
}

async function handleRenomear(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const nome = interaction.options.getString('nome', true);

  const result = await tamingService.renameMonster(discordId, nome);

  if (result.success) {
    await interaction.reply({ content: `✅ ${result.message}` });
  } else {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
  }
}

async function handleLiberar(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const nome = interaction.options.getString('nome', true);

  const result = await tamingService.releaseMonster(discordId, nome);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('👋 Monstro Liberado')
      .setDescription(result.message)
      .setColor('#FFA500');
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
  }
}

async function handleBatalhar(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const locationId = interaction.options.getString('local', true);

  await interaction.deferReply();

  // Get a random monster from location
  const character = await rpgService.getCharacter(discordId);
  const charLevel = character?.level || 1;
  const enemyData = rpgService.getRandomMonster(charLevel, locationId);

  if (!enemyData) {
    await interaction.editReply({ content: '❌ Nenhum monstro encontrado nessa localização.' });
    return;
  }

  const result = await tamingService.battleWithTamed(discordId, enemyData);

  if ('error' in result) {
    await interaction.editReply({ content: `❌ ${result.error}` });
    return;
  }

  const color = result.victory ? '#00FF00' : '#FF0000';
  const title = result.victory
    ? `🎉 Vitória contra ${enemyData.emoji} ${enemyData.name}!`
    : `💀 Derrota para ${enemyData.emoji} ${enemyData.name}...`;

  const displayRounds = result.rounds.slice(-8);

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(displayRounds.join('\n'))
    .setColor(color);

  if (result.victory) {
    embed.addFields({ name: '✨ XP Ganho', value: `+${result.xpEarned}`, inline: true });
  }

  embed.addFields(
    { name: '⚔️ Dano Causado', value: `${result.damageDealt}`, inline: true },
    { name: '💥 Dano Recebido', value: `${result.damageTaken}`, inline: true }
  );

  if (result.monsterDied) {
    embed.setFooter({ text: '💀 Seu monstro morreu! Use /domar curar' });
  }

  await interaction.editReply({ embeds: [embed] });
}

function createBar(current: number, max: number, length: number): string {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const filled = Math.floor((percentage / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
