const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const RefreshToken = require('../models/RefreshToken');
const ApiError = require('../utils/ApiError');

// We store only a hash of the refresh token, never the token itself
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// ---------- Access token: short-lived, sent in the Authorization header ----------

function createAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwt.accessSecret);
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
}

// ---------- Refresh token: long-lived, kept in an httpOnly cookie ----------

async function createRefreshToken(userId) {
  const days = config.jwt.refreshExpiresInDays;
  const token = jwt.sign({ sub: userId.toString() }, config.jwt.refreshSecret, {
    expiresIn: `${days}d`,
    jwtid: crypto.randomUUID(), // makes every token unique
  });

  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  });

  return token;
}

// Rotation: the old refresh token is deleted and a new one is issued.
// A stolen token therefore works at most once.
async function rotateRefreshToken(token) {
  try {
    jwt.verify(token, config.jwt.refreshSecret);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const stored = await RefreshToken.findOneAndDelete({ tokenHash: hashToken(token) });
  if (!stored) throw ApiError.unauthorized('Refresh token has been revoked');

  const refreshToken = await createRefreshToken(stored.user);
  return { userId: stored.user, refreshToken };
}

// Returns the user id the token belonged to (or undefined)
async function revokeRefreshToken(token) {
  const stored = await RefreshToken.findOneAndDelete({ tokenHash: hashToken(token) });
  return stored?.user;
}

// Logs the user out of every device
async function revokeAllForUser(userId) {
  await RefreshToken.deleteMany({ user: userId });
}

module.exports = {
  createAccessToken,
  verifyAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
};
