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
import { guildService } from '../../services/guildService';
import { GuildRole } from '../../database/models';

export const data = new SlashCommandBuilder()
  .setName('guilda')
  .setDescription('Sistema de Guildas')
  .addSubcommand(sub =>
    sub
      .setName('criar')
      .setDescription('Criar uma nova guilda (50.000 coins)')
      .addStringOption(opt =>
        opt
          .setName('nome')
          .setDescription('Nome da guilda (3-32 caracteres)')
          .setRequired(true)
          .setMinLength(3)
          .setMaxLength(32)
      )
      .addStringOption(opt =>
        opt
          .setName('tag')
          .setDescription('Tag da guilda [TAG] (2-5 caracteres)')
          .setRequired(true)
          .setMinLength(2)
          .setMaxLength(5)
      )
      .addStringOption(opt =>
        opt
          .setName('descricao')
          .setDescription('Descrição da guilda')
          .setRequired(false)
          .setMaxLength(256)
      )
      .addStringOption(opt =>
        opt
          .setName('emoji')
          .setDescription('Emoji da guilda')
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('info')
      .setDescription('Ver informações da sua guilda ou de outra')
      .addStringOption(opt =>
        opt
          .setName('nome')
          .setDescription('Nome da guilda para buscar')
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('convidar')
      .setDescription('Convidar um jogador para a guilda')
      .addUserOption(opt =>
        opt
          .setName('jogador')
          .setDescription('Jogador para convidar')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('aceitar')
      .setDescription('Aceitar um convite de guilda')
  )
  .addSubcommand(sub =>
    sub
      .setName('recusar')
      .setDescription('Recusar um convite de guilda')
  )
  .addSubcommand(sub =>
    sub
      .setName('convites')
      .setDescription('Ver seus convites pendentes')
  )
  .addSubcommand(sub =>
    sub
      .setName('sair')
      .setDescription('Sair da sua guilda atual')
  )
  .addSubcommand(sub =>
    sub
      .setName('expulsar')
      .setDescription('Expulsar um membro da guilda')
      .addUserOption(opt =>
        opt
          .setName('membro')
          .setDescription('Membro para expulsar')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('promover')
      .setDescription('Promover um membro da guilda')
      .addUserOption(opt =>
        opt
          .setName('membro')
          .setDescription('Membro para promover')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('rebaixar')
      .setDescription('Rebaixar um membro da guilda')
      .addUserOption(opt =>
        opt
          .setName('membro')
          .setDescription('Membro para rebaixar')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('membros')
      .setDescription('Ver lista de membros da guilda')
  )
  .addSubcommand(sub =>
    sub
      .setName('ranking')
      .setDescription('Ver ranking das guildas')
  )
  .addSubcommandGroup(group =>
    group
      .setName('banco')
      .setDescription('Operações do banco da guilda')
      .addSubcommand(sub =>
        sub
          .setName('depositar')
          .setDescription('Depositar coins no banco')
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
          .setName('sacar')
          .setDescription('Sacar coins do banco')
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
          .setName('ver')
          .setDescription('Ver saldo do banco')
      )
  )
  .addSubcommandGroup(group =>
    group
      .setName('config')
      .setDescription('Configurações da guilda (apenas Líder)')
      .addSubcommand(sub =>
        sub
          .setName('publica')
          .setDescription('Definir se a guilda é pública')
          .addBooleanOption(opt =>
            opt
              .setName('valor')
              .setDescription('Guilda pública?')
              .setRequired(true)
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('nivel-minimo')
          .setDescription('Definir nível mínimo para entrar')
          .addIntegerOption(opt =>
            opt
              .setName('nivel')
              .setDescription('Nível mínimo')
              .setRequired(true)
              .setMinValue(1)
              .setMaxValue(100)
          )
      )
      .addSubcommand(sub =>
        sub
          .setName('cargo-saque')
          .setDescription('Definir cargo mínimo para sacar do banco')
          .addStringOption(opt =>
            opt
              .setName('cargo')
              .setDescription('Cargo mínimo')
              .setRequired(true)
              .addChoices(
                { name: 'Líder', value: 'leader' },
                { name: 'Vice-Líder', value: 'vice_leader' },
                { name: 'Oficial', value: 'officer' }
              )
          )
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommandGroup = interaction.options.getSubcommandGroup(false);
  const subcommand = interaction.options.getSubcommand();

  if (subcommandGroup === 'banco') {
    switch (subcommand) {
      case 'depositar':
        return handleBankDeposit(interaction);
      case 'sacar':
        return handleBankWithdraw(interaction);
      case 'ver':
        return handleBankView(interaction);
    }
  }

  if (subcommandGroup === 'config') {
    switch (subcommand) {
      case 'publica':
        return handleConfigPublic(interaction);
      case 'nivel-minimo':
        return handleConfigMinLevel(interaction);
      case 'cargo-saque':
        return handleConfigWithdrawRole(interaction);
    }
  }

  switch (subcommand) {
    case 'criar':
      return handleCreate(interaction);
    case 'info':
      return handleInfo(interaction);
    case 'convidar':
      return handleInvite(interaction);
    case 'aceitar':
      return handleAcceptInvite(interaction);
    case 'recusar':
      return handleDeclineInvite(interaction);
    case 'convites':
      return handleListInvites(interaction);
    case 'sair':
      return handleLeave(interaction);
    case 'expulsar':
      return handleKick(interaction);
    case 'promover':
      return handlePromote(interaction);
    case 'rebaixar':
      return handleDemote(interaction);
    case 'membros':
      return handleMembers(interaction);
    case 'ranking':
      return handleRanking(interaction);
    default:
      return handleInfo(interaction);
  }
}

// ==================== HANDLERS ====================

async function handleCreate(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const nome = interaction.options.getString('nome', true);
  const tag = interaction.options.getString('tag', true);
  const descricao = interaction.options.getString('descricao');
  const emoji = interaction.options.getString('emoji');

  const result = await guildService.createGuild(
    interaction.user.id,
    interaction.user.username,
    nome,
    tag,
    descricao || undefined,
    emoji || undefined
  );

  if (!result.success) {
    return interaction.editReply({ content: `❌ ${result.message}` });
  }

  const guild = result.guild!;

  const embed = new EmbedBuilder()
    .setTitle(`${guild.emoji} ${guild.name} [${guild.tag}]`)
    .setColor(0x00FF00)
    .setDescription(result.message)
    .addFields(
      { name: '👑 Líder', value: interaction.user.username, inline: true },
      { name: '📊 Nível', value: '1', inline: true },
      { name: '👥 Membros', value: '1/20', inline: true }
    )
    .setFooter({ text: 'Use /guilda convidar para adicionar membros!' })
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}

async function handleInfo(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const nomeBusca = interaction.options.getString('nome');
  let guild;

  if (nomeBusca) {
    guild = await guildService.getGuildByName(nomeBusca);
    if (!guild) {
      return interaction.editReply({ content: '❌ Guilda não encontrada.' });
    }
  } else {
    guild = await guildService.getPlayerGuild(interaction.user.id);
    if (!guild) {
      return interaction.editReply({
        content: '❌ Você não faz parte de nenhuma guilda. Use `/guilda criar` ou aceite um convite!',
      });
    }
  }

  const info = await guildService.getGuildInfo(guild.guildId);
  if (!info) {
    return interaction.editReply({ content: '❌ Erro ao obter informações da guilda.' });
  }

  const statusEmojis = {
    active: '🟢 Ativa',
    inactive: '⚫ Inativa',
    at_war: '⚔️ Em Guerra',
  };

  const leader = guild.members.find(m => m.role === 'leader');

  const embed = new EmbedBuilder()
    .setTitle(`${guild.emoji} ${guild.name} [${guild.tag}]`)
    .setColor(guild.status === 'at_war' ? 0xFF0000 : 0x3498DB)
    .setDescription(guild.description || '*Sem descrição*')
    .addFields(
      { name: '👑 Líder', value: leader?.username || 'Desconhecido', inline: true },
      { name: '📊 Nível', value: `${guild.level}`, inline: true },
      { name: '✨ XP', value: `${guild.experience}/${info.xpToNextLevel}`, inline: true },
      { name: '👥 Membros', value: `${info.memberCount}/${info.maxMembers}`, inline: true },
      { name: '🟢 Ativos (24h)', value: `${info.onlineMembers}`, inline: true },
      { name: '📈 Status', value: statusEmojis[guild.status], inline: true },
      { name: '🏦 Banco', value: `${guild.bank.coins.toLocaleString()} coins`, inline: true },
      { name: '⚔️ Guerras', value: `${guild.stats.warsWon}V/${guild.stats.warsLost}D`, inline: true },
      { name: '🏰 Dungeons', value: `${guild.stats.dungeonsCompleted}`, inline: true }
    )
    .setTimestamp(guild.createdAt)
    .setFooter({ text: `Criada em` });

  if (guild.currentWar) {
    embed.addFields({
      name: '⚔️ Guerra Atual',
      value: `Contra: ${guild.currentWar.enemyGuildId}\nPlacar: ${guild.currentWar.ourScore} x ${guild.currentWar.theirScore}`,
      inline: false,
    });
  }

  return interaction.editReply({ embeds: [embed] });
}

async function handleInvite(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const target = interaction.options.getUser('jogador', true);

  if (target.bot) {
    return interaction.editReply({ content: '❌ Você não pode convidar bots!' });
  }

  if (target.id === interaction.user.id) {
    return interaction.editReply({ content: '❌ Você não pode se convidar!' });
  }

  const result = await guildService.inviteMember(
    interaction.user.id,
    interaction.user.username,
    target.id,
    target.username
  );

  if (!result.success) {
    return interaction.editReply({ content: `❌ ${result.message}` });
  }

  const embed = new EmbedBuilder()
    .setTitle('📨 Convite Enviado')
    .setColor(0x00FF00)
    .setDescription(result.message)
    .addFields(
      { name: 'Convidado', value: target.username, inline: true },
      { name: 'Guilda', value: result.invite!.guildName, inline: true }
    )
    .setFooter({ text: `O jogador pode usar /guilda aceitar` });

  return interaction.editReply({ embeds: [embed] });
}

async function handleAcceptInvite(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  // Buscar convites pendentes
  const invites = await guildService.getPendingInvites(interaction.user.id);

  if (invites.length === 0) {
    return interaction.editReply({ content: '❌ Você não tem convites pendentes.' });
  }

  if (invites.length === 1) {
    // Aceitar único convite
    const result = await guildService.acceptInvite(
      interaction.user.id,
      interaction.user.username,
      invites[0].inviteId
    );

    if (!result.success) {
      return interaction.editReply({ content: `❌ ${result.message}` });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎉 Bem-vindo à Guilda!')
      .setColor(0x00FF00)
      .setDescription(result.message)
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }

  // Múltiplos convites - mostrar seleção
  const options = invites.slice(0, 25).map(inv => ({
    label: inv.guildName,
    description: `Convidado por ${inv.inviterUsername}`,
    value: inv.inviteId,
  }));

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_invite')
    .setPlaceholder('Selecione uma guilda')
    .addOptions(options);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  const embed = new EmbedBuilder()
    .setTitle('📨 Convites Pendentes')
    .setColor(0x3498DB)
    .setDescription(`Você tem ${invites.length} convites. Selecione qual deseja aceitar:`);

  const response = await interaction.editReply({
    embeds: [embed],
    components: [row],
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 60000,
  });

  collector.on('collect', async (selectInteraction: StringSelectMenuInteraction) => {
    if (selectInteraction.user.id !== interaction.user.id) {
      return selectInteraction.reply({ content: '❌ Este menu não é para você!', ephemeral: true });
    }

    const inviteId = selectInteraction.values[0];
    const result = await guildService.acceptInvite(
      interaction.user.id,
      interaction.user.username,
      inviteId
    );

    const resultEmbed = new EmbedBuilder()
      .setTitle(result.success ? '🎉 Bem-vindo à Guilda!' : '❌ Erro')
      .setColor(result.success ? 0x00FF00 : 0xFF0000)
      .setDescription(result.message);

    await selectInteraction.update({ embeds: [resultEmbed], components: [] });
  });

  collector.on('end', async (collected) => {
    if (collected.size === 0) {
      await interaction.editReply({ components: [] });
    }
  });
}

async function handleDeclineInvite(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const invites = await guildService.getPendingInvites(interaction.user.id);

  if (invites.length === 0) {
    return interaction.editReply({ content: '❌ Você não tem convites pendentes.' });
  }

  if (invites.length === 1) {
    const result = await guildService.declineInvite(interaction.user.id, invites[0].inviteId);
    return interaction.editReply({ content: result.success ? `✅ ${result.message}` : `❌ ${result.message}` });
  }

  // Múltiplos convites - mostrar seleção
  const options = invites.slice(0, 25).map(inv => ({
    label: inv.guildName,
    description: `Convidado por ${inv.inviterUsername}`,
    value: inv.inviteId,
  }));

  const select = new StringSelectMenuBuilder()
    .setCustomId('decline_invite')
    .setPlaceholder('Selecione qual convite recusar')
    .addOptions(options);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  const response = await interaction.editReply({
    content: 'Selecione o convite para recusar:',
    components: [row],
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 60000,
  });

  collector.on('collect', async (selectInteraction: StringSelectMenuInteraction) => {
    if (selectInteraction.user.id !== interaction.user.id) {
      return selectInteraction.reply({ content: '❌ Este menu não é para você!', ephemeral: true });
    }

    const inviteId = selectInteraction.values[0];
    const result = await guildService.declineInvite(interaction.user.id, inviteId);

    await selectInteraction.update({
      content: result.success ? `✅ ${result.message}` : `❌ ${result.message}`,
      components: [],
    });
  });
}

async function handleListInvites(interaction: ChatInputCommandInteraction) {
  const invites = await guildService.getPendingInvites(interaction.user.id);

  if (invites.length === 0) {
    return interaction.reply({ content: '📭 Você não tem convites pendentes.', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle('📨 Seus Convites Pendentes')
    .setColor(0x3498DB)
    .setDescription(
      invites.map((inv, i) => {
        const expiresIn = Math.floor((inv.expiresAt.getTime() - Date.now()) / 3600000);
        return `**${i + 1}.** ${inv.guildName}\n` +
          `   Convidado por: ${inv.inviterUsername}\n` +
          `   Expira em: ${expiresIn}h`;
      }).join('\n\n')
    )
    .setFooter({ text: 'Use /guilda aceitar ou /guilda recusar' });

  return interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleLeave(interaction: ChatInputCommandInteraction) {
  const guild = await guildService.getPlayerGuild(interaction.user.id);
  if (!guild) {
    return interaction.reply({
      content: '❌ Você não faz parte de nenhuma guilda.',
      ephemeral: true,
    });
  }

  const member = guild.members.find(m => m.discordId === interaction.user.id);
  const isLeader = member?.role === 'leader';

  // Confirmação
  const confirmEmbed = new EmbedBuilder()
    .setTitle('⚠️ Confirmar Saída')
    .setColor(0xFFFF00)
    .setDescription(
      isLeader && guild.members.length > 1
        ? `Você é o **Líder** da guilda **${guild.name}**!\n\nTransfira a liderança antes de sair, ou expulse todos os membros para dissolver a guilda.`
        : `Tem certeza que deseja sair da guilda **${guild.name}**?${isLeader ? '\n\n⚠️ Como único membro, a guilda será **dissolvida**!' : ''}`
    );

  if (isLeader && guild.members.length > 1) {
    return interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
  }

  const confirmBtn = new ButtonBuilder()
    .setCustomId('confirm_leave')
    .setLabel('Sair')
    .setStyle(ButtonStyle.Danger);

  const cancelBtn = new ButtonBuilder()
    .setCustomId('cancel_leave')
    .setLabel('Cancelar')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBtn, cancelBtn);

  const response = await interaction.reply({
    embeds: [confirmEmbed],
    components: [row],
    fetchReply: true,
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30000,
  });

  collector.on('collect', async (btnInteraction: ButtonInteraction) => {
    if (btnInteraction.user.id !== interaction.user.id) {
      return btnInteraction.reply({ content: '❌ Este botão não é para você!', ephemeral: true });
    }

    if (btnInteraction.customId === 'cancel_leave') {
      return btnInteraction.update({ content: '❌ Cancelado.', embeds: [], components: [] });
    }

    const result = await guildService.leaveGuild(interaction.user.id, interaction.user.username);

    const resultEmbed = new EmbedBuilder()
      .setTitle(result.success ? '👋 Saiu da Guilda' : '❌ Erro')
      .setColor(result.success ? 0xFFFF00 : 0xFF0000)
      .setDescription(result.message);

    await btnInteraction.update({ embeds: [resultEmbed], components: [] });
  });

  collector.on('end', async (collected) => {
    if (collected.size === 0) {
      await interaction.editReply({ content: '⏰ Tempo esgotado.', components: [] });
    }
  });
}

async function handleKick(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const target = interaction.options.getUser('membro', true);

  const result = await guildService.kickMember(
    interaction.user.id,
    interaction.user.username,
    target.id
  );

  const embed = new EmbedBuilder()
    .setTitle(result.success ? '👢 Membro Expulso' : '❌ Erro')
    .setColor(result.success ? 0xFF0000 : 0xFF0000)
    .setDescription(result.message);

  return interaction.editReply({ embeds: [embed] });
}

async function handlePromote(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const target = interaction.options.getUser('membro', true);

  const result = await guildService.promoteMember(
    interaction.user.id,
    interaction.user.username,
    target.id
  );

  const embed = new EmbedBuilder()
    .setTitle(result.success ? '⬆️ Membro Promovido' : '❌ Erro')
    .setColor(result.success ? 0x00FF00 : 0xFF0000)
    .setDescription(result.message);

  return interaction.editReply({ embeds: [embed] });
}

async function handleDemote(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const target = interaction.options.getUser('membro', true);

  const result = await guildService.demoteMember(
    interaction.user.id,
    interaction.user.username,
    target.id
  );

  const embed = new EmbedBuilder()
    .setTitle(result.success ? '⬇️ Membro Rebaixado' : '❌ Erro')
    .setColor(result.success ? 0xFFFF00 : 0xFF0000)
    .setDescription(result.message);

  return interaction.editReply({ embeds: [embed] });
}

async function handleMembers(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const guild = await guildService.getPlayerGuild(interaction.user.id);
  if (!guild) {
    return interaction.editReply({ content: '❌ Você não faz parte de nenhuma guilda.' });
  }

  const memberRanking = await guildService.getMemberRanking(guild.guildId);

  const roleOrder: GuildRole[] = ['leader', 'vice_leader', 'officer', 'member'];
  const sortedMembers = [...guild.members].sort((a, b) => {
    return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
  });

  const memberList = sortedMembers.map((m, i) => {
    const roleEmoji = guildService.getRoleEmoji(m.role);
    const rank = memberRanking.findIndex(r => r.discordId === m.discordId) + 1;
    const lastActive = Math.floor((Date.now() - m.lastActive.getTime()) / 3600000);
    const activeStr = lastActive < 1 ? 'Agora' : lastActive < 24 ? `${lastActive}h` : `${Math.floor(lastActive / 24)}d`;
    return `${roleEmoji} **${m.username}**\n` +
      `   XP: ${m.contributionXP.toLocaleString()} | Coins: ${m.contributionCoins.toLocaleString()}\n` +
      `   Último acesso: ${activeStr}`;
  }).join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle(`👥 Membros de ${guild.name}`)
    .setColor(0x3498DB)
    .setDescription(memberList || 'Nenhum membro')
    .setFooter({ text: `Total: ${guild.members.length} membros` });

  return interaction.editReply({ embeds: [embed] });
}

async function handleRanking(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const guilds = await guildService.getGuildRanking(10);

  if (guilds.length === 0) {
    return interaction.editReply({ content: '❌ Nenhuma guilda encontrada.' });
  }

  const rankEmojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

  const rankingList = guilds.map((g, i) => {
    const statusEmoji = g.status === 'at_war' ? '⚔️' : '';
    return `${rankEmojis[i]} **${g.name}** [${g.tag}] ${statusEmoji}\n` +
      `   Nível ${g.level} | ${g.members.length} membros | ${g.stats.totalXPEarned.toLocaleString()} XP`;
  }).join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle('🏆 Ranking de Guildas')
    .setColor(0xFFD700)
    .setDescription(rankingList)
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}

async function handleBankDeposit(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const amount = interaction.options.getInteger('quantidade', true);

  const result = await guildService.depositToBank(
    interaction.user.id,
    interaction.user.username,
    amount
  );

  const embed = new EmbedBuilder()
    .setTitle(result.success ? '🏦 Depósito Realizado' : '❌ Erro')
    .setColor(result.success ? 0x00FF00 : 0xFF0000)
    .setDescription(result.message);

  return interaction.editReply({ embeds: [embed] });
}

async function handleBankWithdraw(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const amount = interaction.options.getInteger('quantidade', true);

  const result = await guildService.withdrawFromBank(
    interaction.user.id,
    interaction.user.username,
    amount
  );

  const embed = new EmbedBuilder()
    .setTitle(result.success ? '🏦 Saque Realizado' : '❌ Erro')
    .setColor(result.success ? 0x00FF00 : 0xFF0000)
    .setDescription(result.message);

  return interaction.editReply({ embeds: [embed] });
}

async function handleBankView(interaction: ChatInputCommandInteraction) {
  const guild = await guildService.getPlayerGuild(interaction.user.id);
  if (!guild) {
    return interaction.reply({
      content: '❌ Você não faz parte de nenhuma guilda.',
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`🏦 Banco de ${guild.name}`)
    .setColor(0xFFD700)
    .addFields(
      { name: '💰 Coins', value: guild.bank.coins.toLocaleString(), inline: true },
      { name: '📦 Recursos', value: `${guild.bank.resources.length} tipos`, inline: true }
    );

  if (guild.bank.resources.length > 0) {
    const resourceList = guild.bank.resources
      .slice(0, 10)
      .map(r => `${r.resourceId}: ${r.quantity}`)
      .join('\n');
    embed.addFields({ name: 'Recursos', value: resourceList, inline: false });
  }

  return interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleConfigPublic(interaction: ChatInputCommandInteraction) {
  const value = interaction.options.getBoolean('valor', true);

  const result = await guildService.updateSetting(
    interaction.user.id,
    'isPublic',
    value
  );

  return interaction.reply({
    content: result.success
      ? `✅ Guilda agora é **${value ? 'pública' : 'privada'}**.`
      : `❌ ${result.message}`,
    ephemeral: true,
  });
}

async function handleConfigMinLevel(interaction: ChatInputCommandInteraction) {
  const level = interaction.options.getInteger('nivel', true);

  const result = await guildService.updateSetting(
    interaction.user.id,
    'minLevelToJoin',
    level
  );

  return interaction.reply({
    content: result.success
      ? `✅ Nível mínimo para entrar: **${level}**.`
      : `❌ ${result.message}`,
    ephemeral: true,
  });
}

async function handleConfigWithdrawRole(interaction: ChatInputCommandInteraction) {
  const role = interaction.options.getString('cargo', true) as GuildRole;

  const result = await guildService.updateSetting(
    interaction.user.id,
    'bankWithdrawRole',
    role
  );

  const roleNames: Record<string, string> = {
    leader: 'Líder',
    vice_leader: 'Vice-Líder',
    officer: 'Oficial',
  };

  return interaction.reply({
    content: result.success
      ? `✅ Cargo mínimo para saque: **${roleNames[role]}**.`
      : `❌ ${result.message}`,
    ephemeral: true,
  });
}
