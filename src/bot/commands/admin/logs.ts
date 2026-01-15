import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { activityLogRepository } from '../../../database/repositories/activityLogRepository';
import { antiExploitService } from '../../../services/antiExploit';
import { createErrorEmbed } from '../../../utils/embeds';
import { COLORS } from '../../../utils/constants';

export const data = new SlashCommandBuilder()
  .setName('logs')
  .setDescription('Ver logs de atividade (Admin)')
  .addUserOption((option) =>
    option
      .setName('usuario')
      .setDescription('Usuario para ver logs')
      .setRequired(false)
  )
  .addBooleanOption((option) =>
    option
      .setName('suspeitos')
      .setDescription('Mostrar apenas logs suspeitos')
      .setRequired(false)
  )
  .addIntegerOption((option) =>
    option
      .setName('limite')
      .setDescription('Numero de logs (padrao: 20)')
      .setRequired(false)
      .setMinValue(5)
      .setMaxValue(50)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const targetUser = interaction.options.getUser('usuario');
  const suspiciousOnly = interaction.options.getBoolean('suspeitos') || false;
  const limit = interaction.options.getInteger('limite') || 20;

  let logs;
  let title;

  if (targetUser) {
    if (suspiciousOnly) {
      // Get suspicious count for user
      const suspiciousCount = await antiExploitService.getSuspiciousCount(targetUser.id);
      logs = await activityLogRepository.getUserLogs(targetUser.id, limit);
      logs = logs.filter(log => log.suspicious);
      title = `Logs Suspeitos de ${targetUser.username} (${suspiciousCount} total)`;
    } else {
      logs = await activityLogRepository.getUserLogs(targetUser.id, limit);
      title = `Logs de ${targetUser.username}`;
    }
  } else if (suspiciousOnly) {
    logs = await activityLogRepository.getSuspiciousLogs(limit);
    title = 'Logs Suspeitos do Servidor';
  } else {
    await interaction.editReply({
      embeds: [createErrorEmbed('Parametro Necessario', 'Especifique um usuario ou marque "suspeitos" como true.')],
    });
    return;
  }

  if (logs.length === 0) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Sem Logs', 'Nenhum log encontrado com os criterios especificados.')],
    });
    return;
  }

  const description = logs.map((log) => {
    const timestamp = log.timestamp.toLocaleString('pt-BR');
    const xpInfo = log.xpGained !== 0 ? ` (${log.xpGained > 0 ? '+' : ''}${log.xpGained} XP)` : '';
    const suspiciousTag = log.suspicious ? ' [SUSPEITO]' : '';

    return `\`${timestamp}\` **${log.action}**${xpInfo}${suspiciousTag}`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(suspiciousOnly ? COLORS.WARNING : COLORS.PRIMARY)
    .setTitle(title)
    .setDescription(description.slice(0, 4096)) // Discord embed description limit
    .setFooter({ text: `Mostrando ${logs.length} logs` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
