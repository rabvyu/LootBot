import { config } from 'dotenv';

// Load environment variables first
config();

import { connectDatabase } from './database/connection';
import { start as startBot } from './bot';
import { startAPI } from './api';
import { badgeService } from './services/badgeService';
import { logger } from './utils/logger';

async function main() {
  try {
    logger.info('Starting Discord Gamification Bot...');

    // Connect to database
    logger.info('Connecting to database...');
    await connectDatabase();

    // Initialize badges
    logger.info('Initializing badges...');
    await badgeService.initializeBadges();

    // Start bot
    logger.info('Starting Discord bot...');
    await startBot();

    // Start API
    logger.info('Starting API server...');
    startAPI();

    logger.info('All systems started successfully!');

  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start application
main();
