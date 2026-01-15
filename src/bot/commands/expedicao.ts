import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { expeditionService } from '../../services/expeditionService';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embeds';
import { COLORS } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';

const DIFFICULTY_COLORS: Record<string, number> = {
  easy: 0x4CAF50,
  medium: 0xFFC107,
  hard: 0xFF5722,
  extreme: 0x9C27B0,
};

const RESOURCE_NAMES: Record<string, string> = {
  wood: '🪵 Madeira',
  stone: '🪨 Pedra',
  iron: '🔩 Ferro',
  gold: '🥇 Ouro',
  diamond: '💎 Diamante',
  essence: '✨ Essencia',
};

export const data = new SlashCommandBuilder()
  .setName('expedicao')
  .setDescription('Sistema de expedicoes')
  .addSubcommand((sub) =>
    sub.setName('lista').setDescription('Ver expedicoes disponiveis')
  )
  .addSubcommand((sub) =>
    sub
      .setName('iniciar')
      .setDescription('Iniciar uma expedicao')
      .addStringOption((opt) =>
        opt.setName('expedicao').setDescription('ID da expedicao').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName('status').setDescription('Ver status da expedicao atual')
  )
  .addSubcommand((sub) =>
    sub.setName('resgatar').setDescription('Resgatar recompensas da expedicao')
  )
  .addSubcommand((sub) =>
    sub.setName('historico').setDescription('Ver historico de expedicoes')
  )
  .addSubcommand((sub) =>
    sub
      .setName('info')
      .setDescription('Ver detalhes de uma expedicao')
      .addStringOption((opt) =>
        opt.setName('expedicao').setDescription('ID da expedicao').setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'lista':
      await handleList(interaction);
      break;
    case 'iniciar':
      await handleStart(interaction);
      break;
    case 'status':
      await handleStatus(interaction);
      break;
    case 'resgatar':
      await handleClaim(interaction);
      break;
    case 'historico':
      await handleHistory(interaction);
      break;
    case 'info':
      await handleInfo(interaction);
      break;
  }
}

async function handleList(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const expeditions = await expeditionService.getAvailableExpeditions();

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('🗺️ Expedicoes Disponiveis')
    .setDescription('Envie seu personagem em expedicoes para ganhar recompensas!')
    .setFooter({ text: 'Use /expedicao iniciar <id> para comecar' });

  const grouped: Record<string, string[]> = {};

  for (const exp of expeditions) {
    const diffName = expeditionService.getDifficultyName(exp.difficulty);
    const line = `${exp.emoji} **${exp.name}** (\`${exp.id}\`)\n` +
      `┗ ${diffName} | ${exp.durationHours}h | ${exp.successRate}% sucesso | Lv.${exp.levelRequired}+\n` +
      `  💰 ${formatNumber(exp.rewards.minCoins)}-${formatNumber(exp.rewards.maxCoins)} | ✨ ${formatNumber(exp.rewards.minXp)}-${formatNumber(exp.rewards.maxXp)} XP`;

    if (!grouped[exp.difficulty]) grouped[exp.difficulty] = [];
    grouped[exp.difficulty].push(line);
  }

  const order = ['easy', 'medium', 'hard', 'extreme'];
  const orderNames = ['🟢 Facil', '🟡 Medio', '🔴 Dificil', '🟣 Extremo'];

  for (let i = 0; i < order.length; i++) {
    if (grouped[order[i]] && grouped[order[i]].length > 0) {
      embed.addFields({
        name: orderNames[i],
        value: grouped[order[i]].join('\n\n'),
        inline: false,
      });
    }
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleStart(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const expeditionId = interaction.options.getString('expedicao', true);
  const result = await expeditionService.startExpedition(interaction.user.id, expeditionId);

  if (result.success && result.endsAt) {
    const timestamp = Math.floor(result.endsAt.getTime() / 1000);
    await interaction.editReply({
      embeds: [createSuccessEmbed(
        'Expedicao Iniciada!',
        `${result.message}\n\nRetorno: <t:${timestamp}:R> (<t:${timestamp}:t>)`
      )],
    });
  } else {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', result.message)],
    });
  }
}

async function handleStatus(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const status = await expeditionService.checkExpedition(interaction.user.id);

  if (!status.active && !status.completed) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Sem Expedicao', 'Voce nao esta em nenhuma expedicao. Use `/expedicao lista` para ver as disponiveis!')],
    });
    return;
  }

  if (status.completed && status.userExpedition) {
    const resultEmoji = status.userExpedition.success ? '✅' : '❌';
    const resultText = status.userExpedition.success ? 'SUCESSO!' : 'FALHOU';

    let description = `${status.expedition?.emoji} **${status.expedition?.name}**\n\n`;
    description += `Resultado: ${resultEmoji} **${resultText}**\n\n`;
    description += `Use \`/expedicao resgatar\` para coletar suas recompensas!`;

    const embed = new EmbedBuilder()
      .setColor(status.userExpedition.success ? COLORS.SUCCESS : COLORS.ERROR)
      .setTitle('🗺️ Expedicao Concluida!')
      .setDescription(description);

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (status.active && status.userExpedition && status.timeRemaining) {
    const endTimestamp = Math.floor(status.userExpedition.endsAt.getTime() / 1000);
    const hoursLeft = Math.ceil(status.timeRemaining / (1000 * 60 * 60));

    const embed = new EmbedBuilder()
      .setColor(DIFFICULTY_COLORS[status.expedition?.difficulty || 'easy'])
      .setTitle('🗺️ Expedicao em Andamento')
      .setDescription(`${status.expedition?.emoji} **${status.expedition?.name}**`)
      .addFields(
        { name: 'Dificuldade', value: expeditionService.getDifficultyName(status.expedition!.difficulty), inline: true },
        { name: 'Chance de Sucesso', value: `${status.expedition?.successRate}%`, inline: true },
        { name: 'Retorno', value: `<t:${endTimestamp}:R>`, inline: true },
      )
      .setFooter({ text: 'Aguarde o retorno para coletar recompensas' });

    await interaction.editReply({ embeds: [embed] });
  }
}

