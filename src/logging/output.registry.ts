import { LogLevel, LogLevels } from './level.enum.js';
import type { LogOutput, LogOutputChannel } from './types.js';

const isSomething = <T>(x: T | undefined | null): x is NonNullable<T> => {
  return x != null;
};

export class LogOutputRegistry {
  private readonly outputs = new Map<LogOutput, LogLevel | undefined>();
  private readonly byLevelCache = new Map<LogLevel, readonly LogOutput[]>();

  constructor(channels: readonly LogOutputChannel[]) {
    channels.forEach(({ out, level }) => this.add(out, level));
  }

  add(channel: LogOutput, level?: LogLevel): LogOutputRegistry {
    this.outputs.set(channel, level);
    this.byLevelCache.clear();
    return this;
  }

  byLogLevel(level: LogLevel): readonly LogOutput[] {
    const cached = this.byLevelCache.get(level);
    if (cached) {
      return cached;
    }
    const outputs = Array.from(
      this.outputs,
      // output everything that is equal or higher by severity
      ([output, outLvl]) => (LogLevels.severity(level) >= LogLevels.severity(outLvl) ? output : undefined),
    ).filter(isSomething);
    this.byLevelCache.set(level, outputs);

    return outputs;
  }

  all(): readonly LogOutput[] {
    return this.byLogLevel(LogLevel.Debug);
  }
}
