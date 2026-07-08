import {
  JamLogger,
  jamLogger,
  type LogEntry,
  LogLevel,
  LogMeta,
  type LogOutput,
  type LogMessage,
} from 'logging/index.js';

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
  it('trim stack', () => {
    let actual: LogEntry | undefined;
    const testOut: LogOutput = { write: (entry) => (actual = entry) };
    const logger = JamLogger.create({ channels: [{ out: testOut }], trimStack: 1 });

    logger.warn('Oops!', new Error('Spoiled the milk!'));
    expect(actual?.data).toEqual(['Error: Spoiled the milk!']);
  });
  it('should return same logger when tags bring nothing new', () => {
    const root = JamLogger.create({ tags: ['root'] });
    expect(root.tagged()).toBe(root);
    expect(root.tagged('root')).toBe(root);

    const child = root.tagged('user');
    expect(child).not.toBe(root);
    expect(child.tagged('user')).toBe(child);
    expect(child.tagged('root', 'user')).toBe(child);
    expect(child.tagged('extra')).not.toBe(child);
    expect(child.tagged('extra').tags).toEqual(['extra', 'root', 'user']);
  });
  describe('mute/unmute by tag', () => {
    afterEach(() => JamLogger.unmute()); // static state – always restore

    it('should mute entries by tag and unmute back', () => {
      const written: LogEntry[] = [];
      const testOut: LogOutput = { write: (entry) => written.push(entry) };
      const logger = JamLogger.create({ channels: [{ out: testOut }] });
      const noisy = logger.tagged('noisy');

      JamLogger.mute('noisy');
      expect([...JamLogger.mutedTags]).toEqual(['noisy']);

      noisy.info('dropped');
      logger.info('dropped too', LogMeta.tag('noisy')); // per-call tag is muted as well
      expect(written).toEqual([]);

      logger.info('untagged passes');
      logger.tagged('other').info('other tag passes');
      expect(written.length).toBe(2);

      JamLogger.unmute('noisy');
      noisy.info('audible again');
      expect(written.length).toBe(3);
    });
    it('mute is global across logger instances', () => {
      const writtenA: LogEntry[] = [];
      const writtenB: LogEntry[] = [];
      const loggerA = JamLogger.create({ channels: [{ out: { write: (e) => writtenA.push(e) } }], tags: ['noisy'] });
      const loggerB = JamLogger.create({ channels: [{ out: { write: (e) => writtenB.push(e) } }], tags: ['noisy'] });

      JamLogger.mute('noisy');
      loggerA.info('dropped');
      loggerB.info('dropped');
      expect(writtenA).toEqual([]);
      expect(writtenB).toEqual([]);
    });
    it('unmute with no args clears all muted tags', () => {
      JamLogger.mute('a', 'b', 'c');
      expect(JamLogger.mutedTags.size).toBe(3);

      JamLogger.unmute();
      expect(JamLogger.mutedTags.size).toBe(0);
    });
    it('muted entries skip processing entirely', () => {
      const written: LogEntry[] = [];
      const translator = { map: jest.fn((logMessage: LogMessage) => logMessage) };
      const logger = JamLogger.create({ channels: [{ out: { write: (e) => written.push(e) } }], translator });

      JamLogger.mute('heavy');
      logger.tagged('heavy').info('dropped', { big: 'payload' });
      expect(written).toEqual([]);
      expect(translator.map).not.toHaveBeenCalled();
    });
  });
  it('should apply one-off tags per call without polluting meta', () => {
    let actual: LogEntry | undefined;
    const testOut: LogOutput = { write: (entry) => (actual = entry) };
    const logger = JamLogger.create({ channels: [{ out: testOut }], tags: ['app'] });

    logger.info('cache rebuilt', LogMeta.tag('startup'));
    expect(actual?.tags).toEqual(['app', 'startup']);
    expect(actual?.data).toEqual([]); // tag meta is not payload
    expect(LogMeta.isEmpty(actual?.meta ?? LogMeta.EMPTY)).toBe(true); // nothing leaks into meta

    logger.info('next entry');
    expect(actual?.tags).toEqual(['app']); // one-off tag applied to a single entry only
  });
  it('should not duplicate payload args when no meta is passed', () => {
    let actual: LogEntry | undefined;
    const testOut: LogOutput = { write: (entry) => (actual = entry) };
    const logger = JamLogger.create({ channels: [{ out: testOut }] });

    logger.debug('Hi', { payload: 'Coffee' }, { payload: 'Beer' });
    expect(actual?.message).toBe('Hi');
    expect(actual?.data).toEqual([{ payload: 'Coffee' }, { payload: 'Beer' }]);
  });
  it('should skip all processing when no channel accepts the level', () => {
    const written: LogEntry[] = [];
    const testOut: LogOutput = { write: (entry) => written.push(entry) };
    const translator = { map: jest.fn((logMessage: LogMessage) => logMessage) };
    const logger = JamLogger.create({
      channels: [{ out: testOut, level: LogLevel.Warn }],
      translator,
    });

    logger.debug('Nobody is listening');
    logger.info('Nobody is listening');
    expect(written).toEqual([]);
    expect(translator.map).not.toHaveBeenCalled();

    logger.warn('Somebody is listening');
    expect(written.length).toBe(1);
    expect(translator.map).toHaveBeenCalledTimes(1);
  });
});
