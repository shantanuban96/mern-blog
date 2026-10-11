const { Server } = require('socket.io');
const config = require('./config/env');
const { verifyAccessToken } = require('./services/token.service');

let io = null;

// Each logged-in user joins a private room named after their user id.
// To scale to several servers, add @socket.io/redis-adapter here.
function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: config.clientUrl, credentials: true } });

  // Only clients with a valid access token can connect
  io.use((socket, next) => {
    try {
      const payload = verifyAccessToken(socket.handshake.auth?.token);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(socket.userId);
  });
}

// Sends a notification to one user. Does nothing if sockets aren't running (e.g. in tests).
function notifyUser(userId, notification) {
  if (!io) return;
  io.to(userId.toString()).emit('notification', { ...notification, createdAt: new Date() });
}

module.exports = { initSocket, notifyUser };
