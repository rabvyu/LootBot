import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  StringSelectMenuInteraction,
  ButtonInteraction,
} from 'discord.js';
import { Character } from '../../database/models';
import { classEvolutionService } from '../../services/classEvolutionService';
import { getClassInfo } from '../../data/classes';

export const data = new SlashCommandBuilder()
  .setName('evoluir')
  .setDescription('Evolua sua classe para uma forma mais poderosa!')
  .addSubcommand(sub =>
    sub
      .setName('status')
      .setDescription('Ver status de evolução e opções disponíveis')
  )
  .addSubcommand(sub =>
    sub
      .setName('classe')
      .setDescription('Evoluir para uma classe específica')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.data[0]?.name;

  switch (subcommand) {
    case 'status':
      return handleEvolutionStatus(interaction);
    case 'classe':
      return handleEvolveClass(interaction);
    default:
      return handleEvolutionStatus(interaction);
  }
}

async function handleEvolutionStatus(interaction: ChatInputCommandInteraction) {
  const status = await classEvolutionService.getEvolutionStatus(interaction.user.id);

  if (!status) {
    return interaction.reply({
      content: '❌ Você precisa ter um personagem! Use `/rpg criar` primeiro.',
      ephemeral: true,
    });
  }

  const currentClassInfo = getClassInfo(status.currentClass);

  const tierColors: Record<string, number> = {
    base: 0x95A5A6,
    intermediate: 0x3498DB,
    advanced: 0x9B59B6,
  };

  const tierNames: Record<string, string> = {
    base: '⬜ Classe Base',
    intermediate: '🔷 Classe Intermediária',
    advanced: '💎 Classe Avançada',
  };

  const embed = new EmbedBuilder()
    .setTitle('🔮 Status de Evolução')
    .setColor(tierColors[status.currentTier] || 0x95A5A6)
    .setDescription(
      `**Classe Atual:** ${currentClassInfo?.emoji || ''} ${currentClassInfo?.name || status.currentClass}\n` +
      `**Tier:** ${tierNames[status.currentTier]}\n` +
      `**Nível Atual:** ${status.currentLevel}\n` +
      `**Nível para Evoluir:** ${status.requiredLevel}`
    );

  if (!status.canEvolve) {
    if (status.currentTier === 'advanced') {
      embed.addFields({
        name: '👑 Evolução Máxima',
        value: 'Parabéns! Você alcançou o tier mais alto!\nVocê é um verdadeiro mestre da sua classe.',
        inline: false,
      });
    } else {
      const levelsNeeded = status.requiredLevel - status.currentLevel;
      embed.addFields({
        name: '⏳ Ainda não pode evoluir',
        value: `Faltam **${levelsNeeded} níveis** para poder evoluir.\n` +
          `Continue treinando e lutando para alcançar o nível ${status.requiredLevel}!`,
        inline: false,
      });
    }

    return interaction.reply({ embeds: [embed] });
  }

  // Pode evoluir - mostrar opções
  embed.addFields({
    name: '✨ Pronto para Evoluir!',
    value: `Você atingiu o nível necessário para evoluir!\n` +
      `Escolha uma das opções abaixo ou tente a sorte com Wildcard!`,
    inline: false,
  });

  let optionsText = '';
  for (const option of status.availableOptions) {
    if (option.isWildcard) {
      optionsText += `\n🎲 **${option.name}**\n${option.description}\n`;
    } else {
      optionsText += `\n${option.emoji} **${option.name}**\n*${option.description}*\n`;
      if (option.specialAbility) {
        optionsText += `⚡ Habilidade: ${option.specialAbility}\n`;
      }
    }
  }

  embed.addFields({
    name: '📋 Opções de Evolução',
    value: optionsText.substring(0, 1024),
    inline: false,
  });

  embed.addFields({
    name: '🎲 Chance de Wildcard',
    value: `${status.wildcardChance}% de chance ao escolher "Deixe a sorte rolar..."`,
    inline: false,
  });

  embed.setFooter({ text: 'Use /evoluir classe para escolher sua evolução!' });

  await interaction.reply({ embeds: [embed] });
}

