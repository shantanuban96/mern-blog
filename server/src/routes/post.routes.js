const express = require('express');
const postController = require('../controllers/post.controller');
const commentController = require('../controllers/comment.controller');
const postService = require('../services/post.service');
const { authenticate, checkOwnership } = require('../middleware/auth');
const validate = require('../middleware/validate');
const logActivity = require('../middleware/activityLogger');
const { idParam, paginationQuery } = require('../validators/common');
const { listPostsQuery, createPostSchema, updatePostSchema } = require('../validators/post.validator');
const { postIdParam, commentSchema } = require('../validators/comment.validator');
const { ACTIONS } = require('../constants');

const router = express.Router();

// Only the author or an admin may edit/delete a post
const onlyOwnerOrAdmin = checkOwnership(postService.findPostById);

// ---------- Posts ----------
router.get('/', validate(listPostsQuery, 'query'), postController.listPosts);
router.get('/:idOrSlug', postController.getPost);
router.post('/', authenticate, validate(createPostSchema), logActivity(ACTIONS.POST_CREATE), postController.createPost);
router.patch(
  '/:id',
  authenticate,
  validate(idParam, 'params'),
  validate(updatePostSchema),
  onlyOwnerOrAdmin,
  logActivity(ACTIONS.POST_UPDATE),
  postController.updatePost
);
router.delete(
  '/:id',
  authenticate,
  validate(idParam, 'params'),
  onlyOwnerOrAdmin,
  logActivity(ACTIONS.POST_DELETE),
  postController.deletePost
);

// ---------- Comments of a post ----------
router.get(
  '/:postId/comments',
  validate(postIdParam, 'params'),
  validate(paginationQuery, 'query'),
  commentController.listComments
);
router.post(
  '/:postId/comments',
  authenticate,
  validate(postIdParam, 'params'),
  validate(commentSchema),
  logActivity(ACTIONS.COMMENT_CREATE),
  commentController.createComment
);

module.exports = router;
