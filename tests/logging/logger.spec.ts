import { JamLogger, jamLogger, LogEntry, LogMeta, LogOutput } from 'logging';

describe('logger', () => {
  xit('should use cache if same child logger exists', () => {
    const first = jamLogger.tagged('A');
    const second = jamLogger.tagged('B');
    const third = jamLogger.tagged('A');

    expect(first === second).toBe(false);
    expect(first === third).toBe(true);
  });
  it('check weak instance per config', () => {
    const config = { appId: 'test-app' };
    const first = JamLogger.create(config);
    const second = JamLogger.create(config);
    expect(first === second).toBe(true);
  });
  it('should reuse tags of parent', () => {
    const first = JamLogger.create({ tags: ['root'] });
    // first.debug('First Hi');

    const second = first.tagged('child');
    expect(second.tags).toEqual(['root', 'child'].sort());
    //second.debug('Second Hi');

    const third = second.tagged('grandchild');
    expect(third.tags).toEqual(['root', 'child', 'grandchild'].sort());
    // third.debug('Third Hi');
  });
  it('meta should be extendable per log call & passed anywhere', () => {
    let actual: LogEntry | undefined;
    const testOut: LogOutput = { write: (entry) => (actual = entry) };
    const logger = JamLogger.create({
      channels: [{ out: testOut }],
      tags: ['ai'],
      metadata: { username: 'John' },
    });
    logger.debug('First Hi');
    expect(actual?.meta?.username).toBe('John');
    expect(actual?.message).toBe('First Hi');

    logger.debug('Second Hi', LogMeta.bake({ username: 'Bob' }));
    expect(actual?.meta?.username).toBe('Bob');
    expect(actual?.message).toBe('Second Hi');

    logger.debug('Hi All', { payload: 'Coffee' }, LogMeta.bake({ teammate: 'Smith' }), { payload: 'Beer' });
    expect(actual?.meta?.username).toBe('John');
    expect(actual?.meta?.teammate).toBe('Smith');
    expect(actual?.message).toBe('Hi All');
    expect(actual?.data).toEqual([{ payload: 'Coffee' }, { payload: 'Beer' }]);
    expect(actual?.tags).toEqual(['ai']);
  });
});
