module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
    '^axios$': 'axios/dist/node/axios.cjs', // use axios's CommonJS build in Jest
  },
};
