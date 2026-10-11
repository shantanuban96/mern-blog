const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Fail fast if a required secret is missing
const required = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const env = process.env;

module.exports = {
  env: env.NODE_ENV || 'development',
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  port: Number(env.PORT) || 5000,
  serverUrl: env.SERVER_URL || 'http://localhost:5000',
  clientUrl: env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: env.MONGODB_URI,

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresInDays: Number(env.JWT_REFRESH_EXPIRES_IN_DAYS) || 7,
  },

  bcryptSaltRounds: Number(env.BCRYPT_SALT_ROUNDS) || 12,
  authRateLimitMax: Number(env.AUTH_RATE_LIMIT_MAX) || 20,

  google: {
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },
  facebook: {
    clientID: env.FACEBOOK_APP_ID,
    clientSecret: env.FACEBOOK_APP_SECRET,
  },
};
