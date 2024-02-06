import { logs } from 'logging/log.utils';

const stars = '***';

describe('log utils', () => {
  it("shouldn't replace sensitive data with ***", () => {
    const sensitive = { name: 'bob', password: 'ABC' };
    const sanitized = logs.sanitizeSensitiveData(sensitive);
    expect(sanitized.password).toEqual(stars);
  });
  it('should pass-through primitives', () => {
    const primitive = 'yo';
    const sanitized = logs.sanitizeSensitiveData(primitive);
    expect(sanitized).toEqual(primitive);
  });
  it('should accept arrays', () => {
    const sensitive = [
      { name: 'bob', password: 'ABC' },
      { name: 'bob', password: 'ABC' },
    ];
    const sanitized = logs.sanitizeSensitiveData(sensitive);
    expect(sanitized[0].password).toEqual(stars);
    expect(sanitized[1].password).toEqual(stars);
  });
  it('should go deep', () => {
    const sensitive = { user: { name: 'bob', password: 'ABC' } };
    const sanitized = logs.sanitizeSensitiveData(sensitive, true, ['password']);
    expect(sanitized.user.password).toEqual(stars);
  });
});
