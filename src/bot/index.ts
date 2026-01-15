import { Events } from 'discord.js';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

import { client } from './client';
import { connectDatabase } from '../database/connection';
import { badgeService } from '../services/badgeService';
import { missionService } from '../services/missionService';
import { economyService } from '../services/economyService';
import { voiceTrackerService } from '../services/voiceTracker';
import { titleService } from '../services/titleService';
import { petService } from '../services/petService';
import { expeditionService } from '../services/expeditionService';
import { resourceService } from '../services/resourceService';
import { craftingService } from '../services/craftingService';
import { rpgService } from '../services/rpgService';
import { logger } from '../utils/logger';

// Import event handlers
import { handleMessageCreate } from './events/messageCreate';
import { handleVoiceStateUpdate } from './events/voiceStateUpdate';
import { handleMessageReactionAdd } from './events/messageReactionAdd';
import { handleGuildMemberAdd } from './events/guildMemberAdd';
import { handleGuildMemberUpdate } from './events/guildMemberUpdate';
import { handleInteractionCreate } from './events/interactionCreate';

// Load environment variables
config();

// Load commands
async function loadCommands() {
  // Load user commands
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((file) =>
    (file.endsWith('.ts') || file.endsWith('.js')) && !fs.statSync(path.join(commandsPath, file)).isDirectory()
  );

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      logger.info(`Loaded command: ${command.data.name}`);
    }
  }

  // Load admin commands
  const adminPath = path.join(__dirname, 'commands', 'admin');
  if (fs.existsSync(adminPath)) {
    const adminFiles = fs.readdirSync(adminPath).filter((file) =>
      file.endsWith('.ts') || file.endsWith('.js')
    );

    for (const file of adminFiles) {
      const filePath = path.join(adminPath, file);
      const command = await import(filePath);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        logger.info(`Loaded admin command: ${command.data.name}`);
      }
    }
  }
}

// Setup event listeners
function setupEvents() {
  // Ready event
  client.once(Events.ClientReady, (readyClient) => {
    logger.info(`Bot is ready! Logged in as ${readyClient.user.tag}`);

    // Start voice tracker
    voiceTrackerService.start();
  });

  // Message event (XP from messages)
  client.on(Events.MessageCreate, handleMessageCreate);

  // Voice state event (XP from voice)
  client.on(Events.VoiceStateUpdate, handleVoiceStateUpdate);

  // Reaction event (XP from reactions)
  client.on(Events.MessageReactionAdd, handleMessageReactionAdd);

  // Member join event
  client.on(Events.GuildMemberAdd, handleGuildMemberAdd);

  // Member update event (boost detection)
  client.on(Events.GuildMemberUpdate, handleGuildMemberUpdate);

  // Interaction event (slash commands)
  client.on(Events.InteractionCreate, handleInteractionCreate);

  // Error handling
  client.on(Events.Error, (error) => {
    logger.error('Discord client error:', error);
  });

  client.on(Events.Warn, (warning) => {
    logger.warn('Discord client warning:', warning);
  });
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down...');

  // End all voice sessions
  await voiceTrackerService.endAllSessions();

  // Stop voice tracker
  voiceTrackerService.stop();

  // Destroy client
  client.destroy();

  logger.info('Bot shut down successfully');
  process.exit(0);
}

// Start bot
async function start() {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize badges
    await badgeService.initializeBadges();

    // Initialize missions
    await missionService.initialize();

    // Initialize shop
    await economyService.initializeShop();

    // Initialize titles
    await titleService.initialize();

    // Initialize pets
    await petService.initialize();

    // Initialize expeditions
    await expeditionService.initialize();

    // Initialize resources
    await resourceService.initialize();

    // Initialize crafting
    await craftingService.initialize();

    // Initialize RPG
    await rpgService.initialize();

    // Load commands
    await loadCommands();

    // Setup events
    setupEvents();

    // Login
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      throw new Error('DISCORD_TOKEN is not defined');
    }

    await client.login(token);

    // Handle shutdown signals
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Export for use in other modules
export { client, start };

// Start if this is the main module
if (require.main === module) {
  start();
}
