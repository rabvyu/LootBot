import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ButtonInteraction,
} from 'discord.js';
import { Character } from '../../database/models';
import { attributeService, ATTRIBUTE_INFO, AttributeName } from '../../services/attributeService';

export const data = new SlashCommandBuilder()
  .setName('atributos')
  .setDescription('Sistema de Atributos do Personagem')
  .addSubcommand(sub =>
    sub
      .setName('ver')
      .setDescription('Ver seus atributos e pontos disponíveis')
  )
  .addSubcommand(sub =>
    sub
      .setName('distribuir')
      .setDescription('Distribuir pontos em um atributo')
      .addStringOption(opt =>
        opt
          .setName('atributo')
          .setDescription('Atributo para aumentar')
          .setRequired(true)
          .addChoices(
            { name: '💪 Força (STR) - ATK físico, dano crítico', value: 'str' },
            { name: '🧠 Inteligência (INT) - ATK mágico, chance crítico', value: 'int' },
            { name: '❤️ Vitalidade (VIT) - HP, defesa', value: 'vit' },
            { name: '⚡ Agilidade (AGI) - Evasão, velocidade', value: 'agi' },
            { name: '🍀 Sorte (LUK) - Crítico, drop rate', value: 'luk' }
          )
      )
      .addIntegerOption(opt =>
        opt
          .setName('quantidade')
          .setDescription('Quantidade de pontos (padrão: 1)')
          .setRequired(false)
          .setMinValue(1)
          .setMaxValue(100)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('sugestao')
      .setDescription('Ver distribuição sugerida para sua classe')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.data[0]?.name;

  switch (subcommand) {
    case 'ver':
      return handleViewAttributes(interaction);
    case 'distribuir':
      return handleDistributePoints(interaction);
    case 'sugestao':
      return handleSuggestion(interaction);
    default:
      return handleViewAttributes(interaction);
  }
}

async function handleViewAttributes(interaction: ChatInputCommandInteraction) {
  const view = await attributeService.getAttributeView(interaction.user.id);

  if (!view) {
    return interaction.reply({
      content: '❌ Você precisa ter um personagem! Use `/rpg criar` primeiro.',
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('📊 Seus Atributos')
    .setColor(0x3498DB)
    .setDescription(
      `**Pontos Totais:** ${view.totalPoints}\n` +
      `**Pontos Disponíveis:** ${view.pointsAvailable}\n` +
      `**Pontos Distribuídos:** ${view.pointsSpent}`
    );

  // Atributos
  let attrText = '';
  for (const [key, value] of Object.entries(view.attributes)) {
    const info = ATTRIBUTE_INFO[key as AttributeName];
    attrText += `${info.emoji} **${info.name}:** ${value}\n`;
  }
  embed.addFields({ name: '🎯 Atributos', value: attrText || 'Nenhum ponto distribuído', inline: true });

  // Bônus calculados
  const bonuses = view.calculatedBonuses;
  let bonusText = '';
  if (bonuses.physicalAttack) bonusText += `⚔️ ATK Físico: +${bonuses.physicalAttack}\n`;
  if (bonuses.magicAttack) bonusText += `🔮 ATK Mágico: +${bonuses.magicAttack}\n`;
  if (bonuses.hp) bonusText += `❤️ HP: +${bonuses.hp}\n`;
  if (bonuses.defense) bonusText += `🛡️ Defesa: +${bonuses.defense}\n`;
  if (bonuses.evasion) bonusText += `💨 Evasão: +${bonuses.evasion}%\n`;
  if (bonuses.critChance) bonusText += `🎯 Chance Crítico: +${bonuses.critChance.toFixed(1)}%\n`;
  if (bonuses.critDamage) bonusText += `💥 Dano Crítico: +${bonuses.critDamage.toFixed(1)}%\n`;
  if (bonuses.dropRate) bonusText += `🎁 Drop Rate: +${bonuses.dropRate}%\n`;

  embed.addFields({
    name: '📈 Bônus dos Atributos',
    value: bonusText || 'Nenhum bônus ainda',
    inline: true,
  });

  // Tabela de efeitos
  let effectsText = '';
  for (const [key, info] of Object.entries(ATTRIBUTE_INFO)) {
    effectsText += `${info.emoji} **${info.name}**\n`;
    for (const effect of info.effects) {
      effectsText += `  └ ${effect}\n`;
    }
  }

  embed.addFields({
    name: '📚 Efeitos dos Atributos',
    value: effectsText,
    inline: false,
  });

  embed.setFooter({ text: 'Use /atributos distribuir <atributo> <quantidade> para distribuir pontos' });

  // Botões para distribuição rápida se tem pontos
  if (view.pointsAvailable > 0) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('attr_str')
        .setLabel('+1 STR')
        .setEmoji('💪')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('attr_int')
        .setLabel('+1 INT')
        .setEmoji('🧠')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('attr_vit')
        .setLabel('+1 VIT')
        .setEmoji('❤️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('attr_agi')
        .setLabel('+1 AGI')
        .setEmoji('⚡')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('attr_luk')
        .setLabel('+1 LUK')
        .setEmoji('🍀')
        .setStyle(ButtonStyle.Secondary)
    );

    const response = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
      filter: (i: ButtonInteraction) => i.user.id === interaction.user.id,
    });

    collector.on('collect', async (i: ButtonInteraction) => {
      const attr = i.customId.replace('attr_', '') as AttributeName;
      const result = await attributeService.distributePoints(interaction.user.id, attr, 1);

      if (result.success) {
        await i.reply({ content: `✅ ${result.message}`, ephemeral: true });
        // Atualizar embed
        const newView = await attributeService.getAttributeView(interaction.user.id);
        if (newView && newView.pointsAvailable <= 0) {
          await response.edit({ components: [] });
          collector.stop();
        }
      } else {
        await i.reply({ content: `❌ ${result.message}`, ephemeral: true });
      }
    });

    collector.on('end', () => {
      response.edit({ components: [] }).catch(() => {});
    });
  } else {
    await interaction.reply({ embeds: [embed] });
  }
}

async function handleDistributePoints(interaction: ChatInputCommandInteraction) {
  const attribute = interaction.options.get('atributo')?.value as AttributeName;
  const amount = (interaction.options.get('quantidade')?.value as number) || 1;

  if (!attribute) {
    return interaction.reply({
      content: '❌ Especifique um atributo.',
      ephemeral: true,
    });
  }

  const result = await attributeService.distributePoints(interaction.user.id, attribute, amount);

  if (!result.success) {
    return interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true,
    });
  }

  const info = ATTRIBUTE_INFO[attribute];

  const embed = new EmbedBuilder()
    .setTitle(`${info.emoji} Pontos Distribuídos!`)
    .setColor(0x2ECC71)
    .setDescription(result.message);

  if (result.statChanges) {
    let changesText = '';
    if (result.statChanges.hp) changesText += `❤️ HP: +${result.statChanges.hp}\n`;
    if (result.statChanges.attack) changesText += `⚔️ ATK: +${result.statChanges.attack}\n`;
    if (result.statChanges.defense) changesText += `🛡️ DEF: +${result.statChanges.defense}\n`;
    if (result.statChanges.critChance) changesText += `🎯 Crítico: +${result.statChanges.critChance.toFixed(1)}%\n`;
    if (result.statChanges.critDamage) changesText += `💥 Dano Crítico: +${result.statChanges.critDamage.toFixed(1)}%\n`;
    if (result.statChanges.evasion) changesText += `💨 Evasão: +${result.statChanges.evasion}%\n`;
    if (result.statChanges.dropRate) changesText += `🎁 Drop: +${result.statChanges.dropRate}%\n`;

    if (changesText) {
      embed.addFields({ name: '📈 Stats Aumentados', value: changesText, inline: false });
    }
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleSuggestion(interaction: ChatInputCommandInteraction) {
  const character = await Character.findOne({ discordId: interaction.user.id });

  if (!character) {
    return interaction.reply({
      content: '❌ Você precisa ter um personagem! Use `/rpg criar` primeiro.',
      ephemeral: true,
    });
  }

  const baseClass = character.baseClass || character.class;
  const suggestion = attributeService.getSuggestedDistribution(baseClass as string);

  const classNames: Record<string, string> = {
    warrior: '⚔️ Guerreiro',
    mage: '🔮 Mago',
    archer: '🏹 Arqueiro',
    paladin: '🛡️ Paladino',
  };

  const embed = new EmbedBuilder()
    .setTitle(`📊 Distribuição Sugerida - ${classNames[baseClass] || baseClass}`)
    .setColor(0xF1C40F)
    .setDescription('Esta é uma sugestão de distribuição de atributos para sua classe.\n' +
      'Os valores são porcentagens do total de pontos.');

  let suggestionText = '';
  for (const [attr, percent] of Object.entries(suggestion)) {
    const info = ATTRIBUTE_INFO[attr as AttributeName];
    suggestionText += `${info.emoji} **${info.name}:** ${percent}%\n`;
  }

  embed.addFields({ name: '🎯 Distribuição Recomendada', value: suggestionText, inline: false });

  // Explicação
  const explanations: Record<string, string> = {
    warrior: '**Foco em STR e VIT:**\nGuerreiros precisam de dano físico alto e resistência para sobreviver na linha de frente.',
    mage: '**Foco em INT:**\nMagos dependem de inteligência para dano mágico. Um pouco de VIT ajuda na sobrevivência.',
    archer: '**Foco em AGI e LUK:**\nArqueiros se beneficiam de evasão e chance de crítico para maximizar o dano.',
    paladin: '**Foco em VIT e STR:**\nPaladinos são híbridos que precisam de resistência e um pouco de dano.',
  };

  embed.addFields({
    name: '💡 Por que essa distribuição?',
    value: explanations[baseClass] || 'Distribuição balanceada para sua classe.',
    inline: false,
  });

  embed.setFooter({ text: 'Esta é apenas uma sugestão - sinta-se livre para experimentar!' });

  await interaction.reply({ embeds: [embed] });
}
