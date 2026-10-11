const config = require('../config/env');
const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');

const REFRESH_COOKIE = 'refreshToken';

const cookieOptions = {
  httpOnly: true, // JavaScript can't read it -> protected from XSS
  secure: config.isProd, // HTTPS only in production
  sameSite: 'lax',
  path: '/api/v1/auth', // the browser only sends it to auth routes
  maxAge: config.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000,
};

// Refresh token goes in the cookie, access token goes in the response body
function sendSession(res, session, status = 200) {
  res.cookie(REFRESH_COOKIE, session.refreshToken, cookieOptions);
  res.locals.userId = session.user._id.toString(); // for the activity logger
  sendSuccess(res, { status, data: { user: session.user, accessToken: session.accessToken } });
}

const register = asyncHandler(async (req, res) => {
  sendSession(res, await authService.register(req.body), 201);
});

const login = asyncHandler(async (req, res) => {
  sendSession(res, await authService.login(req.body));
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized('No refresh token');

  try {
    sendSession(res, await authService.refresh(token));
  } catch (err) {
    res.clearCookie(REFRESH_COOKIE, { path: cookieOptions.path });
    throw err;
  }
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies[REFRESH_COOKIE];
  if (token) {
    const userId = await authService.logout(token);
    if (userId) res.locals.userId = userId.toString();
  }
  res.clearCookie(REFRESH_COOKIE, { path: cookieOptions.path });
  sendSuccess(res, { message: 'Logged out' });
});

const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await authService.getMe(req.user.id) });
});

// Tells the frontend which social login buttons to show
const getProviders = (req, res) => {
  sendSuccess(res, {
    data: { google: Boolean(config.google.clientID), facebook: Boolean(config.facebook.clientID) },
  });
};

// Google/Facebook sent the user back to us and Passport put the user in req.user.
// We set the refresh cookie and send the browser back to the React app,
// which then calls /auth/refresh to get an access token.
const socialLoginSuccess = asyncHandler(async (req, res) => {
  const session = await authService.createSession(req.user);
  res.cookie(REFRESH_COOKIE, session.refreshToken, cookieOptions);
  res.redirect(`${config.clientUrl}/oauth/callback`);
});

module.exports = { register, login, refresh, logout, getMe, getProviders, socialLoginSuccess };