async function handleEvolveClass(interaction: ChatInputCommandInteraction) {
  const status = await classEvolutionService.getEvolutionStatus(interaction.user.id);

  if (!status) {
    return interaction.reply({
      content: '❌ Você precisa ter um personagem! Use `/rpg criar` primeiro.',
      ephemeral: true,
    });
  }

  if (!status.canEvolve) {
    return interaction.reply({
      content: `❌ ${status.reason || 'Você não pode evoluir ainda.'}`,
      ephemeral: true,
    });
  }

  if (status.availableOptions.length === 0) {
    return interaction.reply({
      content: '❌ Não há opções de evolução disponíveis.',
      ephemeral: true,
    });
  }

  // Criar menu de seleção
  const selectOptions = status.availableOptions.map(option => ({
    label: option.name,
    value: option.id,
    description: option.description.substring(0, 100),
    emoji: option.isWildcard ? '🎲' : option.emoji,
  }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('evolution_select')
    .setPlaceholder('Escolha sua evolução...')
    .addOptions(selectOptions);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  const embed = new EmbedBuilder()
    .setTitle('🔮 Escolha sua Evolução')
    .setColor(0x9B59B6)
    .setDescription(
      '**⚠️ ATENÇÃO:** Esta escolha é permanente!\n\n' +
      'Selecione a classe para qual deseja evoluir no menu abaixo.\n\n' +
      '🎲 **Wildcard:** Se escolher "Deixe a sorte rolar...", você terá ' +
      `${status.wildcardChance}% de chance de conseguir uma classe especial!`
    );

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true,
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 60000,
    filter: (i: StringSelectMenuInteraction) => i.user.id === interaction.user.id,
  });

  collector.on('collect', async (i: StringSelectMenuInteraction) => {
    const selectedId = i.values[0];

    // Mostrar confirmação
    const selectedOption = status.availableOptions.find(o => o.id === selectedId);
    if (!selectedOption) {
      await i.reply({ content: '❌ Opção inválida.', ephemeral: true });
      return;
    }

    const confirmEmbed = new EmbedBuilder()
      .setTitle('⚠️ Confirmar Evolução')
      .setColor(0xF1C40F)
      .setDescription(
        `Você está prestes a evoluir para:\n\n` +
        `${selectedOption.emoji} **${selectedOption.name}**\n\n` +
        `*${selectedOption.description}*\n\n` +
        `**Esta ação não pode ser desfeita!**\n` +
        `Tem certeza que deseja continuar?`
      );

    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_evolution')
        .setLabel('Confirmar Evolução')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId('cancel_evolution')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

    await i.update({ embeds: [confirmEmbed], components: [confirmRow] });

    const buttonCollector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
      filter: (bi: ButtonInteraction) => bi.user.id === interaction.user.id,
    });

    buttonCollector.on('collect', async (bi: ButtonInteraction) => {
      if (bi.customId === 'cancel_evolution') {
        await bi.update({
          embeds: [new EmbedBuilder()
            .setTitle('❌ Evolução Cancelada')
            .setColor(0xE74C3C)
            .setDescription('Você cancelou a evolução. Use `/evoluir classe` quando estiver pronto.')
          ],
          components: [],
        });
        buttonCollector.stop();
        collector.stop();
        return;
      }

      if (bi.customId === 'confirm_evolution') {
        const result = await classEvolutionService.evolveToClass(interaction.user.id, selectedId);

        if (!result.success) {
          await bi.update({
            embeds: [new EmbedBuilder()
              .setTitle('❌ Erro na Evolução')
              .setColor(0xE74C3C)
              .setDescription(result.message)
            ],
            components: [],
          });
        } else {
          const successEmbed = new EmbedBuilder()
            .setTitle(result.isWildcard ? '🌟 EVOLUÇÃO WILDCARD!' : '🎉 Evolução Completa!')
            .setColor(result.isWildcard ? 0xF1C40F : 0x2ECC71)
            .setDescription(result.message);

          await bi.update({ embeds: [successEmbed], components: [] });
        }

        buttonCollector.stop();
        collector.stop();
      }
    });

    buttonCollector.on('end', (_: unknown, reason: string) => {
      if (reason === 'time') {
        response.edit({
          embeds: [new EmbedBuilder()
            .setTitle('⏰ Tempo Esgotado')
            .setColor(0x95A5A6)
            .setDescription('A seleção expirou. Use `/evoluir classe` novamente.')
          ],
          components: [],
        }).catch(() => {});
      }
    });
  });

  collector.on('end', (_: unknown, reason: string) => {
    if (reason === 'time') {
      response.edit({
        embeds: [new EmbedBuilder()
          .setTitle('⏰ Tempo Esgotado')
          .setColor(0x95A5A6)
          .setDescription('A seleção expirou. Use `/evoluir classe` novamente.')
        ],
        components: [],
      }).catch(() => {});
    }
  });
}
