const express = require('express');
const commentController = require('../controllers/comment.controller');
const commentService = require('../services/comment.service');
const { authenticate, checkOwnership } = require('../middleware/auth');
const validate = require('../middleware/validate');
const logActivity = require('../middleware/activityLogger');
const { idParam } = require('../validators/common');
const { commentSchema } = require('../validators/comment.validator');
const { ACTIONS } = require('../constants');

const router = express.Router();

// Listing and creating comments live under /posts/:postId/comments (see post.routes.js)

// Only the author or an admin may edit/delete a comment
const onlyOwnerOrAdmin = checkOwnership(commentService.findCommentById);

router.patch(
  '/:id',
  authenticate,
  validate(idParam, 'params'),
  validate(commentSchema),
  onlyOwnerOrAdmin,
  logActivity(ACTIONS.COMMENT_UPDATE),
  commentController.updateComment
);
router.delete(
  '/:id',
  authenticate,
  validate(idParam, 'params'),
  onlyOwnerOrAdmin,
  logActivity(ACTIONS.COMMENT_DELETE),
  commentController.deleteComment
);

module.exports = router;
