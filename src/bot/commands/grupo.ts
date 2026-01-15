import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { partyService } from '../../services/partyService';

export const data = new SlashCommandBuilder()
  .setName('grupo')
  .setDescription('Sistema de grupos para batalhas cooperativas')
  .addSubcommand(sub =>
    sub.setName('criar').setDescription('Criar um novo grupo')
  )
  .addSubcommand(sub =>
    sub
      .setName('convidar')
      .setDescription('Convidar um jogador para o grupo')
      .addUserOption(opt =>
        opt.setName('usuario').setDescription('Usuario para convidar').setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub.setName('sair').setDescription('Sair do grupo atual')
  )
  .addSubcommand(sub =>
    sub.setName('dissolver').setDescription('Dissolver o grupo (apenas lider)')
  )
  .addSubcommand(sub =>
    sub.setName('info').setDescription('Ver informacoes do grupo')
  )
  .addSubcommand(sub =>
    sub
      .setName('batalhar')
      .setDescription('Iniciar batalha em grupo')
      .addStringOption(opt =>
        opt.setName('local').setDescription('ID da localizacao').setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('expulsar')
      .setDescription('Expulsar um membro do grupo (apenas lider)')
      .addUserOption(opt =>
        opt.setName('usuario').setDescription('Usuario para expulsar').setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'criar':
      await handleCriar(interaction);
      break;
    case 'convidar':
      await handleConvidar(interaction);
      break;
    case 'sair':
      await handleSair(interaction);
      break;
    case 'dissolver':
      await handleDissolver(interaction);
      break;
    case 'info':
      await handleInfo(interaction);
      break;
    case 'batalhar':
      await handleBatalhar(interaction);
      break;
    case 'expulsar':
      await handleExpulsar(interaction);
      break;
  }
}

async function handleCriar(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const username = interaction.user.username;

  const result = await partyService.createParty(discordId, username);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('Grupo Criado!')
      .setDescription(result.message)
      .setColor('#00FF00');
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: `${result.message}`, ephemeral: true });
  }
}

async function handleConvidar(interaction: ChatInputCommandInteraction) {
  const leaderId = interaction.user.id;
  const target = interaction.options.getUser('usuario', true);

  if (target.bot) {
    await interaction.reply({ content: 'Voce nao pode convidar bots.', ephemeral: true });
    return;
  }

  const result = await partyService.inviteMember(leaderId, target.id, target.username);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('Membro Adicionado!')
      .setDescription(result.message)
      .setColor('#00FF00');
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: `${result.message}`, ephemeral: true });
  }
}

async function handleSair(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;

  const result = await partyService.leaveParty(discordId);

  if (result.success) {
    await interaction.reply({ content: result.message });
  } else {
    await interaction.reply({ content: `${result.message}`, ephemeral: true });
  }
}

async function handleDissolver(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;

  const result = await partyService.disbandParty(discordId);

  if (result.success) {
    await interaction.reply({ content: result.message });
  } else {
    await interaction.reply({ content: `${result.message}`, ephemeral: true });
  }
}

async function handleInfo(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const party = await partyService.getPartyInfo(discordId);

  if (!party) {
    await interaction.reply({
      content: 'Voce nao esta em um grupo. Use `/grupo criar` para criar um.',
      ephemeral: true,
    });
    return;
  }

  const memberList = party.members.map((m, i) => {
    const isLeader = m.odiscordId === party.leaderId;
    const badge = isLeader ? '👑 ' : '';
    return `${badge}**${m.username}**\n   Contribuicao: ${m.contribution} | Dano Total: ${m.damageDealt}`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setTitle(`Grupo de ${party.leaderName}`)
    .setDescription(
      `**Membros:** ${party.members.length}/${party.maxSize}\n` +
      `**Status:** ${party.inBattle ? 'Em Batalha' : 'Disponivel'}\n\n` +
      `**Batalhas:** ${party.totalBattles} | **Vitorias:** ${party.totalWins}\n\n` +
      `**Membros:**\n${memberList}`
    )
    .setColor('#9B59B6')
    .setFooter({ text: '👑 = Lider | Use /grupo batalhar para lutar' });

  await interaction.reply({ embeds: [embed] });
}

async function handleBatalhar(interaction: ChatInputCommandInteraction) {
  const leaderId = interaction.user.id;
  const locationId = interaction.options.getString('local', true);

  await interaction.deferReply();

  const result = await partyService.partyBattle(leaderId, locationId);

  if ('error' in result) {
    await interaction.editReply({ content: `${result.error}` });
    return;
  }

  const color = result.victory ? '#00FF00' : '#FF0000';
  const title = result.victory
    ? `Vitoria! ${result.monsterEmoji} ${result.monsterName} derrotado!`
    : `Derrota para ${result.monsterEmoji} ${result.monsterName}...`;

  const displayRounds = result.rounds.slice(-12);
  const roundsText = displayRounds.join('\n');

  const rewardsText = result.memberResults.map(m =>
    `**${m.username}** (${m.contributionPercent}%)\n` +
    `   Dano: ${m.damageDealt} | XP: +${m.xpEarned} | Coins: +${m.coinsEarned}`
  ).join('\n');

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(roundsText)
    .addFields({ name: 'Recompensas por Contribuicao', value: rewardsText, inline: false })
    .setColor(color)
    .setFooter({ text: `Dano total: ${result.totalDamage}` });

  await interaction.editReply({ embeds: [embed] });
}

async function handleExpulsar(interaction: ChatInputCommandInteraction) {
  const leaderId = interaction.user.id;
  const target = interaction.options.getUser('usuario', true);

  const result = await partyService.kickMember(leaderId, target.id);

  if (result.success) {
    await interaction.reply({ content: result.message });
  } else {
    await interaction.reply({ content: `${result.message}`, ephemeral: true });
  }
}
