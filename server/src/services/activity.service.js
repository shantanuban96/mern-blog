const ActivityLog = require('../models/ActivityLog');

function logActivity({ user, action, resourceId, ip }) {
  return ActivityLog.create({ user, action, resourceId, ip });
}

function getRecentActivity(limit = 20) {
  return ActivityLog.find().sort({ createdAt: -1 }).limit(limit).populate('user', 'name email').lean();
}

module.exports = { logActivity, getRecentActivity };
