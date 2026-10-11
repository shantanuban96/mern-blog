const slugify = require('../../src/utils/slugify');
const { getPagination, buildMeta } = require('../../src/utils/pagination');

describe('slugify', () => {
  it.each([
    ['Hello World', 'hello-world'],
    ['  Hello,   World!  ', 'hello-world'],
    ['MERN -- Stack & You', 'mern-stack-you'],
    ['!!!', ''],
  ])('%s -> %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it('limits the length to 80 characters', () => {
    expect(slugify('a'.repeat(200))).toHaveLength(80);
  });
});

describe('pagination', () => {
  it('calculates skip from page and limit', () => {
    expect(getPagination({ page: 3, limit: 10 })).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('uses defaults when nothing is given', () => {
    expect(getPagination({})).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it('builds page meta', () => {
    expect(buildMeta({ page: 1, limit: 10 }, 25)).toEqual({ page: 1, limit: 10, total: 25, totalPages: 3 });
  });
});
