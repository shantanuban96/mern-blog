const request = require('supertest');
const app = require('../../src/app');
const Comment = require('../../src/models/Comment');
const { connectDB, clearDB, closeDB, createUser, createPost, authHeader } = require('../helpers');

beforeAll(connectDB);
afterEach(clearDB);
afterAll(closeDB);

describe('comments', () => {
  let author;
  let post;

  beforeEach(async () => {
    author = await createUser();
    post = await createPost(author);
  });

  const addComment = (user, content = 'Nice post!') =>
    request(app).post(`/api/v1/posts/${post._id}/comments`).set(authHeader(user)).send({ content });

  it('requires login to comment', async () => {
    const res = await request(app).post(`/api/v1/posts/${post._id}/comments`).send({ content: 'Hi' });
    expect(res.status).toBe(401);
  });

  it('creates a comment and lists it with its author', async () => {
    const reader = await createUser({ name: 'Reader' });
    const created = await addComment(reader);
    const list = await request(app).get(`/api/v1/posts/${post._id}/comments`);

    expect(created.status).toBe(201);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({ content: 'Nice post!', author: { name: 'Reader' } });
    expect(list.body.meta.total).toBe(1);
  });

  it('cannot comment on a deleted post', async () => {
    post.isDeleted = true;
    await post.save();
    const res = await addComment(await createUser());
    expect(res.status).toBe(404);
  });

  it('lets only the owner edit a comment', async () => {
    const owner = await createUser();
    const other = await createUser();
    const { body } = await addComment(owner);

    const byOther = await request(app).patch(`/api/v1/comments/${body.data._id}`).set(authHeader(other)).send({ content: 'x' });
    const byOwner = await request(app).patch(`/api/v1/comments/${body.data._id}`).set(authHeader(owner)).send({ content: 'Edited' });

    expect(byOther.status).toBe(403);
    expect(byOwner.status).toBe(200);
    expect(byOwner.body.data.content).toBe('Edited');
  });

  it('lets an admin delete any comment', async () => {
    const admin = await createUser({ role: 'admin' });
    const { body } = await addComment(await createUser());

    const res = await request(app).delete(`/api/v1/comments/${body.data._id}`).set(authHeader(admin));

    expect(res.status).toBe(200);
    expect(await Comment.countDocuments()).toBe(0);
  });
});
