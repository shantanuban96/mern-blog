/**
 * Runs the API with an in-memory MongoDB, so you can try the app without installing MongoDB.
 * Data is saved in server/.mongo-data and survives restarts.
 *   npm run dev:memory
 */
const fs = require('fs');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  const dbPath = path.join(__dirname, '..', '.mongo-data');
  fs.mkdirSync(dbPath, { recursive: true });

  const mongod = await MongoMemoryServer.create({ instance: { dbPath, storageEngine: 'wiredTiger', port: 27018 } });
  process.env.MONGODB_URI = mongod.getUri('mern-blog');

  // Use .env values if present, otherwise fall back to dev-only secrets
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  process.env.JWT_ACCESS_SECRET ||= 'dev-only-access-secret-change-me-in-env-file';
  process.env.JWT_REFRESH_SECRET ||= 'dev-only-refresh-secret-change-me-in-env-file';
  console.log(`In-memory MongoDB running at ${process.env.MONGODB_URI}`);

  // Required after MONGODB_URI is set, because config reads it on load
  const { start } = require('../src/server');
  const seed = require('./seed');

  await start();
  await seed({ withSampleData: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
