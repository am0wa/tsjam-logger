export enum LogLevel {
  /** No Output (off) */
  Silent = 'silent',
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
}

export namespace LogLevels {
  export const all = [LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error, LogLevel.Silent];
  export const severity = (level: LogLevel = LogLevel.Debug): number => {
    return all.indexOf(level);
  };
}
