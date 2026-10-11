const http = require('http');
const mongoose = require('mongoose');
const config = require('./config/env');
const app = require('./app');
const { initSocket } = require('./socket');
const logger = require('./utils/logger');

async function start() {
  await mongoose.connect(config.mongoUri);
  logger.info('MongoDB connected');

  // Express and Socket.io share the same HTTP server
  const server = http.createServer(app);
  initSocket(server);

  server.listen(config.port, () => logger.info(`API running on ${config.serverUrl}/api/v1`));
}

// Started directly with `node src/server.js`; scripts/dev-memory.js calls start() itself
if (require.main === module) {
  start().catch((err) => {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  });
}

module.exports = { start };
