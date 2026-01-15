import cors from 'cors';

const allowedOrigins = [
  process.env.SITE_URL || 'https://areaburti.com.br',
  process.env.CORS_ORIGIN || 'https://areaburti.com.br',
  'http://localhost:3000', // Development
  'http://localhost:3001', // Development alternative
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
  maxAge: 86400, // 24 hours
});

export default corsMiddleware;
