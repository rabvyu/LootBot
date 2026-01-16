import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  StringSelectMenuInteraction,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
} from 'discord.js';
import { enchantmentService } from '../../services/enchantmentService';
import {
  EnchantmentType,
  getAllEnchantments,
  getEnchantmentById,
  getEnchantmentsForSlot,
  getLevelNumeral,
  ENCHANTMENT_MATERIALS,
} from '../../data/enchantments';
import { Equipment } from '../../database/models';

export const data = new SlashCommandBuilder()
  .setName('encantar')
  .setDescription('Sistema de Encantamentos')
  .addSubcommand(sub =>
    sub
      .setName('listar')
      .setDescription('Ver todos os encantamentos disponíveis')
  )
  .addSubcommand(sub =>
    sub
      .setName('aplicar')
      .setDescription('Aplicar encantamento em um equipamento')
  )
  .addSubcommand(sub =>
    sub
      .setName('ver')
      .setDescription('Ver encantamentos de um equipamento')
  )
  .addSubcommand(sub =>
    sub
      .setName('materiais')
      .setDescription('Ver seus materiais de encantamento')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'listar':
      return handleList(interaction);
    case 'aplicar':
      return handleApply(interaction);
    case 'ver':
      return handleView(interaction);
    case 'materiais':
      return handleMaterials(interaction);
    default:
      return handleList(interaction);
  }
}

// ==================== HANDLERS ====================

async function handleList(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const enchantments = getAllEnchantments();

  const embed = new EmbedBuilder()
    .setTitle('✨ Encantamentos Disponíveis')
    .setColor(0x9B59B6)
    .setDescription('Encantamentos podem ser aplicados em equipamentos para melhorar seus atributos.\n\n⚠️ **Atenção:** Encantamentos de alto nível têm chance de falha e podem destruir o equipamento!')
    .setFooter({ text: 'Use /encantar aplicar para encantar um equipamento' });

  for (const ench of enchantments) {
    const slotNames = ench.applicableSlots.map(s => translateSlot(s)).join(', ');

    embed.addFields({
      name: `${ench.emoji} ${ench.name}`,
      value: `${ench.description}\n**Stat:** ${translateStat(ench.stat)}\n**Slots:** ${slotNames}\n**Nível Máx:** ${ench.maxLevel}\n**Material:** ${ench.material.materialName}`,
      inline: true,
    });
  }

  // Info sobre chances
  embed.addFields({
    name: '📊 Chances de Sucesso',
    value:
      '**Nível I:** 100% sucesso, 0% destruição\n' +
      '**Nível II:** 85% sucesso, 5% destruição\n' +
      '**Nível III:** 65% sucesso, 15% destruição\n' +
      '**Nível IV:** 45% sucesso, 30% destruição\n' +
      '**Nível V:** 25% sucesso, 50% destruição',
    inline: false,
  });

  return interaction.editReply({ embeds: [embed] });
}

