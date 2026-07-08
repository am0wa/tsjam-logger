import { LogMeta } from 'logging/log.meta.js';

describe('log meta', () => {
  it('should be able to create signed metadata', () => {
    const data: { readonly username: string } = { username: 'John' };
    expect(LogMeta.isSigned(data)).toBe(false);

    const meta = LogMeta.bake(data);
    expect(LogMeta.isSigned(meta)).toBe(true);

    console.log(Object.entries(meta));
  });
  it('should bake one-off tags hidden from meta payload', () => {
    const meta = LogMeta.tag('startup', 'cache');
    expect(LogMeta.isSigned(meta)).toBe(true);
    expect(meta.tags).toEqual(['startup', 'cache']);
    expect(Object.keys(meta)).toEqual([]); // not enumerable – stays out of the meta printout
    expect(LogMeta.isEmpty(meta)).toBe(true); // nothing to merge into entry meta

    expect(LogMeta.tag()).toBe(LogMeta.EMPTY);
  });
  it('empty metas have to lead to same ref', () => {
    const empty = LogMeta.EMPTY;
    expect(LogMeta.isEmpty(empty)).toBe(true);

    const overCooked = LogMeta.bake(empty);
    expect(LogMeta.isEmpty(overCooked)).toBe(true);
    expect(overCooked === empty).toBe(true);

    const emptyObject = LogMeta.bake({});
    expect(LogMeta.isEmpty(emptyObject)).toBe(true);
    expect(emptyObject === empty).toBe(true);
  });
});
