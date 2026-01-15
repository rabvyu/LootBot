import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { economyRepository } from '../../../database/repositories/economyRepository';
import { createSuccessEmbed, createErrorEmbed } from '../../../utils/embeds';
import { COLORS } from '../../../utils/constants';
import { formatNumber } from '../../../utils/helpers';
import { ShopItemType } from '../../../types';

export const data = new SlashCommandBuilder()
  .setName('shop-manage')
  .setDescription('Gerenciar itens da loja (Admin)')
  .addSubcommand((sub) =>
    sub
      .setName('add')
      .setDescription('Adicionar novo item a loja')
      .addStringOption((opt) =>
        opt.setName('id').setDescription('ID unico do item').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('nome').setDescription('Nome do item').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('descricao').setDescription('Descricao do item').setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('tipo')
          .setDescription('Tipo do item')
          .setRequired(true)
          .addChoices(
            { name: 'Cargo Temporario', value: 'role_temp' },
            { name: 'Booster XP', value: 'xp_booster' },
            { name: 'Titulo', value: 'title' },
            { name: 'Badge', value: 'badge' },
            { name: 'Ticket Loteria', value: 'lottery_ticket' },
            { name: 'Cor do Perfil', value: 'profile_color' }
          )
      )
      .addIntegerOption((opt) =>
        opt.setName('preco').setDescription('Preco em moedas').setRequired(true).setMinValue(1)
      )
      .addIntegerOption((opt) =>
        opt.setName('estoque').setDescription('Quantidade em estoque (vazio = ilimitado)').setRequired(false)
      )
      .addRoleOption((opt) =>
        opt.setName('cargo').setDescription('Cargo (para tipo role_temp)').setRequired(false)
      )
      .addIntegerOption((opt) =>
        opt.setName('duracao').setDescription('Duracao em horas (para itens temporarios)').setRequired(false)
      )
      .addNumberOption((opt) =>
        opt.setName('multiplicador').setDescription('Multiplicador de XP (para boosters)').setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('remove')
      .setDescription('Remover item da loja')
      .addStringOption((opt) =>
        opt.setName('id').setDescription('ID do item para remover').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('list')
      .setDescription('Listar todos os itens da loja')
  )
  .addSubcommand((sub) =>
    sub
      .setName('toggle')
      .setDescription('Ativar/desativar item')
      .addStringOption((opt) =>
        opt.setName('id').setDescription('ID do item').setRequired(true)
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'add': {
      const id = interaction.options.getString('id', true);
      const name = interaction.options.getString('nome', true);
      const description = interaction.options.getString('descricao', true);
      const type = interaction.options.getString('tipo', true) as ShopItemType;
      const price = interaction.options.getInteger('preco', true);
      const stock = interaction.options.getInteger('estoque') ?? undefined;
      const role = interaction.options.getRole('cargo');
      const duration = interaction.options.getInteger('duracao') ?? undefined;
      const multiplier = interaction.options.getNumber('multiplicador') ?? undefined;

      // Check if item already exists
      const existing = await economyRepository.getShopItem(id);
      if (existing) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Erro', 'Ja existe um item com este ID.')],
        });
        return;
      }

      await economyRepository.createShopItem({
        id,
        name,
        description,
        type,
        price,
        stock,
        roleId: role?.id,
        duration,
        multiplier,
      });

      await interaction.editReply({
        embeds: [createSuccessEmbed('Item Adicionado', `**${name}** foi adicionado a loja por ${formatNumber(price)} 🪙`)],
      });
      break;
    }

    case 'remove': {
      const id = interaction.options.getString('id', true);
      const removed = await economyRepository.deleteShopItem(id);

      if (removed) {
        await interaction.editReply({
          embeds: [createSuccessEmbed('Item Removido', `Item **${id}** foi removido da loja.`)],
        });
      } else {
        await interaction.editReply({
          embeds: [createErrorEmbed('Erro', 'Item nao encontrado.')],
        });
      }
      break;
    }

    case 'list': {
      const items = await economyRepository.getShopItems();

      if (items.length === 0) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Loja Vazia', 'Nenhum item na loja.')],
        });
        return;
      }

      const itemList = items.map((item) => {
        const status = item.active ? '✅' : '❌';
        const stock = item.stock !== null ? ` (${item.stock})` : ' (∞)';
        return `${status} **${item.name}** (\`${item.id}\`)\n┗ ${formatNumber(item.price)} 🪙${stock} - ${item.type}`;
      }).join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('📦 Itens da Loja')
        .setDescription(itemList)
        .setFooter({ text: `${items.length} item(s)` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'toggle': {
      const id = interaction.options.getString('id', true);
      const item = await economyRepository.getShopItem(id);

      if (!item) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Erro', 'Item nao encontrado.')],
        });
        return;
      }

      await economyRepository.updateShopItem(id, { active: !item.active });
      const status = !item.active ? 'ativado' : 'desativado';

      await interaction.editReply({
        embeds: [createSuccessEmbed('Item Atualizado', `**${item.name}** foi ${status}.`)],
      });
      break;
    }
  }
}
