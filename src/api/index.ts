import express from 'express';
import { config } from 'dotenv';

import { corsMiddleware } from './middleware/cors';
import { generalLimiter } from './middleware/rateLimit';

// Import routes
import leaderboardRoutes from './routes/leaderboard';
import profileRoutes from './routes/profile';
import badgesRoutes from './routes/badges';
import statsRoutes from './routes/stats';
import adminRoutes from './routes/admin';

import { logger } from '../utils/logger';

// Load environment variables
config();

const app = express();

// Middleware
app.use(express.json());
app.use(corsMiddleware);
app.use(generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('API Error:', err);

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'CORS policy: Origin not allowed',
    });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// Start server
export function startAPI(): void {
  const port = parseInt(process.env.API_PORT || '3001');

  app.listen(port, () => {
    logger.info(`API server running on port ${port}`);
  });
}

export { app };
export default app;
