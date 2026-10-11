const request = require('supertest');
const app = require('../../src/app');
const Post = require('../../src/models/Post');
const ActivityLog = require('../../src/models/ActivityLog');
const { connectDB, clearDB, closeDB, createUser, createPost, authHeader, waitFor } = require('../helpers');

beforeAll(connectDB);
afterEach(clearDB);
afterAll(closeDB);

describe('GET /api/v1/posts', () => {
  it('returns a paginated list without the full content', async () => {
    const author = await createUser();
    for (let i = 0; i < 12; i += 1) await createPost(author);

    const res = await request(app).get('/api/v1/posts?page=2&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.meta).toEqual({ page: 2, limit: 5, total: 12, totalPages: 3 });
    expect(res.body.data[0].content).toBeUndefined();
    expect(res.body.data[0].author.name).toBeDefined();
  });

  it('hides soft-deleted posts', async () => {
    const author = await createUser();
    await createPost(author);
    await createPost(author, { isDeleted: true });

    const res = await request(app).get('/api/v1/posts');
    expect(res.body.meta.total).toBe(1);
  });

  it('filters by search text and by author', async () => {
    const alice = await createUser();
    const bob = await createUser();
    await createPost(alice, { title: 'Learning MongoDB indexes' });
    await createPost(bob, { title: 'React hooks guide' });

    const search = await request(app).get('/api/v1/posts?search=mongodb');
    const byAuthor = await request(app).get(`/api/v1/posts?author=${bob._id}`);

    expect(search.body.data.map((p) => p.title)).toEqual(['Learning MongoDB indexes']);
    expect(byAuthor.body.data.map((p) => p.title)).toEqual(['React hooks guide']);
  });
});

describe('GET /api/v1/posts/:idOrSlug', () => {
  it('finds a post by slug or by id', async () => {
    const post = await createPost(await createUser(), { slug: 'hello-world' });

    const bySlug = await request(app).get('/api/v1/posts/hello-world');
    const byId = await request(app).get(`/api/v1/posts/${post._id}`);

    expect(bySlug.status).toBe(200);
    expect(byId.body.data.slug).toBe('hello-world');
  });

  it('returns 404 for a deleted post', async () => {
    await createPost(await createUser(), { slug: 'gone', isDeleted: true });
    const res = await request(app).get('/api/v1/posts/gone');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/posts', () => {
  it('requires login', async () => {
    const res = await request(app).post('/api/v1/posts').send({ title: 'Hello', content: 'Some content here' });
    expect(res.status).toBe(401);
  });

  it('creates a post with a slug and logs the activity', async () => {
    const user = await createUser();
    const res = await request(app)
      .post('/api/v1/posts')
      .set(authHeader(user))
      .send({ title: 'My First Post!', content: 'Some content here' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ title: 'My First Post!', slug: 'my-first-post' });
    expect(res.body.data.author.name).toBe(user.name);

    const log = await waitFor(() => ActivityLog.findOne({ action: 'post.create' }));
    expect(log.user.toString()).toBe(user._id.toString());
  });

  it('gives posts with the same title different slugs', async () => {
    const user = await createUser();
    const send = () =>
      request(app).post('/api/v1/posts').set(authHeader(user)).send({ title: 'Same title', content: 'Some content here' });

    const first = await send();
    const second = await send();

    expect(first.body.data.slug).toBe('same-title');
    expect(second.body.data.slug).toMatch(/^same-title-/);
  });

  it('validates the payload', async () => {
    const res = await request(app).post('/api/v1/posts').set(authHeader(await createUser())).send({ title: 'Hi' });

    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field)).toEqual(['title', 'content']);
  });
});

describe('PATCH and DELETE /api/v1/posts/:id', () => {
  let owner;
  let post;

  beforeEach(async () => {
    owner = await createUser();
    post = await createPost(owner, { slug: 'original-slug' });
  });

  it('lets the owner edit and keeps the slug', async () => {
    const res = await request(app).patch(`/api/v1/posts/${post._id}`).set(authHeader(owner)).send({ title: 'New title' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ title: 'New title', slug: 'original-slug' });
  });

  it('forbids other users from editing or deleting', async () => {
    const other = await createUser();

    const edit = await request(app).patch(`/api/v1/posts/${post._id}`).set(authHeader(other)).send({ title: 'Hacked' });
    const remove = await request(app).delete(`/api/v1/posts/${post._id}`).set(authHeader(other));

    expect(edit.status).toBe(403);
    expect(remove.status).toBe(403);
  });

  it('lets an admin edit any post', async () => {
    const admin = await createUser({ role: 'admin' });
    const res = await request(app).patch(`/api/v1/posts/${post._id}`).set(authHeader(admin)).send({ title: 'Fixed by admin' });

    expect(res.status).toBe(200);
  });

  it('soft deletes: the post stays in the database but is hidden', async () => {
    const res = await request(app).delete(`/api/v1/posts/${post._id}`).set(authHeader(owner));

    expect(res.status).toBe(200);
    const inDb = await Post.findById(post._id);
    expect(inDb.isDeleted).toBe(true);
    expect(inDb.deletedAt).toBeInstanceOf(Date);
    expect((await request(app).get('/api/v1/posts/original-slug')).status).toBe(404);
  });

  it('returns 400 for an invalid id', async () => {
    const res = await request(app).delete('/api/v1/posts/not-an-id').set(authHeader(owner));
    expect(res.status).toBe(400);
  });
});
