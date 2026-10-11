module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  testTimeout: 60000,
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/socket.js', '!src/config/passport.js'],
};
