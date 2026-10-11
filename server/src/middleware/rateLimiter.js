const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

// Limits each IP to `max` requests per window.
// Counts are kept in memory; with several servers, plug in a Redis store.
const createRateLimiter = (max, windowMinutes = 15) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) =>
      next(new ApiError(429, 'Too many requests, please try again later', 'TOO_MANY_REQUESTS')),
  });

// Protects login/register/refresh against brute-force attacks
const authLimiter = createRateLimiter(config.authRateLimitMax);

module.exports = { createRateLimiter, authLimiter };
