import { Logs } from 'logging/log.utils';

const stars = '***';

describe('log utils', () => {
  it("shouldn't replace sensitive data with ***", () => {
    const sensitive = { name: 'bob', password: 'ABC' };
    const sanitized = Logs.sanitize(sensitive);
    expect(sanitized.password).toEqual(stars);
  });
  it('should pass-through primitives', () => {
    const primitive = 'yo';
    const sanitized = Logs.sanitize(primitive);
    expect(sanitized).toEqual(primitive);
  });
  it('should accept arrays', () => {
    const sensitive = [
      { name: 'bob', password: 'ABC' },
      { name: 'bob', password: 'ABC' },
    ];
    const sanitized = Logs.sanitize(sensitive);
    expect(sanitized[0].password).toEqual(stars);
    expect(sanitized[1].password).toEqual(stars);
  });
  it('sanitize should go deep', () => {
    const sensitive = { user: { name: 'bob', password: 'ABC' } };
    const sanitized = Logs.sanitize(sensitive, true, ['password']);
    expect(sanitized.user.password).toEqual(stars);
  });
  it('should stringify error', () => {
    const stringified = Logs.stringifyError(new Error('Oops'), 0);
    expect(stringified).toEqual('Error: Oops');
  });
});
