import { LogLevel } from './level.enum';
import { logs } from './log.utils';
import { LogEntry, LogOutput } from './types';

export class ConsoleOutput implements LogOutput {
  static formatMessage({ date, appId, level, context, message, stack }: LogEntry): string {
    return `${logs.stringNode(appId)}${logs.stringNode(date.toISOString())}${logs.stringNode(level)}${logs.contextLine(context)} ${message} ${stack ?? ''}`;
  }

  private readonly logMethods = {
    [LogLevel.Debug]: console.debug.bind(console),
    [LogLevel.Info]: console.info.bind(console),
    [LogLevel.Warn]: console.warn.bind(console),
    [LogLevel.Error]: console.error.bind(console),
  };

  write(entry: LogEntry): void {
    const restData = entry.data ?? [];
    this.logMethods[entry.level](ConsoleOutput.formatMessage(entry), ...restData);
  }
}
