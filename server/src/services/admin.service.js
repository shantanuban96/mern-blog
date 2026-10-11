const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const ApiError = require('../utils/ApiError');
const { getPagination, buildMeta } = require('../utils/pagination');
const tokenService = require('./token.service');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function getStats() {
  const [users, posts, comments] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments({ isDeleted: false }),
    Comment.countDocuments(),
  ]);
  return { users, posts, comments };
}

// ---------- Users ----------

async function listUsers(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email role isActive avatar createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return { users, meta: buildMeta({ page, limit }, total) };
}

async function updateUser(adminId, userId, { role, isActive }) {
  // Stops an admin from locking themselves out
  if (adminId === userId) {
    throw ApiError.badRequest('You cannot change your own role or status');
  }

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  await user.save();

  // A deactivated user is logged out everywhere
  if (isActive === false) await tokenService.revokeAllForUser(user._id);

  return user;
}

// ---------- Posts ----------

async function listPosts(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.status === 'active') filter.isDeleted = false;
  if (query.status === 'deleted') filter.isDeleted = true;

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .select('-content')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email')
      .lean(),
    Post.countDocuments(filter),
  ]);

  return { posts, meta: buildMeta({ page, limit }, total) };
}

async function restorePost(id) {
  const post = await Post.findOneAndUpdate(
    { _id: id, isDeleted: true },
    { isDeleted: false, deletedAt: null },
    { new: true }
  );
  if (!post) throw ApiError.notFound('Deleted post not found');
  return post;
}

// ---------- Comments ----------

async function listComments(query) {
  const { page, limit, skip } = getPagination(query);

  const [comments, total] = await Promise.all([
    Comment.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email')
      .populate('post', 'title slug isDeleted')
      .lean(),
    Comment.countDocuments(),
  ]);

  return { comments, meta: buildMeta({ page, limit }, total) };
}

module.exports = { getStats, listUsers, updateUser, listPosts, restorePost, listComments };
