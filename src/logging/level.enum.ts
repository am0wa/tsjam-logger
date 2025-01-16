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
  /**
   * Returns the severity level – lower ones would be skipped.
   * @see {LogLevel}
   */
  export const severity = (level: LogLevel = LogLevel.Debug): number => {
    return all.indexOf(level);
  };
}
