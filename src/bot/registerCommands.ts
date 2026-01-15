import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
config();

const commands: unknown[] = [];

// Load user commands
const userCommandsPath = path.join(__dirname, 'commands');
const userCommandFiles = fs.readdirSync(userCommandsPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of userCommandFiles) {
  const filePath = path.join(userCommandsPath, file);
  const stats = fs.statSync(filePath);

  // Skip directories
  if (stats.isDirectory()) continue;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`Loaded command: ${command.data.name}`);
  }
}

// Load admin commands
const adminCommandsPath = path.join(__dirname, 'commands', 'admin');
if (fs.existsSync(adminCommandsPath)) {
  const adminCommandFiles = fs.readdirSync(adminCommandsPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of adminCommandFiles) {
    const filePath = path.join(adminCommandsPath, file);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      console.log(`Loaded admin command: ${command.data.name}`);
    }
  }
}

// Register commands
async function registerCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  if (!token || !clientId) {
    console.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment variables');
    process.exit(1);
  }

  const rest = new REST().setToken(token);

  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // Register commands globally or for a specific guild
    if (guildId) {
      // Guild-specific (faster for development)
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`Successfully registered ${commands.length} guild commands.`);
    } else {
      // Global (takes up to 1 hour to propagate)
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log(`Successfully registered ${commands.length} global commands.`);
    }
  } catch (error) {
    console.error('Error registering commands:', error);
    process.exit(1);
  }
}

registerCommands();
