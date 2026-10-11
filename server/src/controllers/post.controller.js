const postService = require('../services/post.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

// Controllers only deal with HTTP (req/res). Business logic lives in the service.

const listPosts = asyncHandler(async (req, res) => {
  const { posts, meta } = await postService.listPosts(req.query);
  sendSuccess(res, { data: posts, meta });
});

const getPost = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await postService.getPost(req.params.idOrSlug) });
});

const createPost = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.body, req.user.id);
  res.locals.resourceId = post._id.toString(); // for the activity logger
  sendSuccess(res, { status: 201, message: 'Post created', data: post });
});

// req.resource was loaded by the checkOwnership middleware
const updatePost = asyncHandler(async (req, res) => {
  const post = await postService.updatePost(req.resource, req.body);
  sendSuccess(res, { message: 'Post updated', data: post });
});

const deletePost = asyncHandler(async (req, res) => {
  await postService.deletePost(req.resource);
  sendSuccess(res, { message: 'Post deleted' });
});

module.exports = { listPosts, getPost, createPost, updatePost, deletePost };
