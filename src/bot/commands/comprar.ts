import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
} from 'discord.js';
import { economyService } from '../../services/economyService';
import { createErrorEmbed } from '../../utils/embeds';
import { COLORS } from '../../utils/constants';
import { formatNumber } from '../../utils/helpers';

export const data = new SlashCommandBuilder()
  .setName('comprar')
  .setDescription('Comprar um item da loja')
  .addStringOption((option) =>
    option
      .setName('item')
      .setDescription('ID do item para comprar')
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const itemId = interaction.options.getString('item', true);
  const member = interaction.member as GuildMember;

  if (!member) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', 'Este comando so pode ser usado em um servidor.')],
    });
    return;
  }

  const result = await economyService.purchaseItem(member, itemId);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('✅ Compra Realizada!')
      .setDescription(result.message)
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: 'Item', value: result.item?.name || itemId, inline: true },
        { name: 'Preco', value: `${formatNumber(result.item?.price || 0)} 🪙`, inline: true },
        { name: 'Novo Saldo', value: `${formatNumber(result.newBalance || 0)} 🪙`, inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } else {
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro na Compra', result.message)],
    });
  }
}

// Autocomplete handler for item selection
export async function autocomplete(interaction: any): Promise<void> {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const items = await economyService.getShopItems();

  const filtered = items
    .filter((item) =>
      item.name.toLowerCase().includes(focusedValue) ||
      item.id.toLowerCase().includes(focusedValue)
    )
    .slice(0, 25);

  await interaction.respond(
    filtered.map((item) => ({
      name: `${item.name} - ${formatNumber(item.price)} 🪙`,
      value: item.id,
    }))
  );
}