async function handleClaim(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  // First check if expedition is complete
  await expeditionService.checkExpedition(interaction.user.id);

  const result = await expeditionService.claimExpeditionRewards(interaction.user.id);

  if (!result.success) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', result.message)],
    });
    return;
  }

  if (result.wasSuccessful) {
    let description = `${result.message}\n\n`;
    description += `💰 **+${formatNumber(result.coins!)} coins**\n`;
    description += `✨ **+${formatNumber(result.xp!)} XP**`;

    if (result.resources && result.resources.length > 0) {
      description += '\n\n**Recursos encontrados:**\n';
      for (const res of result.resources) {
        const name = RESOURCE_NAMES[res.resourceId] || res.resourceId;
        description += `${name}: +${res.amount}\n`;
      }
    }

    if (result.badge) {
      description += `\n🏅 **Badge rara obtida:** \`${result.badge}\``;
    }

    await interaction.editReply({
      embeds: [createSuccessEmbed('Recompensas Resgatadas!', description)],
    });
  } else {
    await interaction.editReply({
      embeds: [createErrorEmbed('Expedicao Falhou', result.message + '\n\nTente novamente com outra expedicao!')],
    });
  }
}

async function handleHistory(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const stats = await expeditionService.getExpeditionStats(interaction.user.id);

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('📜 Historico de Expedicoes')
    .setThumbnail(interaction.user.displayAvatarURL())
    .addFields(
      { name: 'Expedicoes Completas', value: `${stats.completed}`, inline: true },
      { name: 'Total de Coins', value: formatNumber(stats.totalCoins), inline: true },
      { name: 'Total de XP', value: formatNumber(stats.totalXp), inline: true },
    );

  await interaction.editReply({ embeds: [embed] });
}

async function handleInfo(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const expeditionId = interaction.options.getString('expedicao', true);
  const expedition = await expeditionService.getExpeditionById(expeditionId);

  if (!expedition) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Expedicao nao encontrada.')],
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(DIFFICULTY_COLORS[expedition.difficulty])
    .setTitle(`${expedition.emoji} ${expedition.name}`)
    .setDescription(expedition.description)
    .addFields(
      { name: 'Dificuldade', value: expeditionService.getDifficultyName(expedition.difficulty), inline: true },
      { name: 'Duracao', value: `${expedition.durationHours}h`, inline: true },
      { name: 'Taxa de Sucesso', value: `${expedition.successRate}%`, inline: true },
      { name: 'Nivel Minimo', value: `${expedition.levelRequired}`, inline: true },
      { name: 'Coins', value: `${formatNumber(expedition.rewards.minCoins)} - ${formatNumber(expedition.rewards.maxCoins)}`, inline: true },
      { name: 'XP', value: `${formatNumber(expedition.rewards.minXp)} - ${formatNumber(expedition.rewards.maxXp)}`, inline: true },
    );

  if (expedition.rewards.resourceDrops && expedition.rewards.resourceDrops.length > 0) {
    const drops = expedition.rewards.resourceDrops.map(d => {
      const name = RESOURCE_NAMES[d.resourceId] || d.resourceId;
      return `${name}: ${d.chance}% (${d.minAmount}-${d.maxAmount})`;
    }).join('\n');
    embed.addFields({ name: 'Recursos Possiveis', value: drops, inline: false });
  }

  if (expedition.rewards.badgeChance && expedition.rewards.badgeId) {
    embed.addFields({
      name: '🏅 Badge Especial',
      value: `${expedition.rewards.badgeChance}% de chance de obter: \`${expedition.rewards.badgeId}\``,
      inline: false,
    });
  }

  await interaction.editReply({ embeds: [embed] });
}
