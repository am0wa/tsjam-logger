import { LogLevel } from './level.enum.js';
import { LogMeta } from './log.meta.js';
import { Logs } from './log.utils.js';
import type { LogEntry, LogOutput } from './types.js';

export class ConsoleOutput implements LogOutput {
  static formatMessage({ date, appId, level, tags, message, stack }: LogEntry): string {
    return `${Logs.stringNode(appId)}${Logs.stringNode(date.toISOString())}${Logs.stringNode(level)}${Logs.tagsLine(tags)} ${message} ${stack ?? ''}`;
  }

  showMeta = true;

  protected readonly logMethods = {
    [LogLevel.Debug]: console.debug.bind(console),
    [LogLevel.Info]: console.info.bind(console),
    [LogLevel.Warn]: console.warn.bind(console),
    [LogLevel.Error]: console.error.bind(console),
  };

  write(entry: LogEntry): void {
    if (entry.level === LogLevel.Silent) {
      return; // silent mode
    }
    const restData = entry.data ?? [];
    const meta = !this.showMeta || LogMeta.isEmpty(entry.meta) ? '' : `\nmeta: ${Logs.stringify(entry.meta)}`;
    this.logMethods[entry.level](ConsoleOutput.formatMessage(entry), ...restData, meta);
  }
}
