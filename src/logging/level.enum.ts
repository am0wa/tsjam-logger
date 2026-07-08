export enum LogLevel {
  /** No Output (off) */
  Silent = 'silent',
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
}

export namespace LogLevels {
  export const all = <const>[LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error, LogLevel.Silent];

  const severityByLevel = new Map<LogLevel, number>(all.map((level, idx) => [level, idx]));

  /**
   * Returns the severity level – lower ones would be skipped.
   * @see {LogLevel}
   */
  export const severity = (level: LogLevel = LogLevel.Debug): number => {
    return severityByLevel.get(level) ?? -1;
  };
}
