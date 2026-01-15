import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ComponentType,
} from 'discord.js';
import { economyService } from '../../services/economyService';
import { ShopItemDocument } from '../../database/models';
import { createErrorEmbed } from '../../utils/embeds';
import { COLORS } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';

export const data = new SlashCommandBuilder()
  .setName('loja')
  .setDescription('Ver a loja do servidor');

const TYPE_EMOJIS: Record<string, string> = {
  role_temp: '🏷️',
  xp_booster: '⚡',
  title: '📛',
  badge: '🏅',
  lottery_ticket: '🎫',
  profile_color: '🎨',
};

const TYPE_NAMES: Record<string, string> = {
  role_temp: 'Cargos',
  xp_booster: 'Boosters',
  title: 'Titulos',
  badge: 'Badges',
  lottery_ticket: 'Loteria',
  profile_color: 'Cores',
};

function createShopEmbed(items: ShopItemDocument[], balance: number): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('🏪 Loja do Servidor')
    .setDescription(`Seu saldo: **${formatNumber(balance)} 🪙**\n\nUse \`/comprar <item>\` para comprar!`)
    .setTimestamp();

  if (items.length === 0) {
    embed.addFields({ name: 'Nenhum Item', value: 'A loja esta vazia no momento.', inline: false });
    return embed;
  }

  // Group items by type
  const grouped = new Map<string, ShopItemDocument[]>();
  for (const item of items) {
    const group = grouped.get(item.type) || [];
    group.push(item);
    grouped.set(item.type, group);
  }

  // Add fields for each group
  for (const [type, typeItems] of grouped) {
    const emoji = TYPE_EMOJIS[type] || '📦';
    const name = TYPE_NAMES[type] || type;

    const itemList = typeItems.map((item) => {
      const stock = item.stock !== null ? ` (${item.stock} restantes)` : '';
      return `${emoji} **${item.name}** - ${formatNumber(item.price)} 🪙${stock}\n┗ ${item.description}`;
    }).join('\n\n');

    embed.addFields({ name: `${emoji} ${name}`, value: itemList, inline: false });
  }

  return embed;
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  try {
    const items = await economyService.getShopItems();
    const balance = await economyService.getBalance(interaction.user.id);

    const embed = createShopEmbed(items, balance);

    // If there are items, add a select menu for quick purchase
    if (items.length > 0 && items.length <= 25) {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('shop_purchase_select')
        .setPlaceholder('Selecione um item para comprar')
        .addOptions(
          items.map((item) => ({
            label: item.name,
            description: `${formatNumber(item.price)} 🪙 - ${item.description.substring(0, 50)}`,
            value: item.id,
            emoji: TYPE_EMOJIS[item.type] || '📦',
          }))
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      const response = await interaction.editReply({
        embeds: [embed],
        components: [row],
      });

      // Create collector for select menu
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000,
      });

      collector.on('collect', async (i: StringSelectMenuInteraction) => {
        if (i.user.id !== interaction.user.id) {
          await i.reply({
            content: 'Apenas quem usou o comando pode comprar!',
            ephemeral: true,
          });
          return;
        }

        const itemId = i.values[0];
        const result = await economyService.purchaseItem(interaction.member as any, itemId);

        if (result.success) {
          const successEmbed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle('✅ Compra Realizada!')
            .setDescription(result.message)
            .addFields({ name: 'Novo Saldo', value: `${formatNumber(result.newBalance || 0)} 🪙`, inline: true })
            .setTimestamp();

          await i.update({ embeds: [successEmbed], components: [] });
        } else {
          await i.reply({
            embeds: [createErrorEmbed('Erro na Compra', result.message)],
            ephemeral: true,
          });
        }
      });

      collector.on('end', async () => {
        selectMenu.setDisabled(true);
        const disabledRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
        try {
          await interaction.editReply({ components: [disabledRow] });
        } catch {
          // Ignore if message was deleted
        }
      });
    } else {
      await interaction.editReply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error in loja command:', error);
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Ocorreu um erro ao carregar a loja.')],
    });
  }
}
