import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { badgeService } from '../../services/badgeService';
import { createErrorEmbed } from '../../utils/embeds';
import { COLORS, RARITY_COLORS } from '../../utils/constants';
import { IBadge, BadgeCategory, BadgeRarity } from '../../types';

const BADGES_PER_PAGE = 10;

const CATEGORY_NAMES: Record<string, string> = {
  level: '📊 Progressao',
  time: '📅 Tempo',
  achievement: '🎯 Social',
  hardware: '🔧 Hardware',
  overclocking: '⚡ Overclocking',
  setup: '🖥️ Setup Wars',
  peripherals: '⌨️ Perifericos',
  '3dprint': '🖨️ Impressao 3D',
  modding: '🔨 Modding',
  championship: '🏆 Campeonatos',
  special: '⭐ Especiais',
};

const RARITY_NAMES: Record<BadgeRarity, string> = {
  common: '⚪ Common',
  uncommon: '🟢 Uncommon',
  rare: '🔵 Rare',
  epic: '🟣 Epic',
  legendary: '🟠 Legendary',
};

const RARITY_EMOJI: Record<BadgeRarity, string> = {
  common: '⚪',
  uncommon: '🟢',
  rare: '🔵',
  epic: '🟣',
  legendary: '🟠',
};

export const data = new SlashCommandBuilder()
  .setName('catalogo')
  .setDescription('Ver todas as badges disponiveis')
  .addStringOption((option) =>
    option
      .setName('categoria')
      .setDescription('Filtrar por categoria')
      .setRequired(false)
      .addChoices(
        { name: '📊 Progressao (Niveis)', value: 'level' },
        { name: '📅 Tempo de Comunidade', value: 'time' },
        { name: '🎯 Atividade Social', value: 'achievement' },
        { name: '🔧 Hardware', value: 'hardware' },
        { name: '⚡ Overclocking', value: 'overclocking' },
        { name: '🖥️ Setup Wars', value: 'setup' },
        { name: '⌨️ Perifericos', value: 'peripherals' },
        { name: '🖨️ Impressao 3D', value: '3dprint' },
        { name: '🔨 Modding', value: 'modding' },
        { name: '🏆 Campeonatos', value: 'championship' },
        { name: '⭐ Especiais', value: 'special' }
      )
  )
  .addStringOption((option) =>
    option
      .setName('raridade')
      .setDescription('Filtrar por raridade')
      .setRequired(false)
      .addChoices(
        { name: '⚪ Common', value: 'common' },
        { name: '🟢 Uncommon', value: 'uncommon' },
        { name: '🔵 Rare', value: 'rare' },
        { name: '🟣 Epic', value: 'epic' },
        { name: '🟠 Legendary', value: 'legendary' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const categoryFilter = interaction.options.getString('categoria') as BadgeCategory | null;
  const rarityFilter = interaction.options.getString('raridade') as BadgeRarity | null;

  // Get all badges
  let badges = await badgeService.getAllBadges();

  // Apply filters
  if (categoryFilter) {
    badges = badges.filter((b) => b.category === categoryFilter);
  }
  if (rarityFilter) {
    badges = badges.filter((b) => b.rarity === rarityFilter);
  }

  // Sort by rarity (legendary first) then by name
  const rarityOrder: BadgeRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
  badges.sort((a, b) => {
    const rarityDiff = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
    if (rarityDiff !== 0) return rarityDiff;
    return a.name.localeCompare(b.name);
  });

  if (badges.length === 0) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Nenhuma Badge', 'Nenhuma badge encontrada com esses filtros.')],
    });
    return;
  }

  // Get user's badges to show which they have
  const userBadges = await badgeService.getUserBadges(interaction.user.id);
  const userBadgeIds = new Set(userBadges.map((b) => b.id));

  let currentPage = 0;
  const totalPages = Math.ceil(badges.length / BADGES_PER_PAGE);

  const createEmbed = (page: number): EmbedBuilder => {
    const start = page * BADGES_PER_PAGE;
    const end = Math.min(start + BADGES_PER_PAGE, badges.length);
    const pageBadges = badges.slice(start, end);

    const description = pageBadges
      .map((badge) => {
        const owned = userBadgeIds.has(badge.id) ? '✅' : '❌';
        const rarity = RARITY_EMOJI[badge.rarity];
        return `${owned} ${badge.icon} **${badge.name}** ${rarity}\n┗ ${badge.description}`;
      })
      .join('\n\n');

    let title = '📚 Catalogo de Badges';
    if (categoryFilter) {
      title += ` - ${CATEGORY_NAMES[categoryFilter]}`;
    }
    if (rarityFilter) {
      title += ` (${RARITY_NAMES[rarityFilter]})`;
    }

    // Count badges by rarity for footer
    const ownedCount = badges.filter((b) => userBadgeIds.has(b.id)).length;

    return new EmbedBuilder()
      .setColor(rarityFilter ? RARITY_COLORS[rarityFilter] : COLORS.BADGE)
      .setTitle(title)
      .setDescription(description)
      .setFooter({
        text: `Pagina ${page + 1}/${totalPages} | ${ownedCount}/${badges.length} badges conquistadas | ✅ = possui, ❌ = nao possui`,
      })
      .setTimestamp();
  };

  const createButtons = (page: number): ActionRowBuilder<ButtonBuilder> => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('first')
        .setLabel('⏪')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('◀️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId('page')
        .setLabel(`${page + 1}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === totalPages - 1),
      new ButtonBuilder()
        .setCustomId('last')
        .setLabel('⏩')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === totalPages - 1)
    );
  };

  const message = await interaction.editReply({
    embeds: [createEmbed(currentPage)],
    components: totalPages > 1 ? [createButtons(currentPage)] : [],
  });

  if (totalPages <= 1) return;

  // Create collector for button interactions
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 300000, // 5 minutes
    filter: (i) => i.user.id === interaction.user.id,
  });

  collector.on('collect', async (i) => {
    switch (i.customId) {
      case 'first':
        currentPage = 0;
        break;
      case 'prev':
        currentPage = Math.max(0, currentPage - 1);
        break;
      case 'next':
        currentPage = Math.min(totalPages - 1, currentPage + 1);
        break;
      case 'last':
        currentPage = totalPages - 1;
        break;
    }

    await i.update({
      embeds: [createEmbed(currentPage)],
      components: [createButtons(currentPage)],
    });
  });

  collector.on('end', async () => {
    // Disable all buttons when collector ends
    const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('first')
        .setLabel('⏪')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('◀️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('page')
        .setLabel(`${currentPage + 1}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('last')
        .setLabel('⏩')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    try {
      await interaction.editReply({ components: [disabledRow] });
    } catch {
      // Message might be deleted
    }
  });
}
