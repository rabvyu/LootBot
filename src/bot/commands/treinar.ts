import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { trainingService } from '../../services/trainingService';
import { TrainingType } from '../../database/models/Training';

export const data = new SlashCommandBuilder()
  .setName('treinar')
  .setDescription('Sistema de treinamento idle')
  .addSubcommand(sub =>
    sub.setName('lista').setDescription('Ver opcoes de treinamento')
  )
  .addSubcommand(sub =>
    sub
      .setName('iniciar')
      .setDescription('Iniciar treinamento')
      .addStringOption(opt =>
        opt
          .setName('tipo')
          .setDescription('Tipo de treinamento')
          .setRequired(true)
          .addChoices(
            { name: 'Socar Arvore', value: 'punch_tree' },
            { name: 'Chutar Arvore', value: 'kick_tree' },
            { name: 'Cortar Arvore', value: 'chop_tree' },
            { name: 'Minerar Pedra', value: 'mine_rock' },
            { name: 'Meditar', value: 'meditate' },
            { name: 'Correr', value: 'run' },
            { name: 'Nadar', value: 'swim' },
            { name: 'Escalar', value: 'climb' }
          )
      )
  )
  .addSubcommand(sub =>
    sub.setName('parar').setDescription('Parar treinamento atual')
  )
  .addSubcommand(sub =>
    sub.setName('coletar').setDescription('Coletar XP acumulado')
  )
  .addSubcommand(sub =>
    sub.setName('status').setDescription('Ver status do treinamento')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'lista':
      await handleLista(interaction);
      break;
    case 'iniciar':
      await handleIniciar(interaction);
      break;
    case 'parar':
      await handleParar(interaction);
      break;
    case 'coletar':
      await handleColetar(interaction);
      break;
    case 'status':
      await handleStatus(interaction);
      break;
  }
}

async function handleLista(interaction: ChatInputCommandInteraction) {
  const types = trainingService.getTrainingTypes();

  const categories = {
    physical: types.filter(t => t.category === 'physical'),
    combat: types.filter(t => t.category === 'combat'),
    mental: types.filter(t => t.category === 'mental'),
  };

  const embed = new EmbedBuilder()
    .setTitle('Opcoes de Treinamento')
    .setDescription('Escolha um tipo de treinamento para ganhar XP passivamente.')
    .addFields(
      {
        name: 'Fisico',
        value: categories.physical.map(t =>
          `${t.emoji} **${t.name}**\n   ${t.description}\n   XP: ${t.xpPerMinute}/min`
        ).join('\n\n'),
        inline: false,
      },
      {
        name: 'Combate',
        value: categories.combat.map(t =>
          `${t.emoji} **${t.name}**\n   ${t.description}\n   XP: ${t.xpPerMinute}/min`
        ).join('\n\n'),
        inline: false,
      },
      {
        name: 'Mental',
        value: categories.mental.map(t =>
          `${t.emoji} **${t.name}**\n   ${t.description}\n   XP: ${t.xpPerMinute}/min`
        ).join('\n\n'),
        inline: false,
      }
    )
    .setColor('#00CED1')
    .setFooter({ text: 'Use: /treinar iniciar <tipo> | Max 8h de acumulo' });

  await interaction.reply({ embeds: [embed] });
}

async function handleIniciar(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const tipo = interaction.options.getString('tipo', true) as TrainingType;

  const result = await trainingService.startTraining(discordId, tipo);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('Treinamento Iniciado!')
      .setDescription(result.message)
      .setColor('#00FF00');
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: `${result.message}`, ephemeral: true });
  }
}

async function handleParar(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;

  const result = await trainingService.stopTraining(discordId);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('Treinamento Finalizado!')
      .setDescription(result.message)
      .setColor('#FF6600');
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: `${result.message}`, ephemeral: true });
  }
}

async function handleColetar(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;

  const result = await trainingService.collectXP(discordId);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('XP Coletado!')
      .setDescription(result.message)
      .setColor('#FFD700');
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: `${result.message}`, ephemeral: true });
  }
}

async function handleStatus(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const status = await trainingService.getStatus(discordId);

  if (!status.active) {
    await interaction.reply({
      content: 'Voce nao esta treinando. Use `/treinar iniciar` para comecar!',
      ephemeral: true,
    });
    return;
  }

  const trainings = await trainingService.getAllUserTrainings(discordId);

  const trainingStats = trainings.map(t => {
    const info = trainingService.getTrainingInfo(t.trainingType);
    const hours = Math.floor(t.totalMinutes / 60);
    const mins = t.totalMinutes % 60;
    return `${info?.emoji} **${info?.name}**: ${hours}h ${mins}m (${t.xpEarned} XP)`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setTitle(`${status.info?.emoji} Treinamento Ativo: ${status.info?.name}`)
    .setDescription(
      `**XP Pendente:** ${status.pendingXP} XP (${status.pendingMinutes} min)\n\n` +
      `**Historico de Treinos:**\n${trainingStats || 'Nenhum'}\n\n` +
      `**Tempo Total:** ${Math.floor(status.totalMinutes / 60)}h ${status.totalMinutes % 60}m`
    )
    .setColor('#00CED1')
    .setFooter({ text: 'Use /treinar coletar para receber o XP' });

  await interaction.reply({ embeds: [embed] });
}
