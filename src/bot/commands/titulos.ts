import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} from 'discord.js';
import { titleService } from '../../services/titleService';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embeds';
import { COLORS, RARITY_COLORS } from '../../utils/constants';

export const data = new SlashCommandBuilder()
  .setName('titulos')
  .setDescription('Ver e gerenciar seus titulos')
  .addSubcommand((sub) =>
    sub
      .setName('meus')
      .setDescription('Ver seus titulos')
  )
  .addSubcommand((sub) =>
    sub
      .setName('equipar')
      .setDescription('Equipar um titulo')
  )
  .addSubcommand((sub) =>
    sub
      .setName('remover')
      .setDescription('Remover titulo equipado')
  )
  .addSubcommand((sub) =>
    sub
      .setName('loja')
      .setDescription('Ver titulos disponiveis na loja')
  )
  .addSubcommand((sub) =>
    sub
      .setName('comprar')
      .setDescription('Comprar um titulo')
      .addStringOption((opt) =>
        opt.setName('id').setDescription('ID do titulo').setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'meus': {
      const userTitles = await titleService.getUserTitles(interaction.user.id);
      const equippedTitle = await titleService.getEquippedTitle(interaction.user.id);

      if (userTitles.length === 0) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Sem Titulos', 'Voce ainda nao possui nenhum titulo. Suba de nivel ou compre na loja!')],
        });
        return;
      }

      const rarityEmoji: Record<string, string> = {
        common: '⚪',
        uncommon: '🟢',
        rare: '🔵',
        epic: '🟣',
        legendary: '🟠',
      };

      const titleList = userTitles.map(({ title, userTitle }) => {
        const equipped = userTitle.equipped ? ' ✅' : '';
        const expires = userTitle.expiresAt ? ` (expira <t:${Math.floor(userTitle.expiresAt.getTime() / 1000)}:R>)` : '';
        return `${rarityEmoji[title.rarity]} **${title.displayName}**${equipped}${expires}\n┗ ${title.description}`;
      }).join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`🏷️ Titulos de ${interaction.user.globalName || interaction.user.username}`)
        .setDescription(titleList)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: `${userTitles.length} titulo(s) | Use /titulos equipar para escolher um` })
        .setTimestamp();

      if (equippedTitle) {
        embed.addFields({
          name: 'Titulo Equipado',
          value: equippedTitle.displayName,
          inline: true,
        });
      }

      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'equipar': {
      const userTitles = await titleService.getUserTitles(interaction.user.id);

      if (userTitles.length === 0) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Sem Titulos', 'Voce nao possui titulos para equipar.')],
        });
        return;
      }

      const options = userTitles.map(({ title, userTitle }) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(title.name)
          .setDescription(title.description.substring(0, 100))
          .setValue(title.id)
          .setEmoji(title.displayName.split(' ')[0]) // Get emoji from displayName
          .setDefault(userTitle.equipped)
      );

      const select = new StringSelectMenuBuilder()
        .setCustomId('equip_title_select')
        .setPlaceholder('Escolha um titulo para equipar')
        .addOptions(options);

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

      const response = await interaction.editReply({
        content: 'Selecione o titulo que deseja equipar:',
        components: [row],
      });

      try {
        const collector = response.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 60000,
        });

        collector.on('collect', async (i) => {
          if (i.user.id !== interaction.user.id) {
            await i.reply({ content: 'Este menu nao e para voce!', ephemeral: true });
            return;
          }

          const titleId = i.values[0];
          const success = await titleService.equipTitle(interaction.user.id, titleId);

          if (success) {
            const title = await titleService.getTitle(titleId);
            await i.update({
              content: null,
              embeds: [createSuccessEmbed('Titulo Equipado', `Agora voce esta usando o titulo **${title?.displayName}**!`)],
              components: [],
            });
          } else {
            await i.update({
              content: null,
              embeds: [createErrorEmbed('Erro', 'Nao foi possivel equipar o titulo.')],
              components: [],
            });
          }

          collector.stop();
        });

        collector.on('end', async (collected, reason) => {
          if (reason === 'time' && collected.size === 0) {
            await interaction.editReply({
              content: 'Tempo esgotado. Use o comando novamente.',
              components: [],
            });
          }
        });
      } catch {
        // Interaction already handled
      }
      break;
    }

    case 'remover': {
      const equippedTitle = await titleService.getEquippedTitle(interaction.user.id);

      if (!equippedTitle) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Sem Titulo', 'Voce nao tem nenhum titulo equipado.')],
        });
        return;
      }

      await titleService.unequipTitle(interaction.user.id);

      await interaction.editReply({
        embeds: [createSuccessEmbed('Titulo Removido', `O titulo **${equippedTitle.displayName}** foi removido.`)],
      });
      break;
    }

    case 'loja': {
      const shopTitles = await titleService.getShopTitles();

      if (shopTitles.length === 0) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Loja Vazia', 'Nenhum titulo disponivel na loja no momento.')],
        });
        return;
      }

      const rarityEmoji: Record<string, string> = {
        common: '⚪',
        uncommon: '🟢',
        rare: '🔵',
        epic: '🟣',
        legendary: '🟠',
      };

      const titleList = shopTitles.map((title) => {
        return `${rarityEmoji[title.rarity]} **${title.displayName}**\n┗ ${title.description}\n┗ 💰 ${title.price} 🪙`;
      }).join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(COLORS.ECONOMY)
        .setTitle('🏷️ Loja de Titulos')
        .setDescription(titleList)
        .setFooter({ text: `Use /titulos comprar <id> para comprar` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      break;
    }

    case 'comprar': {
      const titleId = interaction.options.getString('id', true);

      if (!interaction.member || !('guild' in interaction.member)) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Erro', 'Este comando so pode ser usado em um servidor.')],
        });
        return;
      }

      const result = await titleService.purchaseTitle(
        interaction.member as import('discord.js').GuildMember,
        titleId
      );

      if (result.success) {
        const embed = new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle('🏷️ Titulo Adquirido!')
          .setDescription(result.message)
          .addFields(
            { name: 'Titulo', value: result.title?.displayName || 'N/A', inline: true },
            { name: 'Novo Saldo', value: `${result.newBalance} 🪙`, inline: true },
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          embeds: [createErrorEmbed('Erro', result.message)],
        });
      }
      break;
    }
  }
}
