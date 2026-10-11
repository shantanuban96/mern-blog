const { Joi, objectId, pagination } = require('./common');

const title = Joi.string().trim().min(3).max(150);
const content = Joi.string().trim().min(10).max(20000);

const listPostsQuery = Joi.object({
  ...pagination,
  search: Joi.string().trim().max(100).allow(''),
  author: objectId,
});

const createPostSchema = Joi.object({
  title: title.required(),
  content: content.required(),
});

// At least one field must be sent
const updatePostSchema = Joi.object({ title, content }).min(1);

module.exports = { listPostsQuery, createPostSchema, updatePostSchema };
