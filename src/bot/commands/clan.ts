import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { clanService } from '../../services/clanService';
import { ClanRole } from '../../database/models/ClanMember';

export const data = new SlashCommandBuilder()
  .setName('clan')
  .setDescription('Sistema de clãs')
  .addSubcommand(sub =>
    sub
      .setName('criar')
      .setDescription('Criar um novo clã')
      .addStringOption(opt =>
        opt
          .setName('nome')
          .setDescription('Nome do clã')
          .setRequired(true)
          .setMinLength(3)
          .setMaxLength(25)
      )
      .addStringOption(opt =>
        opt
          .setName('tag')
          .setDescription('Tag do clã (2-5 caracteres)')
          .setRequired(true)
          .setMinLength(2)
          .setMaxLength(5)
      )
      .addStringOption(opt =>
        opt.setName('emoji').setDescription('Emoji do clã').setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub.setName('info').setDescription('Ver informações do seu clã')
  )
  .addSubcommand(sub =>
    sub
      .setName('entrar')
      .setDescription('Entrar em um clã público')
      .addStringOption(opt =>
        opt.setName('id').setDescription('ID do clã').setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub.setName('sair').setDescription('Sair do clã atual')
  )
  .addSubcommand(sub =>
    sub.setName('dissolver').setDescription('Dissolver o clã (apenas líder)')
  )
  .addSubcommand(sub =>
    sub.setName('membros').setDescription('Ver membros do clã')
  )
  .addSubcommand(sub =>
    sub.setName('listar').setDescription('Ver clãs públicos disponíveis')
  )
  .addSubcommand(sub =>
    sub.setName('ranking').setDescription('Ver ranking de clãs')
  )
  .addSubcommand(sub =>
    sub
      .setName('contribuir')
      .setDescription('Contribuir coins para o clã')
      .addIntegerOption(opt =>
        opt
          .setName('quantidade')
          .setDescription('Quantidade de coins')
          .setRequired(true)
          .setMinValue(1)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('promover')
      .setDescription('Promover um membro')
      .addUserOption(opt =>
        opt.setName('membro').setDescription('Membro para promover').setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('rebaixar')
      .setDescription('Rebaixar um membro')
      .addUserOption(opt =>
        opt.setName('membro').setDescription('Membro para rebaixar').setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('expulsar')
      .setDescription('Expulsar um membro')
      .addUserOption(opt =>
        opt.setName('membro').setDescription('Membro para expulsar').setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('transferir')
      .setDescription('Transferir liderança (apenas líder)')
      .addUserOption(opt =>
        opt.setName('membro').setDescription('Novo líder').setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'criar':
      await handleCriar(interaction);
      break;
    case 'info':
      await handleInfo(interaction);
      break;
    case 'entrar':
      await handleEntrar(interaction);
      break;
    case 'sair':
      await handleSair(interaction);
      break;
    case 'dissolver':
      await handleDissolver(interaction);
      break;
    case 'membros':
      await handleMembros(interaction);
      break;
    case 'listar':
      await handleListar(interaction);
      break;
    case 'ranking':
      await handleRanking(interaction);
      break;
    case 'contribuir':
      await handleContribuir(interaction);
      break;
    case 'promover':
      await handlePromover(interaction);
      break;
    case 'rebaixar':
      await handleRebaixar(interaction);
      break;
    case 'expulsar':
      await handleExpulsar(interaction);
      break;
    case 'transferir':
      await handleTransferir(interaction);
      break;
  }
}

async function handleCriar(interaction: ChatInputCommandInteraction) {
  const nome = interaction.options.getString('nome', true);
  const tag = interaction.options.getString('tag', true);
  const emoji = interaction.options.getString('emoji') || '⚔️';

  const result = await clanService.createClan(interaction.user.id, nome, tag, emoji);

  if (result.success && result.clan) {
    const embed = new EmbedBuilder()
      .setTitle('🏰 Clã Criado!')
      .setDescription(result.message)
      .addFields(
        { name: 'Nome', value: `${result.clan.emoji} ${result.clan.name}`, inline: true },
        { name: 'Tag', value: `[${result.clan.tag}]`, inline: true },
        { name: 'ID', value: result.clan.id, inline: true },
        { name: 'Nível', value: `${result.clan.level}`, inline: true },
        { name: 'Membros', value: `${result.clan.memberCount}/${result.clan.maxMembers}`, inline: true }
      )
      .setColor('#FFD700')
      .setFooter({ text: `Custo: ${clanService.getCreationCost()} coins` });

    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
  }
}

async function handleInfo(interaction: ChatInputCommandInteraction) {
  const { clan, member } = await clanService.getUserClan(interaction.user.id);

  if (!clan || !member) {
    await interaction.reply({
      content: '❌ Você não faz parte de um clã! Use `/clan listar` para ver clãs disponíveis.',
      ephemeral: true,
    });
    return;
  }

  const xpNeeded = clanService.getXpForLevel(clan.level);
  const xpProgress = Math.floor((clan.experience / xpNeeded) * 100);
  const xpBar = createProgressBar(clan.experience, xpNeeded);

  const embed = new EmbedBuilder()
    .setTitle(`${clan.emoji} ${clan.name} [${clan.tag}]`)
    .setDescription(clan.description)
    .addFields(
      { name: '📊 Nível', value: `${clan.level}`, inline: true },
      { name: '✨ XP', value: `${clan.experience}/${xpNeeded}`, inline: true },
      { name: '💰 Cofre', value: `${clan.coins.toLocaleString()}`, inline: true },
      { name: '👥 Membros', value: `${clan.memberCount}/${clan.maxMembers}`, inline: true },
      { name: '🏆 Vitórias', value: `${clan.wins}`, inline: true },
      { name: '⚔️ Guerras', value: `${clan.warWins}`, inline: true },
      { name: '📈 Progresso', value: `${xpBar} ${xpProgress}%`, inline: false },
      { name: '🎖️ Seu Cargo', value: clanService.getRoleName(member.role as ClanRole), inline: true },
      { name: '💎 Sua Contribuição', value: `${member.coinsContributed} coins`, inline: true },
      { name: '🆔 ID do Clã', value: `\`${clan.id}\``, inline: false }
    )
    .setColor('#4169E1')
    .setFooter({ text: clan.isPublic ? '🔓 Clã Público' : '🔒 Clã Privado' });

  await interaction.reply({ embeds: [embed] });
}

async function handleEntrar(interaction: ChatInputCommandInteraction) {
  const clanId = interaction.options.getString('id', true);
  const result = await clanService.joinClan(interaction.user.id, clanId);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('🎉 Bem-vindo ao Clã!')
      .setDescription(result.message)
      .setColor('#00FF00');
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
  }
}

async function handleSair(interaction: ChatInputCommandInteraction) {
  const result = await clanService.leaveClan(interaction.user.id);

  if (result.success) {
    await interaction.reply({ content: `👋 ${result.message}` });
  } else {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
  }
}

async function handleDissolver(interaction: ChatInputCommandInteraction) {
  const result = await clanService.disbandClan(interaction.user.id);

  if (result.success) {
    await interaction.reply({ content: `💔 ${result.message}` });
  } else {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
  }
}

async function handleMembros(interaction: ChatInputCommandInteraction) {
  const { clan } = await clanService.getUserClan(interaction.user.id);

  if (!clan) {
    await interaction.reply({
      content: '❌ Você não faz parte de um clã!',
      ephemeral: true,
    });
    return;
  }

  const members = await clanService.getClanMembers(clan.id);
  const client = interaction.client;

  const roleEmojis: Record<string, string> = {
    leader: '👑',
    'co-leader': '⭐',
    elder: '🔹',
    member: '•',
  };

  const memberLines = await Promise.all(
    members.map(async (m) => {
      try {
        const user = await client.users.fetch(m.discordId);
        const emoji = roleEmojis[m.role] || '•';
        const roleName = clanService.getRoleName(m.role as ClanRole);
        return `${emoji} **${user.username}** - ${roleName} (${m.coinsContributed} coins)`;
      } catch {
        return `${roleEmojis[m.role] || '•'} Usuário Desconhecido`;
      }
    })
  );

  const embed = new EmbedBuilder()
    .setTitle(`👥 Membros de ${clan.emoji} ${clan.name}`)
    .setDescription(memberLines.join('\n') || 'Nenhum membro.')
    .setColor('#4169E1')
    .setFooter({ text: `${clan.memberCount}/${clan.maxMembers} membros` });

  await interaction.reply({ embeds: [embed] });
}

async function handleListar(interaction: ChatInputCommandInteraction) {
  const clans = await clanService.getPublicClans();

  if (clans.length === 0) {
    await interaction.reply({
      content: '❌ Nenhum clã público disponível. Seja o primeiro a criar um!',
      ephemeral: true,
    });
    return;
  }

  const clanList = clans
    .map((c, i) => {
      return `**${i + 1}.** ${c.emoji} **${c.name}** [${c.tag}]\n` +
        `   Nível ${c.level} | ${c.memberCount}/${c.maxMembers} membros\n` +
        `   ID: \`${c.id}\``;
    })
    .join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle('🏰 Clãs Públicos')
    .setDescription(clanList)
    .setColor('#4169E1')
    .setFooter({ text: 'Use /clan entrar <id> para entrar em um clã' });

  await interaction.reply({ embeds: [embed] });
}

async function handleRanking(interaction: ChatInputCommandInteraction) {
  const clans = await clanService.getClanLeaderboard();

  if (clans.length === 0) {
    await interaction.reply({
      content: '❌ Nenhum clã registrado ainda.',
      ephemeral: true,
    });
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  const rankingList = clans
    .map((c, i) => {
      const medal = medals[i] || `**${i + 1}.**`;
      return `${medal} ${c.emoji} **${c.name}** [${c.tag}]\n` +
        `   Nível ${c.level} | XP Total: ${c.totalXPContributed.toLocaleString()}`;
    })
    .join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle('🏆 Ranking de Clãs')
    .setDescription(rankingList)
    .setColor('#FFD700');

  await interaction.reply({ embeds: [embed] });
}

async function handleContribuir(interaction: ChatInputCommandInteraction) {
  const quantidade = interaction.options.getInteger('quantidade', true);
  const result = await clanService.contributeCoins(interaction.user.id, quantidade);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('💰 Contribuição Feita!')
      .setDescription(result.message)
      .setColor('#00FF00');

    if (result.clan) {
      embed.addFields(
        { name: 'Cofre do Clã', value: `${result.clan.coins.toLocaleString()} coins`, inline: true }
      );
    }

    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
  }
}

async function handlePromover(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('membro', true);
  const result = await clanService.promoteMember(interaction.user.id, target.id);

  if (result.success) {
    await interaction.reply({ content: `⬆️ ${result.message}` });
  } else {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
  }
}

async function handleRebaixar(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('membro', true);
  const result = await clanService.demoteMember(interaction.user.id, target.id);

  if (result.success) {
    await interaction.reply({ content: `⬇️ ${result.message}` });
  } else {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
  }
}

async function handleExpulsar(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('membro', true);
  const result = await clanService.kickMember(interaction.user.id, target.id);

  if (result.success) {
    await interaction.reply({ content: `🚫 ${result.message}` });
  } else {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
  }
}

async function handleTransferir(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser('membro', true);
  const result = await clanService.transferLeadership(interaction.user.id, target.id);

  if (result.success) {
    await interaction.reply({ content: `👑 ${result.message}` });
  } else {
    await interaction.reply({ content: `❌ ${result.message}`, ephemeral: true });
  }
}

function createProgressBar(current: number, max: number): string {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const filled = Math.floor(percentage / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
