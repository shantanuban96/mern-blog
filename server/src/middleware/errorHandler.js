const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Any route that doesn't exist
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// Every error in the app ends up here and gets the same JSON shape:
// { success: false, error: { code, message, details? } }
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(err instanceof ApiError)) {
    if (err.name === 'CastError') error = ApiError.badRequest('Invalid id');
    else if (err.code === 11000) error = ApiError.conflict('This value already exists');
    else if (err.type === 'entity.parse.failed') error = ApiError.badRequest('Invalid JSON body');
    else {
      // Unexpected bug: log it, but don't leak internals to the client
      logger.error(err);
      error = new ApiError(500, 'Something went wrong', 'INTERNAL_ERROR');
    }
  }

  res.status(error.statusCode).json({
    success: false,
    error: { code: error.code, message: error.message, details: error.details },
  });
};

module.exports = { notFound, errorHandler };
