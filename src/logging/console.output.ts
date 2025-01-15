import { LogLevel } from './level.enum';
import { Logs } from './log.utils';
import { LogEntry, LogOutput } from './types';

export class ConsoleOutput implements LogOutput {
  static formatMessage({ date, appId, level, context, message, stack }: LogEntry): string {
    return `${Logs.stringNode(appId)}${Logs.stringNode(date.toISOString())}${Logs.stringNode(level)}${Logs.contextLine(context)} ${message} ${stack ?? ''}`;
  }

  private readonly logMethods = {
    [LogLevel.Debug]: console.debug.bind(console),
    [LogLevel.Info]: console.info.bind(console),
    [LogLevel.Warn]: console.warn.bind(console),
    [LogLevel.Error]: console.error.bind(console),
    [LogLevel.Silent]: () => {},
  };

  write(entry: LogEntry): void {
    const restData = entry.data ?? [];
    this.logMethods[entry.level](ConsoleOutput.formatMessage(entry), ...restData);
  }
}