async function handleApply(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  // Buscar equipamentos do jogador
  const equipments = await enchantmentService.getPlayerEquipments(interaction.user.id);

  if (equipments.length === 0) {
    return interaction.editReply({
      content: '❌ Você não possui equipamentos para encantar.\nObtenha equipamentos através de crafting ou dungeons!',
    });
  }

  // Select menu para escolher equipamento
  const equipOptions = equipments.slice(0, 25).map(eq => ({
    label: eq.name,
    description: `${translateSlot(eq.slot)} | Tier ${eq.tier} | ${translateRarity(eq.rarity)}`,
    value: eq._id.toString(),
    emoji: getSlotEmoji(eq.slot),
  }));

  const equipSelect = new StringSelectMenuBuilder()
    .setCustomId('select_equipment')
    .setPlaceholder('Selecione um equipamento')
    .addOptions(equipOptions);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(equipSelect);

  const embed = new EmbedBuilder()
    .setTitle('✨ Aplicar Encantamento')
    .setColor(0x9B59B6)
    .setDescription('Selecione o equipamento que deseja encantar.')
    .setFooter({ text: 'Cuidado! Encantamentos de alto nível podem destruir o equipamento.' });

  const response = await interaction.editReply({
    embeds: [embed],
    components: [row],
  });

  // Collector para equipamento
  const equipCollector = response.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 120000,
  });

  equipCollector.on('collect', async (selectInteraction: StringSelectMenuInteraction) => {
    if (selectInteraction.user.id !== interaction.user.id) {
      return selectInteraction.reply({ content: '❌ Este menu não é para você!', ephemeral: true });
    }

    const equipmentId = selectInteraction.values[0];
    const equipment = equipments.find(e => e._id.toString() === equipmentId);

    if (!equipment) {
      return selectInteraction.update({ content: '❌ Equipamento não encontrado.', embeds: [], components: [] });
    }

    // Buscar encantamentos disponíveis para este slot
    const availableEnchantments = getEnchantmentsForSlot(equipment.slot);

    if (availableEnchantments.length === 0) {
      return selectInteraction.update({
        content: `❌ Não há encantamentos disponíveis para ${translateSlot(equipment.slot)}.`,
        embeds: [],
        components: [],
      });
    }

    // Select menu para encantamento
    const enchOptions = availableEnchantments.map(ench => {
      const currentLevel = equipment.enchantments?.[ench.enchantmentId] || 0;
      const levelText = currentLevel > 0 ? ` (Atual: ${getLevelNumeral(currentLevel)})` : '';

      return {
        label: `${ench.name}${levelText}`,
        description: `${ench.description} | +${ench.stat}`,
        value: ench.enchantmentId,
        emoji: ench.emoji,
      };
    });

    const enchSelect = new StringSelectMenuBuilder()
      .setCustomId('select_enchantment')
      .setPlaceholder('Selecione um encantamento')
      .addOptions(enchOptions);

    const enchRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(enchSelect);

    // Mostrar encantamentos atuais do equipamento
    let currentEnchantsText = 'Nenhum';
    if (equipment.enchantments) {
      const enchList = Object.entries(equipment.enchantments)
        .filter(([, level]) => level > 0)
        .map(([enchId, level]) => {
          const ench = getEnchantmentById(enchId as EnchantmentType);
          return ench ? `${ench.emoji} ${ench.name} ${getLevelNumeral(level)}` : null;
        })
        .filter(Boolean);

      if (enchList.length > 0) {
        currentEnchantsText = enchList.join('\n');
      }
    }

    const equipEmbed = new EmbedBuilder()
      .setTitle(`✨ Encantar: ${equipment.name}`)
      .setColor(0x9B59B6)
      .setDescription('Selecione qual encantamento deseja aplicar.')
      .addFields(
        { name: '📦 Equipamento', value: `${getSlotEmoji(equipment.slot)} ${equipment.name}`, inline: true },
        { name: '📊 Tier', value: `${equipment.tier}`, inline: true },
        { name: '💎 Raridade', value: translateRarity(equipment.rarity), inline: true },
        { name: '✨ Encantamentos Atuais', value: currentEnchantsText, inline: false }
      );

    await selectInteraction.update({ embeds: [equipEmbed], components: [enchRow] });

    // Collector para encantamento
    const enchCollector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: i => i.customId === 'select_enchantment',
      time: 120000,
    });

    enchCollector.on('collect', async (enchInteraction: StringSelectMenuInteraction) => {
      if (enchInteraction.user.id !== interaction.user.id) {
        return enchInteraction.reply({ content: '❌ Este menu não é para você!', ephemeral: true });
      }

      const enchantmentId = enchInteraction.values[0] as EnchantmentType;

      // Preview do encantamento
      const preview = await enchantmentService.previewEnchantment(
        interaction.user.id,
        equipmentId,
        enchantmentId
      );

      if (!preview) {
        return enchInteraction.update({
          content: '❌ Erro ao gerar preview do encantamento.',
          embeds: [],
          components: [],
        });
      }

      const previewEmbed = new EmbedBuilder()
        .setTitle(`${preview.enchantment.emoji} ${preview.enchantment.name} ${getLevelNumeral(preview.targetLevel)}`)
        .setColor(preview.canEnchant ? 0x00FF00 : 0xFF0000)
        .setDescription(preview.enchantment.description);

      previewEmbed.addFields(
        { name: '📊 Nível Atual', value: preview.currentLevel > 0 ? getLevelNumeral(preview.currentLevel) : 'Nenhum', inline: true },
        { name: '📈 Próximo Nível', value: getLevelNumeral(preview.targetLevel), inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: '📉 Valor Atual', value: preview.currentValue, inline: true },
        { name: '📈 Novo Valor', value: preview.newValue, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: '💰 Custo', value: `${preview.cost.coins.toLocaleString()} coins`, inline: true },
        { name: '📦 Materiais', value: `${preview.cost.materials}x ${preview.enchantment.material.materialName}`, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: '🎯 Chance de Sucesso', value: `${preview.successRate}%`, inline: true },
        { name: '💥 Chance de Destruição', value: `${preview.destructionRate}%`, inline: true },
        { name: '\u200b', value: '\u200b', inline: true }
      );

      if (!preview.canEnchant && preview.reason) {
        previewEmbed.addFields({
          name: '❌ Não pode encantar',
          value: preview.reason,
          inline: false,
        });
      }

      // Botões
      const confirmBtn = new ButtonBuilder()
        .setCustomId('confirm_enchant')
        .setLabel('Encantar!')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✨')
        .setDisabled(!preview.canEnchant);

      const cancelBtn = new ButtonBuilder()
        .setCustomId('cancel_enchant')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary);

      const btnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBtn, cancelBtn);

      await enchInteraction.update({ embeds: [previewEmbed], components: [btnRow] });

      // Collector para botões
      const btnCollector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
      });

      btnCollector.on('collect', async (btnInteraction: ButtonInteraction) => {
        if (btnInteraction.user.id !== interaction.user.id) {
          return btnInteraction.reply({ content: '❌ Este botão não é para você!', ephemeral: true });
        }

        if (btnInteraction.customId === 'cancel_enchant') {
          return btnInteraction.update({
            content: '❌ Encantamento cancelado.',
            embeds: [],
            components: [],
          });
        }

        // Aplicar encantamento
        const result = await enchantmentService.enchant(interaction.user.id, equipmentId, enchantmentId);

        const resultEmbed = new EmbedBuilder()
          .setTitle(result.success ? '✅ Encantamento Bem-sucedido!' : result.destroyed ? '💥 Equipamento Destruído!' : '❌ Encantamento Falhou!')
          .setColor(result.success ? 0x00FF00 : result.destroyed ? 0x8B0000 : 0xFF0000)
          .setDescription(result.message);

        if (result.success && result.newLevel) {
          resultEmbed.addFields({
            name: '📊 Novo Nível',
            value: `${preview.enchantment.emoji} ${preview.enchantment.name} ${getLevelNumeral(result.newLevel)}`,
            inline: false,
          });
        }

        await btnInteraction.update({ embeds: [resultEmbed], components: [] });
        btnCollector.stop();
        enchCollector.stop();
        equipCollector.stop();
      });

      btnCollector.on('end', async (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
          await interaction.editReply({ content: '⏰ Tempo esgotado.', embeds: [], components: [] });
        }
      });
    });
  });

  equipCollector.on('end', async (collected, reason) => {
    if (reason === 'time' && collected.size === 0) {
      await interaction.editReply({ content: '⏰ Tempo esgotado.', embeds: [], components: [] });
    }
  });
}

