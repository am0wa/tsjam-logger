import { JamLogger, type LogEntry, LogLevel, type LogOutput } from 'logging/index.js';
import { LogOutputRegistry } from 'logging/output.registry.js';

describe('output registry', () => {
  it('should change named channel level at runtime', () => {
    const written: LogEntry[] = [];
    const testOut: LogOutput = { write: (entry) => written.push(entry) };
    const logger = JamLogger.create({ channels: [{ out: testOut, level: LogLevel.Warn, name: 'sink' }] });

    logger.debug('dropped');
    expect(written).toEqual([]);
    expect(logger.channels.getLevel('sink')).toBe(LogLevel.Warn);

    logger.channels.setLevel('sink', LogLevel.Debug); // bump verbosity at runtime
    logger.debug('now audible');
    expect(written.length).toBe(1);
    expect(logger.channels.getLevel('sink')).toBe(LogLevel.Debug);

    logger.channels.setLevel('sink', LogLevel.Silent); // and off again
    logger.error('dropped');
    expect(written.length).toBe(1);
  });
  it('setLevel is a no-op for unknown names', () => {
    const written: LogEntry[] = [];
    const testOut: LogOutput = { write: (entry) => written.push(entry) };
    const logger = JamLogger.create({ channels: [{ out: testOut, name: 'sink' }] });

    logger.channels.setLevel('stranger', LogLevel.Silent);
    expect(logger.channels.getLevel('stranger')).toBeUndefined();
    logger.debug('still audible');
    expect(written.length).toBe(1);
  });
  it('unnamed channels keep their level – add() is the by-reference upsert', () => {
    const out: LogOutput = { write: () => {} };
    const registry = new LogOutputRegistry([{ out, level: LogLevel.Error }]);

    expect(registry.byLogLevel(LogLevel.Debug)).toEqual([]);
    registry.add(out, LogLevel.Debug); // same output, new level – not a second channel
    expect(registry.byLogLevel(LogLevel.Debug)).toEqual([out]);
    expect(registry.all().length).toBe(1);
  });
  it('duplicate name – last registration wins', () => {
    const first: LogOutput = { write: () => {} };
    const second: LogOutput = { write: () => {} };
    const registry = new LogOutputRegistry([
      { out: first, name: 'main' },
      { out: second, level: LogLevel.Error, name: 'main' },
    ]);

    expect(registry.getLevel('main')).toBe(LogLevel.Error);
    registry.setLevel('main', LogLevel.Silent);
    expect(registry.byLogLevel(LogLevel.Debug)).toEqual([first]); // second silenced, first untouched (accepts all)
    expect(registry.names()).toEqual(['main']); // one name, two channels
  });
  it('setLevel with no level resets to accept-all', () => {
    const out: LogOutput = { write: () => {} };
    const registry = new LogOutputRegistry([{ out, level: LogLevel.Error, name: 'sink' }]);

    expect(registry.byLogLevel(LogLevel.Debug)).toEqual([]);
    registry.setLevel('sink');
    expect(registry.byLogLevel(LogLevel.Debug)).toEqual([out]);
    expect(registry.getLevel('sink')).toBeUndefined();
  });
  it('names() exposes runtime-addressable channel names', () => {
    const out: LogOutput = { write: () => {} };
    const anonymous: LogOutput = { write: () => {} };
    const registry = new LogOutputRegistry([{ out, level: LogLevel.Warn, name: 'sink' }, { out: anonymous }]);

    expect(registry.names()).toEqual(['sink']); // anonymous channels are not addressable
  });
});
