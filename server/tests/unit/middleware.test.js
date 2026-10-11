const express = require('express');
const request = require('supertest');
const Joi = require('joi');
const ApiError = require('../../src/utils/ApiError');
const validate = require('../../src/middleware/validate');
const { authorize, checkOwnership } = require('../../src/middleware/auth');
const { createRateLimiter } = require('../../src/middleware/rateLimiter');
const { errorHandler } = require('../../src/middleware/errorHandler');

// Fake Express response for calling middleware directly
const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('validate', () => {
  const schema = Joi.object({ title: Joi.string().required() });

  it('passes cleaned data on and strips unknown fields', () => {
    const req = { body: { title: 'Hi', role: 'admin' } };
    const next = jest.fn();

    validate(schema)(req, {}, next);

    expect(req.body).toEqual({ title: 'Hi' });
    expect(next).toHaveBeenCalledWith();
  });

  it('returns a 400 ApiError with field details', () => {
    const next = jest.fn();
    validate(schema)({ body: {} }, {}, next);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual([{ field: 'title', message: 'title is required' }]);
  });
});

describe('authorize', () => {
  it('allows a permitted role', () => {
    const next = jest.fn();
    authorize('admin')({ user: { role: 'admin' } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects other roles with 403', () => {
    const next = jest.fn();
    authorize('admin')({ user: { role: 'user' } }, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });
});

describe('checkOwnership', () => {
  const resource = { author: 'owner-id' };
  const findResource = jest.fn().mockResolvedValue(resource);

  const run = async (user) => {
    const req = { params: { id: 'post-id' }, user };
    const next = jest.fn();
    await checkOwnership(findResource)(req, {}, next);
    return { req, next };
  };

  it('allows the owner and attaches the resource', async () => {
    const { req, next } = await run({ id: 'owner-id', role: 'user' });
    expect(next).toHaveBeenCalledWith();
    expect(req.resource).toBe(resource);
  });

  it('allows an admin', async () => {
    const { next } = await run({ id: 'someone-else', role: 'admin' });
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects other users with 403', async () => {
    const { next } = await run({ id: 'someone-else', role: 'user' });
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });
});

describe('errorHandler', () => {
  it('formats an ApiError', () => {
    const res = mockRes();
    errorHandler(ApiError.notFound('Post not found'), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Post not found', details: undefined },
    });
  });

  it('turns a Mongoose CastError into 400', () => {
    const res = mockRes();
    errorHandler({ name: 'CastError' }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('turns a duplicate key error into 409', () => {
    const res = mockRes();
    errorHandler({ code: 11000 }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('hides details of unexpected errors', () => {
    const res = mockRes();
    errorHandler(new Error('database password is xyz'), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error.message).toBe('Something went wrong');
  });
});

describe('rate limiter', () => {
  it('returns 429 after too many requests', async () => {
    const app = express();
    app.get('/', createRateLimiter(2), (req, res) => res.json({ ok: true }));
    app.use(errorHandler);

    await request(app).get('/');
    await request(app).get('/');
    const res = await request(app).get('/');

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});
