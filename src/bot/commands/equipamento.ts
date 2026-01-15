import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { equipmentService } from '../../services/equipmentService';
import { economyRepository } from '../../database/repositories/economyRepository';
import { EquipmentSlot } from '../../database/models/Equipment';

export const data = new SlashCommandBuilder()
  .setName('equipamento')
  .setDescription('Sistema de equipamentos')
  .addSubcommand(sub =>
    sub.setName('inventario').setDescription('Ver seu inventario de equipamentos')
  )
  .addSubcommand(sub =>
    sub.setName('equipados').setDescription('Ver itens equipados e bonus')
  )
  .addSubcommand(sub =>
    sub
      .setName('equipar')
      .setDescription('Equipar um item')
      .addStringOption(opt =>
        opt.setName('id').setDescription('ID do equipamento').setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('desequipar')
      .setDescription('Desequipar um item')
      .addStringOption(opt =>
        opt.setName('slot').setDescription('Slot do item').setRequired(true)
        .addChoices(
          { name: 'Arma', value: 'weapon' },
          { name: 'Armadura', value: 'armor' },
          { name: 'Elmo', value: 'helmet' },
          { name: 'Botas', value: 'boots' },
          { name: 'Luvas', value: 'gloves' },
          { name: 'Anel', value: 'ring' },
          { name: 'Amuleto', value: 'amulet' }
        )
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('vender')
      .setDescription('Vender um equipamento')
      .addStringOption(opt =>
        opt.setName('id').setDescription('ID do equipamento').setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub.setName('stats').setDescription('Ver estatisticas do sistema de equipamentos')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'inventario':
      await handleInventario(interaction);
      break;
    case 'equipados':
      await handleEquipados(interaction);
      break;
    case 'equipar':
      await handleEquipar(interaction);
      break;
    case 'desequipar':
      await handleDesequipar(interaction);
      break;
    case 'vender':
      await handleVender(interaction);
      break;
    case 'stats':
      await handleStats(interaction);
      break;
  }
}

async function handleInventario(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const equipment = await equipmentService.getPlayerEquipment(discordId);

  if (equipment.length === 0) {
    await interaction.reply({
      content: 'Voce nao tem equipamentos. Derrote monstros para conseguir drops!',
      ephemeral: true,
    });
    return;
  }

  const grouped: Record<string, typeof equipment> = {};
  for (const item of equipment) {
    const slot = item.slot;
    if (!grouped[slot]) grouped[slot] = [];
    grouped[slot].push(item);
  }

  const fields = [];
  for (const [slot, items] of Object.entries(grouped)) {
    const slotName = equipmentService.getSlotName(slot as EquipmentSlot);
    const itemList = items.slice(0, 5).map(item => {
      const emoji = equipmentService.getRarityEmoji(item.rarity);
      const equipped = item.isEquipped ? ' [E]' : '';
      const set = item.setName ? ` (${item.setName})` : '';
      return `${emoji} **${item.name}**${set}${equipped}\n   ID: \`${item._id}\``;
    }).join('\n');

    fields.push({
      name: `${slotName} (${items.length})`,
      value: itemList + (items.length > 5 ? `\n... +${items.length - 5}` : ''),
      inline: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('Inventario de Equipamentos')
    .setDescription(`Total: **${equipment.length}/50** itens`)
    .addFields(fields.slice(0, 6))
    .setColor('#8B4513')
    .setFooter({ text: 'Legenda: [E] = Equipado | Use /equipamento equipar <id>' });

  await interaction.reply({ embeds: [embed] });
}

async function handleEquipados(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const equipped = await equipmentService.getEquippedItems(discordId);
  const { stats, setBonuses } = await equipmentService.calculateTotalStats(discordId);

  const slots: EquipmentSlot[] = ['weapon', 'armor', 'helmet', 'boots', 'gloves', 'ring', 'amulet'];
  const slotLines = slots.map(slot => {
    const item = equipped.find(e => e.slot === slot);
    const slotName = equipmentService.getSlotName(slot);
    if (item) {
      const emoji = equipmentService.getRarityEmoji(item.rarity);
      return `**${slotName}:** ${emoji} ${item.name}`;
    }
    return `**${slotName}:** Vazio`;
  });

  const statsText = [
    `ATK: +${stats.attack || 0}`,
    `DEF: +${stats.defense || 0}`,
    `HP: +${stats.hp || 0}`,
    `CRIT: +${stats.critChance || 0}%`,
    `CRIT DMG: +${stats.critDamage || 0}%`,
  ].join(' | ');

  let setBonusText = 'Nenhum bonus de set ativo';
  if (setBonuses.length > 0) {
    setBonusText = setBonuses.map(sb => {
      const info = equipmentService.getSetInfo(sb.name);
      const bonusLevel = sb.pieces >= 4 ? '4 pecas' : '2 pecas';
      return `**${sb.name}** (${sb.pieces} pecas) - Bonus ${bonusLevel} ativo!`;
    }).join('\n');
  }

  const embed = new EmbedBuilder()
    .setTitle('Equipamentos Atuais')
    .setDescription(slotLines.join('\n'))
    .addFields(
      { name: 'Bonus Totais', value: statsText, inline: false },
      { name: 'Bonus de Sets', value: setBonusText, inline: false }
    )
    .setColor('#FFD700');

  await interaction.reply({ embeds: [embed] });
}

async function handleEquipar(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const equipmentId = interaction.options.getString('id', true);

  const result = await equipmentService.equipItem(discordId, equipmentId);

  if (result.success) {
    await interaction.reply({ content: `${result.message}` });
  } else {
    await interaction.reply({ content: `${result.message}`, ephemeral: true });
  }
}

async function handleDesequipar(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const slot = interaction.options.getString('slot', true) as EquipmentSlot;

  const equipped = await equipmentService.getEquippedItems(discordId);
  const item = equipped.find(e => e.slot === slot);

  if (!item) {
    await interaction.reply({ content: 'Nenhum item equipado nesse slot.', ephemeral: true });
    return;
  }

  const result = await equipmentService.unequipItem(discordId, item._id.toString());
  await interaction.reply({ content: result.message, ephemeral: !result.success });
}

async function handleVender(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const equipmentId = interaction.options.getString('id', true);

  const result = await equipmentService.sellEquipment(discordId, equipmentId);

  if (result.success && result.coins) {
    await economyRepository.addCoins(discordId, result.coins, 'sell', 'Venda de equipamento');
    await interaction.reply({ content: `${result.message}` });
  } else {
    await interaction.reply({ content: `${result.message}`, ephemeral: true });
  }
}

async function handleStats(interaction: ChatInputCommandInteraction) {
  const stats = equipmentService.getStats();

  const embed = new EmbedBuilder()
    .setTitle('Sistema de Equipamentos')
    .setDescription(
      `**Total de Equipamentos:** ${stats.total}\n` +
      `**Sets Disponiveis:** ${stats.sets}\n\n` +
      `**Por Tier:**\n` +
      `Tier 1 (Iniciante): ${stats.byTier.tier1}\n` +
      `Tier 2 (Novato): ${stats.byTier.tier2}\n` +
      `Tier 3 (Intermediario): ${stats.byTier.tier3}\n` +
      `Tier 4 (Avancado): ${stats.byTier.tier4}\n` +
      `Tier 5 (Expert): ${stats.byTier.tier5}\n` +
      `Tier 6 (Mestre): ${stats.byTier.tier6}\n\n` +
      `**Por Raridade:**\n` +
      `Comum: ${stats.byRarity.common}\n` +
      `Incomum: ${stats.byRarity.uncommon}\n` +
      `Raro: ${stats.byRarity.rare}\n` +
      `Epico: ${stats.byRarity.epic}\n` +
      `Lendario: ${stats.byRarity.legendary}`
    )
    .setColor('#8B4513');

  await interaction.reply({ embeds: [embed] });
}
