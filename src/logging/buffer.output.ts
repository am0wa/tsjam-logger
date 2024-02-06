import { ConsoleOutput } from './console.output';
import { LogEntry, LogOutput } from './types';

export class BufferOutput implements LogOutput {
  readonly buffer: LogEntry[] = [];

  constructor(
    private readonly maxLogEntries = 200,
    private readonly flushOnOverload = false,
  ) {}

  write(entry: LogEntry): void {
    if (this.buffer.length >= this.maxLogEntries) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.flushOnOverload ? this.flush() : this.buffer.shift();
    }
    this.buffer.push(entry);
  }

  flush(): void {
    this.buffer.length = 0;
  }

  bufferToString(): string {
    return this.buffer
      .map((entry) => `${ConsoleOutput.formatMessage(entry)} ${JSON.stringify(entry.data)}`)
      .join('\\n');
  }
}
