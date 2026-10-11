const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const { createAccessToken } = require('../src/services/token.service');

// ---------- In-memory database ----------
let mongod;

async function connectDB() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Make sure unique and text indexes exist before tests run
  await Promise.all(Object.values(mongoose.models).map((model) => model.createIndexes()));
}

async function clearDB() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

async function closeDB() {
  await mongoose.disconnect();
  await mongod.stop();
}

// ---------- Test data ----------
let counter = 0;

function createUser(overrides = {}) {
  counter += 1;
  return User.create({
    name: `User ${counter}`,
    email: `user${counter}@test.com`,
    password: 'Password123',
    ...overrides,
  });
}

function createPost(author, overrides = {}) {
  counter += 1;
  return Post.create({
    title: `Post ${counter}`,
    slug: `post-${counter}`,
    content: 'Some content for this post',
    author: author._id,
    ...overrides,
  });
}

// Header for an authenticated request as this user
const authHeader = (user) => ({ Authorization: `Bearer ${createAccessToken(user)}` });

// Polls until fn() returns something truthy (for work done after the response, e.g. activity logs)
async function waitFor(fn, timeoutMs = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await fn();
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('waitFor timed out');
}

module.exports = { connectDB, clearDB, closeDB, createUser, createPost, authHeader, waitFor };
