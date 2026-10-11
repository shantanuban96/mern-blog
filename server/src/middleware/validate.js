const ApiError = require('../utils/ApiError');

// Validates req.body (or req.query / req.params) with a Joi schema.
// Unknown fields are removed, so clients can't sneak in e.g. { role: "admin" }.
const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/"/g, ''),
    }));
    return next(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', details));
  }

  req[property] = value;
  next();
};

module.exports = validate;
