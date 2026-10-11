const request = require('supertest');
const app = require('../../src/app');
const { connectDB, clearDB, closeDB, createUser, authHeader } = require('../helpers');

beforeAll(connectDB);
afterEach(clearDB);
afterAll(closeDB);

// Returns "refreshToken=..." from the Set-Cookie header
const getRefreshCookie = (res) =>
  (res.headers['set-cookie'] || []).find((c) => c.startsWith('refreshToken='))?.split(';')[0];

describe('POST /api/v1/auth/register', () => {
  it('creates a user, returns an access token and sets an httpOnly refresh cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Jane', email: 'Jane@Example.com', password: 'Password123' });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ name: 'Jane', email: 'jane@example.com', role: 'user' });
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.headers['set-cookie'].join()).toMatch(/refreshToken=.*HttpOnly/);
  });

  it('ignores a role sent by the client', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Hacker', email: 'h@test.com', password: 'Password123', role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('user');
  });

  it('returns field errors for an invalid payload', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'J', email: 'nope', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  it('rejects an email that is already registered', async () => {
    await createUser({ email: 'taken@test.com' });
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Jane', email: 'taken@test.com', password: 'Password123' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await createUser({ email: 'jane@test.com' });
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'jane@test.com', password: 'Password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });

  it('rejects a wrong password', async () => {
    await createUser({ email: 'jane@test.com' });
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'jane@test.com', password: 'Wrong1234' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } });
  });

  it('blocks deactivated users', async () => {
    await createUser({ email: 'jane@test.com', isActive: false });
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'jane@test.com', password: 'Password123' });

    expect(res.status).toBe(403);
  });
});

describe('refresh and logout', () => {
  async function loginAndGetCookie() {
    await createUser({ email: 'jane@test.com' });
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'jane@test.com', password: 'Password123' });
    return getRefreshCookie(res);
  }

  it('issues a new access token and rotates the refresh token', async () => {
    const cookie = await loginAndGetCookie();
    const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(getRefreshCookie(res)).not.toBe(cookie);
  });

  it('does not accept the same refresh token twice', async () => {
    const cookie = await loginAndGetCookie();
    await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);
    const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);

    expect(res.status).toBe(401);
  });

  it('revokes the refresh token on logout', async () => {
    const cookie = await loginAndGetCookie();
    const logout = await request(app).post('/api/v1/auth/logout').set('Cookie', cookie);
    const refresh = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);

    expect(logout.status).toBe(200);
    expect(refresh.status).toBe(401);
  });

  it('returns 401 when there is no refresh cookie', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('requires a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user', async () => {
    const user = await createUser({ name: 'Jane' });
    const res = await request(app).get('/api/v1/auth/me').set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Jane');
  });
});

describe('GET /api/v1/auth/providers', () => {
  it('reports which social logins are configured', async () => {
    const res = await request(app).get('/api/v1/auth/providers');
    expect(res.body.data).toEqual({ google: expect.any(Boolean), facebook: expect.any(Boolean) });
  });
});
