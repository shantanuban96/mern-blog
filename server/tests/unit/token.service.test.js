const jwt = require('jsonwebtoken');
const { createAccessToken, verifyAccessToken } = require('../../src/services/token.service');

describe('access tokens', () => {
  const user = { _id: '64b000000000000000000001', role: 'admin' };

  it('contains the user id and role', () => {
    const payload = verifyAccessToken(createAccessToken(user));
    expect(payload).toMatchObject({ sub: user._id, role: 'admin' });
  });

  it('rejects a token signed with another secret', () => {
    const forged = jwt.sign({ sub: user._id, role: 'admin' }, 'wrong-secret');
    expect(() => verifyAccessToken(forged)).toThrow('Invalid or expired access token');
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({ sub: user._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: -10 });
    expect(() => verifyAccessToken(expired)).toThrow('Invalid or expired access token');
  });
});
