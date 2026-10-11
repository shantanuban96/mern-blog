const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

// Names used in the activity log
const ACTIONS = {
  REGISTER: 'register',
  LOGIN: 'login',
  LOGOUT: 'logout',
  POST_CREATE: 'post.create',
  POST_UPDATE: 'post.update',
  POST_DELETE: 'post.delete',
  POST_RESTORE: 'post.restore',
  COMMENT_CREATE: 'comment.create',
  COMMENT_UPDATE: 'comment.update',
  COMMENT_DELETE: 'comment.delete',
  USER_UPDATE: 'user.update',
};

module.exports = { ROLES, ACTIONS };
