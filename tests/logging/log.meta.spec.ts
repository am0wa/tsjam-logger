import { LogMeta } from 'logging';

describe('log meta', () => {
  it('should be able to create signed metadata', () => {
    const data: { readonly username: string } = { username: 'John' };
    expect(LogMeta.isSigned(data)).toBe(false);

    const meta = LogMeta.bake(data);
    expect(LogMeta.isSigned(meta)).toBe(true);

    console.log(Object.entries(meta));
  });
});
