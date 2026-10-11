const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const tokenService = require('./token.service');

// The user fields the frontend needs
const toAuthUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
});

// A "session" = user info + access token + refresh token
async function createSession(user) {
  return {
    user: toAuthUser(user),
    accessToken: tokenService.createAccessToken(user),
    refreshToken: await tokenService.createRefreshToken(user._id),
  };
}

async function register({ name, email, password }) {
  if (await User.exists({ email })) {
    throw ApiError.conflict('Email is already registered');
  }
  // role is never taken from the request, so everyone signs up as a regular user
  const user = await User.create({ name, email, password });
  return createSession(user);
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated');
  }
  return createSession(user);
}

async function refresh(refreshToken) {
  const { userId, refreshToken: newRefreshToken } = await tokenService.rotateRefreshToken(refreshToken);

  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    await tokenService.revokeAllForUser(userId);
    throw ApiError.unauthorized('Account is not available');
  }

  return {
    user: toAuthUser(user),
    accessToken: tokenService.createAccessToken(user),
    refreshToken: newRefreshToken,
  };
}

function logout(refreshToken) {
  return tokenService.revokeRefreshToken(refreshToken);
}

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return toAuthUser(user);
}

// Used by Google and Facebook login (see config/passport.js)
async function findOrCreateSocialUser({ provider, providerId, name, email, avatar }) {
  const idField = `${provider}Id`; // "googleId" or "facebookId"

  // 1. User has logged in with this provider before
  let user = await User.findOne({ [idField]: providerId });

  // 2. User registered with the same email -> link the accounts.
  //    Safe because Google and Facebook only return verified emails.
  if (!user && email) {
    user = await User.findOne({ email });
    if (user) user[idField] = providerId;
  }

  // 3. First time we see this person
  if (!user) {
    user = new User({ name, email, avatar, [idField]: providerId });
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated');
  }

  await user.save();
  return user;
}

module.exports = { createSession, register, login, refresh, logout, getMe, findOrCreateSocialUser };
