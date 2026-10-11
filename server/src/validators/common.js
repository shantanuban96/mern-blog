const Joi = require('joi');

const objectId = Joi.string().hex().length(24).messages({ 'string.hex': 'Invalid id', 'string.length': 'Invalid id' });

// ?page=1&limit=10 (max 50 per page)
const pagination = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
};

const idParam = Joi.object({ id: objectId.required() });
const paginationQuery = Joi.object(pagination);

module.exports = { Joi, objectId, pagination, idParam, paginationQuery };
