import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    timeout: parseInt(process.env.DEEPSEEK_TIMEOUT || '90000', 10), // 90 seconds
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED === 'true',
  },

  session: {
    ttl: parseInt(process.env.SESSION_TTL || '3600', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
} as const;

// Validation
if (!config.deepseek.apiKey) {
  throw new Error('DEEPSEEK_API_KEY is required');
}
