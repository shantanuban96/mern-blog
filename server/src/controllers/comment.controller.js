const commentService = require('../services/comment.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const listComments = asyncHandler(async (req, res) => {
  const { comments, meta } = await commentService.listComments(req.params.postId, req.query);
  sendSuccess(res, { data: comments, meta });
});

const createComment = asyncHandler(async (req, res) => {
  const comment = await commentService.createComment(req.params.postId, req.body.content, req.user);
  res.locals.resourceId = comment._id.toString();
  sendSuccess(res, { status: 201, message: 'Comment added', data: comment });
});

// req.resource was loaded by the checkOwnership middleware
const updateComment = asyncHandler(async (req, res) => {
  const comment = await commentService.updateComment(req.resource, req.body.content);
  sendSuccess(res, { message: 'Comment updated', data: comment });
});

const deleteComment = asyncHandler(async (req, res) => {
  await commentService.deleteComment(req.resource);
  sendSuccess(res, { message: 'Comment deleted' });
});

module.exports = { listComments, createComment, updateComment, deleteComment };
