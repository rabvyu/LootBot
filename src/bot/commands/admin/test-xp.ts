import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { xpService } from '../../../services/xpService';
import { userRepository } from '../../../database/repositories/userRepository';
import { antiExploitService } from '../../../services/antiExploit';
import { levelService } from '../../../services/levelService';
import { createSuccessEmbed, createErrorEmbed } from '../../../utils/embeds';
import { formatNumber } from '../../../utils/helpers';
import { XP_CONFIG } from '../../../utils/constants';

export const data = new SlashCommandBuilder()
  .setName('test-xp')
  .setDescription('Testar sistema de XP (Admin)')
  .addStringOption((option) =>
    option
      .setName('tipo')
      .setDescription('Tipo de teste')
      .setRequired(true)
      .addChoices(
        { name: 'Mensagem (simula msg curta)', value: 'message_short' },
        { name: 'Mensagem (simula msg media)', value: 'message_medium' },
        { name: 'Mensagem (simula msg longa)', value: 'message_long' },
        { name: 'Voz (simula 2 pessoas)', value: 'voice_2' },
        { name: 'Voz (simula 5 pessoas)', value: 'voice_5' },
        { name: 'Reacao dada', value: 'reaction_given' },
        { name: 'Reacao recebida', value: 'reaction_received' },
        { name: 'Daily', value: 'daily' },
        { name: 'Status (ver limites)', value: 'status' },
        { name: 'Limpar penalidade', value: 'clear_penalty' },
        { name: 'Resetar limites diarios', value: 'reset_daily' },
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const tipo = interaction.options.getString('tipo', true);
  const member = interaction.member as any;

  try {
    let result = '';

    switch (tipo) {
      case 'message_short': {
        // Simula mensagem curta (1-20 chars) = 1 XP
        const xpGain = await xpService.awardXP(member, 'message', 1);
        result = xpGain
          ? `✅ Mensagem curta: +${xpGain.finalAmount} XP`
          : '❌ Bloqueado (limite diario ou cooldown)';
        break;
      }

      case 'message_medium': {
        // Simula mensagem media (51-100 chars) = 3 XP
        const xpGain = await xpService.awardXP(member, 'message', 3);
        result = xpGain
          ? `✅ Mensagem media: +${xpGain.finalAmount} XP`
          : '❌ Bloqueado (limite diario ou cooldown)';
        break;
      }

      case 'message_long': {
        // Simula mensagem longa (200+ chars) = 5 XP
        const xpGain = await xpService.awardXP(member, 'message', 5);
        result = xpGain
          ? `✅ Mensagem longa: +${xpGain.finalAmount} XP`
          : '❌ Bloqueado (limite diario ou cooldown)';
        break;
      }

      case 'voice_2': {
        // Simula 2 pessoas em call = 1 XP/min
        const voiceXP = (2 - 1) * XP_CONFIG.VOICE_XP_BASE;
        const xpGain = await xpService.awardXP(member, 'voice', voiceXP);
        result = xpGain
          ? `✅ Voz (2 pessoas): +${xpGain.finalAmount} XP`
          : '❌ Bloqueado (limite diario)';
        break;
      }

      case 'voice_5': {
        // Simula 5 pessoas em call = 4 XP/min
        const voiceXP = (5 - 1) * XP_CONFIG.VOICE_XP_BASE;
        const xpGain = await xpService.awardXP(member, 'voice', voiceXP);
        result = xpGain
          ? `✅ Voz (5 pessoas): +${xpGain.finalAmount} XP`
          : '❌ Bloqueado (limite diario)';
        break;
      }

      case 'reaction_given': {
        const xpGain = await xpService.awardXP(member, 'reaction_given');
        result = xpGain
          ? `✅ Reacao dada: +${xpGain.finalAmount} XP`
          : '❌ Bloqueado (limite diario ou cooldown)';
        break;
      }

      case 'reaction_received': {
        const xpGain = await xpService.awardXP(member, 'reaction_received');
        result = xpGain
          ? `✅ Reacao recebida: +${xpGain.finalAmount} XP`
          : '❌ Bloqueado (limite diario)';
        break;
      }

      case 'daily': {
        const dailyResult = await xpService.awardDaily(member);
        result = dailyResult
          ? `✅ Daily: +${dailyResult.xpGained} XP (streak: ${dailyResult.newStreak}, bonus: +${dailyResult.streakBonus})`
          : '❌ Ja coletou hoje';
        break;
      }

      case 'status': {
        const user = await userRepository.findByDiscordId(member.id);
        const dailyXP = await userRepository.getDailyXP(member.id);
        const isPenalized = antiExploitService.isUserPenalized(member.id);

        result = `**Status do Usuario**\n\n`;
        result += `**XP Total:** ${formatNumber(user?.totalXP || 0)}\n`;
        result += `**Nivel:** ${user?.level || 1}\n`;
        result += `**Penalizado:** ${isPenalized ? '⚠️ SIM' : '✅ NAO'}\n\n`;
        result += `**XP Hoje:**\n`;
        result += `- Mensagens: ${dailyXP?.messages || 0}/${XP_CONFIG.DAILY_LIMITS.messages}\n`;
        result += `- Voz: ${dailyXP?.voice || 0}/${XP_CONFIG.DAILY_LIMITS.voice}\n`;
        result += `- Reacoes: ${dailyXP?.reactions || 0}/${XP_CONFIG.DAILY_LIMITS.reactions}\n`;
        result += `- Total: ${dailyXP?.total || 0}/${XP_CONFIG.DAILY_LIMITS.total}\n`;
        break;
      }

      case 'clear_penalty': {
        antiExploitService.clearPenalty(member.id);
        result = '✅ Penalidade removida! Voce pode ganhar XP novamente.';
        break;
      }

      case 'reset_daily': {
        // Reset daily XP limits for testing
        const userToReset = await userRepository.findByDiscordId(member.id);
        if (userToReset) {
          userToReset.dailyXP = {
            date: new Date(),
            messages: 0,
            voice: 0,
            reactions: 0,
            invites: 0,
            bonus: 0,
            total: 0,
          };
          await userToReset.save();
        }
        antiExploitService.clearPenalty(member.id);
        result = '✅ Limites diarios resetados! Voce pode ganhar XP organico novamente.';
        break;
      }
    }

    // Get updated user info
    const user = await userRepository.findByDiscordId(member.id);

    const embed = createSuccessEmbed(
      '🧪 Teste de XP',
      `${result}\n\n**XP Total:** ${formatNumber(user?.totalXP || 0)}\n**Nivel:** ${user?.level || 1}`
    );

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Test XP error:', error);
    await interaction.editReply({
      embeds: [createErrorEmbed('Erro', `Falha no teste: ${error}`)],
    });
  }
}
