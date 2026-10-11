const request = require('supertest');
const app = require('../../src/app');
const Comment = require('../../src/models/Comment');
const RefreshToken = require('../../src/models/RefreshToken');
const { createRefreshToken } = require('../../src/services/token.service');
const { connectDB, clearDB, closeDB, createUser, createPost, authHeader } = require('../helpers');

beforeAll(connectDB);
afterEach(clearDB);
afterAll(closeDB);

describe('admin access control', () => {
  it('returns 401 without a token and 403 for regular users', async () => {
    const user = await createUser();

    expect((await request(app).get('/api/v1/admin/stats')).status).toBe(401);
    expect((await request(app).get('/api/v1/admin/stats').set(authHeader(user))).status).toBe(403);
  });
});

describe('admin features', () => {
  let admin;

  beforeEach(async () => {
    admin = await createUser({ role: 'admin' });
  });

  const asAdmin = (method, url) => request(app)[method](url).set(authHeader(admin));

  it('shows totals for users, posts (not deleted) and comments', async () => {
    const user = await createUser();
    const post = await createPost(user);
    await createPost(user, { isDeleted: true });
    await Comment.create({ post: post._id, author: user._id, content: 'Hi' });

    const res = await asAdmin('get', '/api/v1/admin/stats');

    expect(res.body.data).toEqual({ users: 2, posts: 1, comments: 1 });
  });

  it('lists and searches users', async () => {
    await createUser({ name: 'Alice Smith' });
    const res = await asAdmin('get', '/api/v1/admin/users?search=alice');

    expect(res.body.data.map((u) => u.name)).toEqual(['Alice Smith']);
    expect(res.body.data[0].password).toBeUndefined();
  });

  it('changes a user role', async () => {
    const user = await createUser();
    const res = await asAdmin('patch', `/api/v1/admin/users/${user._id}`).send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('admin');
  });

  it('deactivating a user blocks their API access and logs them out', async () => {
    const user = await createUser();
    await createRefreshToken(user._id);

    await asAdmin('patch', `/api/v1/admin/users/${user._id}`).send({ isActive: false });

    expect(await RefreshToken.countDocuments({ user: user._id })).toBe(0);
    expect((await request(app).get('/api/v1/auth/me').set(authHeader(user))).status).toBe(401);
  });

  it('does not let an admin change their own role', async () => {
    const res = await asAdmin('patch', `/api/v1/admin/users/${admin._id}`).send({ role: 'user' });
    expect(res.status).toBe(400);
  });

  it('lists deleted posts and restores them', async () => {
    const post = await createPost(admin, { isDeleted: true, deletedAt: new Date() });

    const list = await asAdmin('get', '/api/v1/admin/posts?status=deleted');
    const restore = await asAdmin('patch', `/api/v1/admin/posts/${post._id}/restore`);

    expect(list.body.data).toHaveLength(1);
    expect(restore.status).toBe(200);
    expect(restore.body.data.isDeleted).toBe(false);
  });

  it('lists all comments with their post', async () => {
    const post = await createPost(admin, { title: 'A post' });
    await Comment.create({ post: post._id, author: admin._id, content: 'Hi' });

    const res = await asAdmin('get', '/api/v1/admin/comments');

    expect(res.body.data[0].post.title).toBe('A post');
  });

  it('returns recent activity', async () => {
    await request(app).post('/api/v1/posts').set(authHeader(admin)).send({ title: 'Logged post', content: 'Some content here' });
    await new Promise((resolve) => setTimeout(resolve, 100)); // activity is saved after the response

    const res = await asAdmin('get', '/api/v1/admin/activity');

    expect(res.body.data[0]).toMatchObject({ action: 'post.create', user: { name: admin.name } });
  });
});
