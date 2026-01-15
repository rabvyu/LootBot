import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { jobService } from '../../services/jobService';
import { userRepository } from '../../database/repositories/userRepository';
import { JobType } from '../../database/models/Job';

export const data = new SlashCommandBuilder()
  .setName('trabalho')
  .setDescription('Sistema de trabalhos para ganhar ouro')
  .addSubcommand(sub =>
    sub.setName('lista').setDescription('Ver trabalhos disponiveis')
  )
  .addSubcommand(sub =>
    sub
      .setName('aceitar')
      .setDescription('Aceitar um trabalho')
      .addStringOption(opt =>
        opt
          .setName('trabalho')
          .setDescription('Tipo de trabalho')
          .setRequired(true)
          .addChoices(
            { name: 'Taverneiro', value: 'taverneiro' },
            { name: 'Limpador de Esterco', value: 'limpador' },
            { name: 'Mensageiro', value: 'mensageiro' },
            { name: 'Guarda Noturno', value: 'guarda' },
            { name: 'Ajudante de Ferreiro', value: 'ferreiro' },
            { name: 'Pescador', value: 'pescador' },
            { name: 'Lenhador', value: 'lenhador' },
            { name: 'Mineiro', value: 'mineiro' },
            { name: 'Fazendeiro', value: 'fazendeiro' },
            { name: 'Cozinheiro', value: 'cozinheiro' }
          )
      )
  )
  .addSubcommand(sub =>
    sub.setName('turno').setDescription('Completar um turno de trabalho')
  )
  .addSubcommand(sub =>
    sub.setName('sair').setDescription('Sair do trabalho atual')
  )
  .addSubcommand(sub =>
    sub.setName('status').setDescription('Ver status do seu trabalho')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'lista':
      await handleLista(interaction);
      break;
    case 'aceitar':
      await handleAceitar(interaction);
      break;
    case 'turno':
      await handleTurno(interaction);
      break;
    case 'sair':
      await handleSair(interaction);
      break;
    case 'status':
      await handleStatus(interaction);
      break;
  }
}

async function handleLista(interaction: ChatInputCommandInteraction) {
  const jobs = jobService.getJobTypes();

  const jobList = jobs.map(job => {
    const levelReq = job.requiredLevel ? ` (Lv.${job.requiredLevel}+)` : '';
    return `${job.emoji} **${job.name}**${levelReq}\n` +
      `   ${job.description}\n` +
      `   Turno: ${job.shiftDurationMinutes}min | ${job.coinsPerShift.min}-${job.coinsPerShift.max} coins`;
  }).join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle('Trabalhos Disponiveis')
    .setDescription(jobList)
    .setColor('#DAA520')
    .setFooter({ text: 'Use: /trabalho aceitar <trabalho>' });

  await interaction.reply({ embeds: [embed] });
}

async function handleAceitar(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const trabalho = interaction.options.getString('trabalho', true) as JobType;

  const user = await userRepository.findByDiscordId(discordId);
  const userLevel = user?.level || 1;

  const result = await jobService.startJob(discordId, trabalho, userLevel);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('Trabalho Aceito!')
      .setDescription(result.message)
      .setColor('#00FF00');
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: `${result.message}`, ephemeral: true });
  }
}

async function handleTurno(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;

  const result = await jobService.completeShift(discordId);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('Turno Completo!')
      .setDescription(result.message)
      .setColor('#FFD700');
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: `${result.message}`, ephemeral: true });
  }
}

async function handleSair(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;

  const result = await jobService.quitJob(discordId);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('Trabalho Encerrado')
      .setDescription(result.message)
      .setColor('#FF6600');
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: `${result.message}`, ephemeral: true });
  }
}

async function handleStatus(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;
  const status = await jobService.getStatus(discordId);

  if (!status.job?.currentJob) {
    await interaction.reply({
      content: 'Voce nao tem um trabalho. Use `/trabalho lista` para ver opcoes.',
      ephemeral: true,
    });
    return;
  }

  const workStatus = status.canWork
    ? 'Pronto para trabalhar!'
    : `Aguarde ${status.timeUntilNextShift} minutos`;

  const embed = new EmbedBuilder()
    .setTitle(`${status.info?.emoji} ${status.info?.name}`)
    .setDescription(
      `**Status:** ${workStatus}\n\n` +
      `**Turnos Completados:** ${status.job.shiftsCompleted}\n` +
      `**Total Ganho:** ${status.job.totalEarned} coins\n\n` +
      `**Pagamento:** ${status.info?.coinsPerShift.min}-${status.info?.coinsPerShift.max} coins/turno\n` +
      `**Duracao do Turno:** ${status.info?.shiftDurationMinutes} minutos`
    )
    .setColor(status.canWork ? '#00FF00' : '#FF6600')
    .setFooter({ text: status.canWork ? 'Use /trabalho turno' : 'Aguarde o proximo turno' });

  await interaction.reply({ embeds: [embed] });
}
