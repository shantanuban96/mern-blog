const { Joi, pagination } = require('./common');
const { ROLES } = require('../constants');

const listUsersQuery = Joi.object({
  ...pagination,
  search: Joi.string().trim().max(100).allow(''),
});

const updateUserSchema = Joi.object({
  role: Joi.string().valid(...Object.values(ROLES)),
  isActive: Joi.boolean(),
}).min(1);

const listPostsQuery = Joi.object({
  ...pagination,
  status: Joi.string().valid('all', 'active', 'deleted').default('all'),
});

const activityQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { listUsersQuery, updateUserSchema, listPostsQuery, activityQuery };
