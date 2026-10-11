const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const logActivity = require('../middleware/activityLogger');
const { idParam, paginationQuery } = require('../validators/common');
const { listUsersQuery, updateUserSchema, listPostsQuery, activityQuery } = require('../validators/admin.validator');
const { ROLES, ACTIONS } = require('../constants');

const router = express.Router();

// Every route below requires a logged-in admin
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/stats', adminController.getStats);
router.get('/activity', validate(activityQuery, 'query'), adminController.getActivity);

router.get('/users', validate(listUsersQuery, 'query'), adminController.listUsers);
router.patch(
  '/users/:id',
  validate(idParam, 'params'),
  validate(updateUserSchema),
  logActivity(ACTIONS.USER_UPDATE),
  adminController.updateUser
);

// Admins delete posts/comments with the normal DELETE routes (the ownership check lets admins through)
router.get('/posts', validate(listPostsQuery, 'query'), adminController.listPosts);
router.patch('/posts/:id/restore', validate(idParam, 'params'), logActivity(ACTIONS.POST_RESTORE), adminController.restorePost);

router.get('/comments', validate(paginationQuery, 'query'), adminController.listComments);

module.exports = router;
