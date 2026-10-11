// Runs before every test file
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1/unused'; // tests use an in-memory DB instead
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.BCRYPT_SALT_ROUNDS = '4'; // fast hashing in tests
process.env.AUTH_RATE_LIMIT_MAX = '1000';