async function handleView(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const equipments = await enchantmentService.getPlayerEquipments(interaction.user.id);

  if (equipments.length === 0) {
    return interaction.editReply({
      content: '❌ Você não possui equipamentos.',
    });
  }

  // Filtrar apenas equipamentos com encantamentos
  const enchantedEquipments = equipments.filter(eq =>
    eq.enchantments && Object.values(eq.enchantments).some(level => level > 0)
  );

  if (enchantedEquipments.length === 0) {
    return interaction.editReply({
      content: '❌ Nenhum dos seus equipamentos possui encantamentos.\nUse `/encantar aplicar` para adicionar encantamentos!',
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('✨ Seus Equipamentos Encantados')
    .setColor(0x9B59B6)
    .setDescription(`Você tem **${enchantedEquipments.length}** equipamento(s) encantado(s).`);

  for (const eq of enchantedEquipments.slice(0, 10)) {
    const enchList = Object.entries(eq.enchantments || {})
      .filter(([, level]) => level > 0)
      .map(([enchId, level]) => {
        const ench = getEnchantmentById(enchId as EnchantmentType);
        return ench ? `${ench.emoji} ${ench.name} ${getLevelNumeral(level)}` : null;
      })
      .filter(Boolean)
      .join('\n');

    embed.addFields({
      name: `${getSlotEmoji(eq.slot)} ${eq.name}`,
      value: enchList || 'Nenhum encantamento',
      inline: true,
    });
  }

  if (enchantedEquipments.length > 10) {
    embed.setFooter({ text: `E mais ${enchantedEquipments.length - 10} equipamentos encantados...` });
  }

  return interaction.editReply({ embeds: [embed] });
}

async function handleMaterials(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const materials = await enchantmentService.getEnchantmentMaterials(interaction.user.id);

  if (materials.length === 0) {
    return interaction.editReply({
      content: '📦 Você não possui materiais de encantamento.\nObtenha materiais em dungeons e caçadas de alto nível!',
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('📦 Materiais de Encantamento')
    .setColor(0x9B59B6)
    .setDescription('Materiais usados para encantar equipamentos.');

  const materialList = materials
    .map(m => `${m.emoji} **${m.name}:** ${m.quantity}`)
    .join('\n');

  embed.addFields({
    name: 'Seus Materiais',
    value: materialList,
    inline: false,
  });

  // Info de onde obter
  embed.addFields({
    name: '📍 Como Obter',
    value:
      '🔥 **Essência de Fúria:** Monstros de fogo\n' +
      '🐉 **Escama de Dragão:** Dragões em dungeons\n' +
      '🩸 **Sangue Amaldiçoado:** Vampiros e demônios\n' +
      '👁️ **Olho de Águia:** Criaturas voadoras\n' +
      '🪶 **Pena de Fênix:** Boss Fênix (raro)\n' +
      '💎❤️ **Cristal da Vida:** Elementais de vida\n' +
      '🪙 **Moeda da Sorte:** Mimics e tesouros\n' +
      '🌀 **Fragmento do Caos:** Demônios do caos',
    inline: false,
  });

  return interaction.editReply({ embeds: [embed] });
}

// ==================== HELPERS ====================

function translateSlot(slot: string): string {
  const names: Record<string, string> = {
    weapon: 'Arma',
    armor: 'Armadura',
    helmet: 'Elmo',
    boots: 'Botas',
    gloves: 'Luvas',
    ring: 'Anel',
    amulet: 'Amuleto',
  };
  return names[slot] || slot;
}

function translateStat(stat: string): string {
  const names: Record<string, string> = {
    attack: 'Ataque',
    defense: 'Defesa',
    hp: 'HP',
    critChance: 'Chance Crítica',
    critDamage: 'Dano Crítico',
    evasion: 'Evasão',
    lifesteal: 'Roubo de Vida',
    dropRate: 'Taxa de Drop',
  };
  return names[stat] || stat;
}

function translateRarity(rarity: string): string {
  const names: Record<string, string> = {
    common: 'Comum',
    uncommon: 'Incomum',
    rare: 'Raro',
    epic: 'Épico',
    legendary: 'Lendário',
  };
  return names[rarity] || rarity;
}

function getSlotEmoji(slot: string): string {
  const emojis: Record<string, string> = {
    weapon: '⚔️',
    armor: '🛡️',
    helmet: '🪖',
    boots: '👢',
    gloves: '🧤',
    ring: '💍',
    amulet: '📿',
  };
  return emojis[slot] || '📦';
}
