const { Joi } = require('./common');

const email = Joi.string().trim().lowercase().email().required();

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  email,
  password: Joi.string()
    .min(8)
    .max(72)
    .pattern(/(?=.*[A-Za-z])(?=.*\d)/)
    .required()
    .messages({ 'string.pattern.base': 'Password must contain at least one letter and one number' }),
});

const loginSchema = Joi.object({
  email,
  password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };
