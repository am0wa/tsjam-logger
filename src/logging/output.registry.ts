import { LogLevel, LogLevels } from './level.enum.js';
import type { LogOutput, LogOutputChannel } from './types.js';

const isSomething = <T>(x: T | undefined | null): x is NonNullable<T> => {
  return x != null;
};

export class LogOutputRegistry {
  private readonly outputs = new Map<LogOutput, LogLevel | undefined>();
  private readonly byName = new Map<string, LogOutput>();
  private readonly byLevelCache = new Map<LogLevel, readonly LogOutput[]>();

  constructor(channels: readonly LogOutputChannel[]) {
    channels.forEach(({ out, level, name }) => this.add(out, level, name));
  }

  add(channel: LogOutput, level?: LogLevel, name?: string): LogOutputRegistry {
    this.outputs.set(channel, level);
    if (name) {
      this.byName.set(name, channel); // duplicate name – last registration wins
    }
    this.byLevelCache.clear();
    return this;
  }

  /**
   * Changes the LogLevel of a named output channel at runtime,
   * e.g. bump console to Debug mid-incident without redeploying.
   * Contract: runtime-addressable ⇔ named. Unnamed channels keep their level
   * (holding the output reference? `add(out, level)` is the by-reference upsert).
   * Note: no-op for unknown names.
   */
  setLevel(name: string, level?: LogLevel): LogOutputRegistry {
    const output = this.byName.get(name);
    if (!output) {
      return this;
    }
    this.outputs.set(output, level); // name mappings stay intact
    this.byLevelCache.clear();
    return this;
  }

  /** @return LogLevel of the named output channel; `undefined` – unknown name or no explicit level (accepts all levels) */
  getLevel(name: string): LogLevel | undefined {
    const output = this.byName.get(name);
    return output ? this.outputs.get(output) : undefined;
  }

  /** @return names of runtime-addressable channels – handy for runtime introspection */
  names(): readonly string[] {
    return [...this.byName.keys()];
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
