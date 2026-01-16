import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { economyService } from '../../services/economyService';
import { resourceService } from '../../services/resourceService';
import { userRepository } from '../../database/repositories/userRepository';
import { COLORS } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';

// Gift configuration
const GIFT_CONFIG = {
  MIN_COINS: 10,
  MAX_COINS_DAILY: 10000,
  COINS_TAX: 0.05, // 5% tax on coin gifts
};

// Resource names for display
const RESOURCE_NAMES: Record<string, string> = {
  wood: 'Madeira',
  stone: 'Pedra',
  iron: 'Ferro',
  gold: 'Ouro',
  diamond: 'Diamante',
  essence: 'Essencia',
  fish_common: 'Peixe Comum',
  fish_rare: 'Peixe Raro',
  fish_golden: 'Peixe Dourado',
  bait: 'Isca',
  refined_iron: 'Ferro Refinado',
  gold_bar: 'Barra de Ouro',
};

export const data = new SlashCommandBuilder()
  .setName('presente')
  .setDescription('Sistema de presentes - De itens para seus amigos!')
  .addSubcommand(sub =>
    sub
      .setName('coins')
      .setDescription('Dar coins para outro jogador')
      .addUserOption(opt =>
        opt.setName('usuario').setDescription('Quem recebera o presente').setRequired(true)
      )
      .addIntegerOption(opt =>
        opt
          .setName('quantidade')
          .setDescription('Quantidade de coins')
          .setRequired(true)
          .setMinValue(GIFT_CONFIG.MIN_COINS)
          .setMaxValue(GIFT_CONFIG.MAX_COINS_DAILY)
      )
      .addStringOption(opt =>
        opt.setName('mensagem').setDescription('Mensagem junto com o presente')
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('recurso')
      .setDescription('Dar recursos para outro jogador')
      .addUserOption(opt =>
        opt.setName('usuario').setDescription('Quem recebera o presente').setRequired(true)
      )
      .addStringOption(opt =>
        opt
          .setName('tipo')
          .setDescription('Tipo de recurso')
          .setRequired(true)
          .addChoices(
            { name: 'Madeira', value: 'wood' },
            { name: 'Pedra', value: 'stone' },
            { name: 'Ferro', value: 'iron' },
            { name: 'Ouro', value: 'gold' },
            { name: 'Diamante', value: 'diamond' },
            { name: 'Essencia', value: 'essence' },
            { name: 'Peixe Comum', value: 'fish_common' },
            { name: 'Peixe Raro', value: 'fish_rare' },
            { name: 'Isca', value: 'bait' },
            { name: 'Ferro Refinado', value: 'refined_iron' },
            { name: 'Barra de Ouro', value: 'gold_bar' }
          )
      )
      .addIntegerOption(opt =>
        opt
          .setName('quantidade')
          .setDescription('Quantidade de recursos')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(1000)
      )
      .addStringOption(opt =>
        opt.setName('mensagem').setDescription('Mensagem junto com o presente')
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'coins':
      await handleGiftCoins(interaction);
      break;
    case 'recurso':
      await handleGiftResource(interaction);
      break;
  }
}

async function handleGiftCoins(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const target = interaction.options.getUser('usuario', true);
  const amount = interaction.options.getInteger('quantidade', true);
  const message = interaction.options.getString('mensagem') || '';

  // Validation
  if (target.bot) {
    await interaction.editReply({ content: 'Voce nao pode dar presentes para bots!' });
    return;
  }

  if (target.id === interaction.user.id) {
    await interaction.editReply({ content: 'Voce nao pode dar presentes para si mesmo!' });
    return;
  }

  // Check balance
  const balance = await economyService.getBalance(interaction.user.id);
  const taxAmount = Math.floor(amount * GIFT_CONFIG.COINS_TAX);
  const totalCost = amount + taxAmount;

  if (balance < totalCost) {
    await interaction.editReply({
      content: `Voce nao tem coins suficientes! Precisa de ${formatNumber(totalCost)} coins (${formatNumber(amount)} + ${formatNumber(taxAmount)} taxa).`
    });
    return;
  }

  // Process gift
  await economyService.removeCoins(interaction.user.id, totalCost, `Presente para ${target.username}`);
  await economyService.addCoins(target.id, amount, `Presente de ${interaction.user.username}`);

  // Award generosity badge
  await checkGenerosityBadges(interaction.user.id, amount);

  // Create embed
  const embed = new EmbedBuilder()
    .setTitle('🎁 Presente Enviado!')
    .setDescription(
      `**${interaction.user.username}** enviou um presente para **${target.username}**!`
    )
    .addFields(
      { name: '💰 Valor', value: `${formatNumber(amount)} coins`, inline: true },
      { name: '📊 Taxa', value: `${formatNumber(taxAmount)} coins (${GIFT_CONFIG.COINS_TAX * 100}%)`, inline: true },
    )
    .setColor(COLORS.SUCCESS)
    .setFooter({ text: 'Espalhe a generosidade!' });

  if (message) {
    embed.addFields({ name: '💬 Mensagem', value: message, inline: false });
  }

  await interaction.editReply({
    content: `<@${target.id}>`,
    embeds: [embed]
  });
}

async function handleGiftResource(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const target = interaction.options.getUser('usuario', true);
  const resourceType = interaction.options.getString('tipo', true);
  const amount = interaction.options.getInteger('quantidade', true);
  const message = interaction.options.getString('mensagem') || '';

  // Validation
  if (target.bot) {
    await interaction.editReply({ content: 'Voce nao pode dar presentes para bots!' });
    return;
  }

  if (target.id === interaction.user.id) {
    await interaction.editReply({ content: 'Voce nao pode dar presentes para si mesmo!' });
    return;
  }

  // Check if user has enough resources
  const userAmount = await resourceService.getUserResourceAmount(interaction.user.id, resourceType);

  if (userAmount < amount) {
    const resourceName = RESOURCE_NAMES[resourceType] || resourceType;
    await interaction.editReply({
      content: `Voce nao tem ${resourceName} suficiente! Tem ${userAmount}, precisa de ${amount}.`
    });
    return;
  }

  // Process gift
  await resourceService.removeResources(interaction.user.id, [{ resourceId: resourceType, amount }]);
  await resourceService.addResources(target.id, [{ resourceId: resourceType, amount }]);

  // Award generosity badge
  await checkGenerosityBadges(interaction.user.id, 0, amount);

  const resourceName = RESOURCE_NAMES[resourceType] || resourceType;

  // Create embed
  const embed = new EmbedBuilder()
    .setTitle('🎁 Presente Enviado!')
    .setDescription(
      `**${interaction.user.username}** enviou um presente para **${target.username}**!`
    )
    .addFields(
      { name: '📦 Recurso', value: resourceName, inline: true },
      { name: '🔢 Quantidade', value: `${amount}`, inline: true },
    )
    .setColor(COLORS.SUCCESS)
    .setFooter({ text: 'Compartilhar e cuidar!' });

  if (message) {
    embed.addFields({ name: '💬 Mensagem', value: message, inline: false });
  }

  await interaction.editReply({
    content: `<@${target.id}>`,
    embeds: [embed]
  });
}

async function checkGenerosityBadges(discordId: string, coinsGiven: number, resourcesGiven: number = 0): Promise<void> {
  // Get or create gift stats
  const user = await userRepository.findByDiscordId(discordId);
  if (!user) return;

  // Track total gifts (stored in user stats)
  const totalGifts = (user.stats as any).giftsGiven || 0;
  const newTotal = totalGifts + 1;

  // Update gift count
  await userRepository.updateStats(discordId, { giftsGiven: newTotal } as any);

  // Award badges based on gifts given
  if (newTotal >= 1) await userRepository.addBadge(discordId, 'generous_heart');
  if (newTotal >= 10) await userRepository.addBadge(discordId, 'gift_giver');
  if (newTotal >= 50) await userRepository.addBadge(discordId, 'santa_claus');
  if (newTotal >= 100) await userRepository.addBadge(discordId, 'philanthropist');
}
