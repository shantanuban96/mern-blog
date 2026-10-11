const adminService = require('../services/admin.service');
const activityService = require('../services/activity.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const getStats = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await adminService.getStats() });
});

const getActivity = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await activityService.getRecentActivity(req.query.limit) });
});

const listUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await adminService.listUsers(req.query);
  sendSuccess(res, { data: users, meta });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUser(req.user.id, req.params.id, req.body);
  sendSuccess(res, { message: 'User updated', data: user });
});

const listPosts = asyncHandler(async (req, res) => {
  const { posts, meta } = await adminService.listPosts(req.query);
  sendSuccess(res, { data: posts, meta });
});

const restorePost = asyncHandler(async (req, res) => {
  const post = await adminService.restorePost(req.params.id);
  sendSuccess(res, { message: 'Post restored', data: post });
});

const listComments = asyncHandler(async (req, res) => {
  const { comments, meta } = await adminService.listComments(req.query);
  sendSuccess(res, { data: comments, meta });
});

module.exports = { getStats, getActivity, listUsers, updateUser, listPosts, restorePost, listComments };
