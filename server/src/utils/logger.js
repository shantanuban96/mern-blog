// Minimal console logger. Swap for winston/pino later without touching callers.
const silent = process.env.NODE_ENV === 'test';

const logger = {
  info: (...args) => !silent && console.log('[INFO]', ...args),
  warn: (...args) => !silent && console.warn('[WARN]', ...args),
  error: (...args) => !silent && console.error('[ERROR]', ...args),
};

module.exports = logger;
