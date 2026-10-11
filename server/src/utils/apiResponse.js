// All successful responses share one shape: { success, message?, data, meta? }
function sendSuccess(res, { status = 200, data = null, message, meta } = {}) {
  return res.status(status).json({ success: true, message, data, meta });
}

module.exports = { sendSuccess };
