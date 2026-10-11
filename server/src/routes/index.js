const express = require('express');
const { sendSuccess } = require('../utils/apiResponse');
const authRoutes = require('./auth.routes');
const postRoutes = require('./post.routes');
const commentRoutes = require('./comment.routes');
const adminRoutes = require('./admin.routes');

// All v1 routes. A future v2 can be mounted next to it without breaking v1 clients.
const router = express.Router();

router.get('/health', (req, res) => sendSuccess(res, { data: { status: 'ok' } }));
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
