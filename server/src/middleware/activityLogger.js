const activityService = require('../services/activity.service');
const logger = require('../utils/logger');

// Records a user action once the request has finished successfully.
// Usage: router.post('/', authenticate, logActivity(ACTIONS.POST_CREATE), controller)
const logActivity = (action) => (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 400) return; // only log successful actions

    // On login/register there is no req.user yet, so the controller sets res.locals.userId
    const userId = req.user?.id || res.locals.userId;
    if (!userId) return;

    activityService
      .logActivity({ user: userId, action, resourceId: res.locals.resourceId || req.params.id, ip: req.ip })
      .catch((err) => logger.error('Could not save activity log:', err.message));
  });

  next();
};

module.exports = logActivity;
