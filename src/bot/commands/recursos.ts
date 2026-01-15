import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { resourceService } from '../../services/resourceService';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embeds';
import { COLORS } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';

const RARITY_EMOJIS: Record<string, string> = {
  common: '⬜',
  uncommon: '🟩',
  rare: '🟦',
  epic: '🟪',
  legendary: '🟨',
};

export const data = new SlashCommandBuilder()
  .setName('recursos')
  .setDescription('Gerenciar seus recursos')
  .addSubcommand((sub) =>
    sub.setName('ver').setDescription('Ver seus recursos')
  )
  .addSubcommand((sub) =>
    sub
      .setName('vender')
      .setDescription('Vender um recurso')
      .addStringOption((opt) =>
        opt.setName('recurso').setDescription('ID do recurso').setRequired(true)
      )
      .addIntegerOption((opt) =>
        opt.setName('quantidade').setDescription('Quantidade a vender').setRequired(true).setMinValue(1)
      )
  )
  .addSubcommand((sub) =>
    sub.setName('vender-tudo').setDescription('Vender todos os recursos')
  )
  .addSubcommand((sub) =>
    sub.setName('lista').setDescription('Ver todos os recursos existentes')
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'ver':
      await handleView(interaction);
      break;
    case 'vender':
      await handleSell(interaction);
      break;
    case 'vender-tudo':
      await handleSellAll(interaction);
      break;
    case 'lista':
      await handleList(interaction);
      break;
  }
}

async function handleView(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const userResources = await resourceService.getUserResources(interaction.user.id);

  if (userResources.length === 0) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Sem Recursos', 'Voce nao possui nenhum recurso. Pesque ou faca expedicoes para coletar!')],
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('🎒 Seus Recursos')
    .setThumbnail(interaction.user.displayAvatarURL());

  let description = '';
  let totalValue = 0;

  for (const ur of userResources) {
    const resource = await resourceService.getResource(ur.resourceId);
    if (!resource) continue;

    const value = ur.amount * resource.baseValue;
    totalValue += value;
    description += `${resource.emoji} **${resource.name}**: ${formatNumber(ur.amount)} (${formatNumber(value)} 🪙)\n`;
  }

  embed.setDescription(description);
  embed.setFooter({ text: `Valor total: ${formatNumber(totalValue)} coins` });

  await interaction.editReply({ embeds: [embed] });
}

async function handleSell(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const resourceId = interaction.options.getString('recurso', true);
  const amount = interaction.options.getInteger('quantidade', true);

  const result = await resourceService.sellResource(interaction.user.id, resourceId, amount);

  if (result.success) {
    await interaction.editReply({
      embeds: [createSuccessEmbed('Venda Realizada!', `${result.message}\n\nSaldo: ${formatNumber(result.newBalance!)} 🪙`)],
    });
  } else {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', result.message)],
    });
  }
}

async function handleSellAll(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const result = await resourceService.sellAllResources(interaction.user.id);

  if (result.success) {
    await interaction.editReply({
      embeds: [createSuccessEmbed('Tudo Vendido!', `${result.message}\n\nSaldo: ${formatNumber(result.newBalance!)} 🪙`)],
    });
  } else {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', result.message)],
    });
  }
}

async function handleList(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const resources = await resourceService.getAllResources();

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('📦 Lista de Recursos')
    .setDescription('Todos os recursos disponiveis no jogo:');

  const grouped: Record<string, string[]> = {};

  for (const resource of resources) {
    const line = `${resource.emoji} **${resource.name}** (\`${resource.id}\`) - ${formatNumber(resource.baseValue)} 🪙`;

    if (!grouped[resource.rarity]) grouped[resource.rarity] = [];
    grouped[resource.rarity].push(line);
  }

  const order = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const names = ['Comum', 'Incomum', 'Raro', 'Epico', 'Lendario'];

  for (let i = 0; i < order.length; i++) {
    if (grouped[order[i]] && grouped[order[i]].length > 0) {
      embed.addFields({
        name: `${RARITY_EMOJIS[order[i]]} ${names[i]}`,
        value: grouped[order[i]].join('\n'),
        inline: false,
      });
    }
  }

  await interaction.editReply({ embeds: [embed] });
}
