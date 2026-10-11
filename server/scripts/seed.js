/**
 * Creates the first admin account (registration can never create admins).
 *   npm run seed           -> admin only
 *   npm run seed:sample    -> admin + a demo user with a few posts and comments
 */
const mongoose = require('mongoose');
const config = require('../src/config/env');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
const Comment = require('../src/models/Comment');
const { ROLES } = require('../src/constants');

async function seed({ withSampleData = false } = {}) {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin12345';

  let admin = await User.findOne({ email });
  if (!admin) {
    admin = await User.create({ name: 'Admin', email, password, role: ROLES.ADMIN });
    console.log(`Admin created: ${email} / ${password}`);
  } else {
    console.log(`Admin already exists: ${email}`);
  }

  if (!withSampleData || (await Post.exists({}))) return;

  const user = await User.create({ name: 'Demo User', email: 'user@example.com', password: 'User12345' });
  console.log('Demo user created: user@example.com / User12345');

  const posts = await Post.create([
    {
      title: 'Welcome to the MERN Blog',
      slug: 'welcome-to-the-mern-blog',
      content: 'This blog is built with MongoDB, Express, React and Node.js.\n\nLog in to write posts and comments.',
      author: admin._id,
    },
    {
      title: 'How JWT refresh tokens work',
      slug: 'how-jwt-refresh-tokens-work',
      content:
        'The access token is short-lived and sent with every request.\n\nThe refresh token lives in an httpOnly cookie and is used to get a new access token when the old one expires.',
      author: user._id,
    },
    {
      title: 'Why soft delete?',
      slug: 'why-soft-delete',
      content: 'Soft-deleted posts are hidden from readers but can still be restored by an admin.',
      author: user._id,
    },
  ]);

  await Comment.create([
    { post: posts[0]._id, author: user._id, content: 'Great start!' },
    { post: posts[1]._id, author: admin._id, content: 'Nicely explained.' },
  ]);
  console.log('Sample posts and comments created');
}

// Run directly: node scripts/seed.js [--sample]
if (require.main === module) {
  mongoose
    .connect(config.mongoUri)
    .then(() => seed({ withSampleData: process.argv.includes('--sample') }))
    .catch((err) => {
      console.error('Seeding failed:', err.message);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}

module.exports = seed;
