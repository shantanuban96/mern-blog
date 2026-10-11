const express = require('express');
const passport = require('passport');
const config = require('../config/env');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const logActivity = require('../middleware/activityLogger');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { ACTIONS } = require('../constants');

const router = express.Router();

// ---------- Email + password ----------
router.post('/register', authLimiter, validate(registerSchema), logActivity(ACTIONS.REGISTER), authController.register);
router.post('/login', authLimiter, validate(loginSchema), logActivity(ACTIONS.LOGIN), authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/logout', logActivity(ACTIONS.LOGOUT), authController.logout);
router.get('/me', authenticate, authController.getMe);
router.get('/providers', authController.getProviders);

// ---------- Social login (OAuth 2.0) ----------
// 1. GET /auth/google          -> redirects the browser to Google
// 2. GET /auth/google/callback -> Google sends the user back here
const loginPageWithError = (error) => `${config.clientUrl}/login?error=${error}`;

// If a provider has no keys in .env, send the user back with a clear message
const requireProvider = (name) => (req, res, next) =>
  config[name].clientID ? next() : res.redirect(loginPageWithError(`${name}_not_configured`));

const socialLogin = (provider, scope) => {
  router.get(`/${provider}`, authLimiter, requireProvider(provider), passport.authenticate(provider, { scope, session: false }));

  router.get(
    `/${provider}/callback`,
    requireProvider(provider),
    passport.authenticate(provider, { session: false, failureRedirect: loginPageWithError('social_login_failed') }),
    logActivity(ACTIONS.LOGIN),
    authController.socialLoginSuccess
  );
};

socialLogin('google', ['profile', 'email']);
socialLogin('facebook', ['email']);

module.exports = router;
