import { Interaction, ChatInputCommandInteraction } from 'discord.js';
import { client } from '../client';
import { logger } from '../../utils/logger';

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

  try {
    await command.execute(interaction);
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
