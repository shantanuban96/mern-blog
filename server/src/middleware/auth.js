const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../services/token.service');
const { ROLES } = require('../constants');

// 1. authenticate - is the user logged in? Reads "Authorization: Bearer <token>".
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized();

  const payload = verifyAccessToken(token);

  // Load the user from the DB so a role change or deactivation applies immediately
  const user = await User.findById(payload.sub).select('name role isActive').lean();
  if (!user || !user.isActive) throw ApiError.unauthorized('Account is not available');

  req.user = { id: user._id.toString(), name: user.name, role: user.role };
  next();
});

// 2. authorize - does the user have one of the allowed roles?
//    Usage: authorize(ROLES.ADMIN)
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  next();
};

// 3. checkOwnership - is the user the author of this post/comment, or an admin?
//    `findResource` loads the document by id, e.g. postService.findPostById
const checkOwnership = (findResource) =>
  asyncHandler(async (req, res, next) => {
    const resource = await findResource(req.params.id);
    const isOwner = resource.author.toString() === req.user.id;
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) throw ApiError.forbidden('You can only change your own content');

    req.resource = resource; // so the controller doesn't load it again
    next();
  });

module.exports = { authenticate, authorize, checkOwnership };
