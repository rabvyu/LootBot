import { Interaction, ChatInputCommandInteraction, TextChannel, EmbedBuilder } from 'discord.js';
import { client } from '../client';
import { logger } from '../../utils/logger';
import { rateLimitService } from '../../services/rateLimitService';

// Commands exempt from rate limiting (admin commands)
const EXEMPT_COMMANDS = [
  'give-xp', 'remove-xp', 'give-coins', 'give-badge', 'remove-badge',
  'reset-user', 'config', 'level-roles', 'logs', 'shop-manage',
  'event-manage', 'event', 'check-badges', 'test-xp', 'help'
];

export async function handleInteractionCreate(interaction: Interaction): Promise<void> {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    await handleSlashCommand(interaction);
    return;
  }

  // Handle button interactions (if needed in future)
  if (interaction.isButton()) {
    // Handle button clicks
    return;
  }

  // Handle select menu interactions (if needed in future)
  if (interaction.isStringSelectMenu()) {
    // Handle select menu
    return;
  }
}

async function handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.warn(`Unknown command: ${interaction.commandName}`);
    await interaction.reply({
      content: 'Comando desconhecido!',
      ephemeral: true,
    });
    return;
  }

  // Check rate limiting (skip for exempt commands)
  const channelName = (interaction.channel as TextChannel)?.name || '';
  const isExempt = EXEMPT_COMMANDS.includes(interaction.commandName);

  // Get user roles for rate limit exemption check
  const userRoles = interaction.member?.roles
    ? Array.isArray(interaction.member.roles)
      ? interaction.member.roles
      : [...interaction.member.roles.cache.values()].map(r => r.name)
    : [];

  if (!isExempt) {
    const rateCheck = rateLimitService.checkRateLimit(interaction.user.id, channelName, userRoles);

    if (!rateCheck.allowed) {
      const embed = new EmbedBuilder()
        .setTitle('⏱️ Rate Limit')
        .setDescription(rateCheck.reason || 'Aguarde antes de usar outro comando.')
        .setColor('#FF6600')
        .setFooter({ text: 'Dica: Use o canal #LootBot para comandos ilimitados!' });

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }
  }

  try {
    await command.execute(interaction);

    // Record successful command usage (only for non-exempt commands)
    if (!isExempt) {
      rateLimitService.recordCommand(interaction.user.id, channelName, userRoles);
    }
  } catch (error) {
    logger.error(`Error executing command ${interaction.commandName}:`, error);

    const errorMessage = 'Ocorreu um erro ao executar este comando!';

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
}

export default handleInteractionCreate;
