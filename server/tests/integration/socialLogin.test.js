const User = require('../../src/models/User');
const { findOrCreateSocialUser } = require('../../src/services/auth.service');
const { connectDB, clearDB, closeDB, createUser } = require('../helpers');

beforeAll(connectDB);
afterEach(clearDB);
afterAll(closeDB);

describe('findOrCreateSocialUser', () => {
  const googleProfile = { provider: 'google', providerId: 'g-123', name: 'Jane', email: 'jane@gmail.com' };

  it('creates a new user on first login', async () => {
    const user = await findOrCreateSocialUser(googleProfile);

    expect(user).toMatchObject({ name: 'Jane', email: 'jane@gmail.com', googleId: 'g-123', role: 'user' });
  });

  it('returns the same user on the next login', async () => {
    const first = await findOrCreateSocialUser(googleProfile);
    const second = await findOrCreateSocialUser(googleProfile);

    expect(second._id).toEqual(first._id);
    expect(await User.countDocuments()).toBe(1);
  });

  it('links to an existing account with the same email', async () => {
    const existing = await createUser({ email: 'jane@gmail.com' });
    const user = await findOrCreateSocialUser(googleProfile);

    expect(user._id).toEqual(existing._id);
    expect(user.googleId).toBe('g-123');
  });

  it('works without an email (Facebook may not share one)', async () => {
    const user = await findOrCreateSocialUser({ provider: 'facebook', providerId: 'fb-1', name: 'No Email' });
    expect(user.facebookId).toBe('fb-1');
  });

  it('rejects deactivated accounts', async () => {
    await createUser({ email: 'jane@gmail.com', isActive: false });
    await expect(findOrCreateSocialUser(googleProfile)).rejects.toThrow('deactivated');
  });
});
