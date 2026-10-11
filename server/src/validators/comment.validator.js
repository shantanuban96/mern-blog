const { Joi, objectId } = require('./common');

const postIdParam = Joi.object({ postId: objectId.required() });

const commentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required(),
});

module.exports = { postIdParam, commentSchema };
