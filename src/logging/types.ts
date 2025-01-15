import { LogLevel } from './level.enum';
import { LogOutputRegistry } from './output.registry';

/**
 * String label for quick search across logs.
 * Note: '#' would be added automatically
 */
export type LogTag = string;

/**
 * Context which you could add as a first argument to any of jamLogger methods
 */
export interface LogContext {
  readonly [key: string]: unknown;
  readonly tags?: readonly LogTag[];
  /**
   * True for payloads with Error.
   * Creates synthetic stack for any level if there is no Error payload. Otherwise hides it.
   */
  readonly withStack?: boolean;
  /**
   * Trims Errors payload stack to number of lines.
   */
  readonly trimStack?: number;
  readonly sanitize?: readonly string[];
  readonly stringify?: boolean;
}

export type LogEntry = {
  readonly appId: string;
  readonly date: Date;
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: LogContext;
  readonly data?: readonly unknown[];
  readonly stack?: string;
  readonly meta?: LogMeta;
};

/**
 * Implement this API in order to receive log writes into your custom output.
 */
export interface LogOutput {
  write(e: LogEntry): void;
}

/**
 * Sets the logLevel for your particular output channel.
 */
export type LogOutputChannel = {
  readonly out: LogOutput;
  readonly level?: LogLevel;
};

export type LogMessage = {
  readonly message: string;
  readonly optionalParams: readonly unknown[];
};

/** Log Message mapping layer, common use-case is sensitive data sanitization */
export type LogTranslator<U = unknown> = {
  readonly map: (data: LogMessage, info?: U) => LogMessage;
};

export interface LogMethod {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (message: string, ...args: any[]): void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (context: LogContext, message: string, ...args: any[]): void;
}

/** Key-Value info to sent in each log entry, e.g. 'userAgent', 'hostname', 'userId' etc. */
export type LogMeta = Readonly<Record<string, unknown>>;

/**
 * Not Opinionated ts Logger with:
 * - appId (distinguish log between multiple instances)
 * - tags support (tag child loggers, find and filter certain logs super-fast)
 * - multiple channels output (you could add your own one: e.g. for parallel monitoring; @see `LoggerOptions`)
 * - sensitive fields sanitization (perf optimized, customizable: @see `LogContext`)
 * - stack output of any call (configurable: @see `LogContext`)
 */
export interface Logger {
  readonly appId: string;
  readonly error: LogMethod;
  readonly warn: LogMethod;
  readonly info: LogMethod;
  readonly debug: LogMethod;
  readonly channels: LogOutputRegistry;
  readonly tags: readonly LogTag[];
  /**
   * Creates Child logger with added tags.
   * Note: AppId and Channels are reused and remain same.
   */
  readonly tagged: (...tags: readonly LogTag[]) => Logger;
}

export type LoggerConfig = {
  /** Application Id - to distinguish loggers of multiple instances of your Apps or services */
  readonly appId?: string;
  /** Stream your log simultaneously into multiple output channels */
  readonly channels?: readonly LogOutputChannel[];
  /** Tag your logger, so it would be easily to filter logs */
  readonly tags?: readonly LogTag[];
  /** Any Metadata per appId to be sent with each log entry, e.g. 'userAgent', 'hostname' etc. */
  readonly metadata?: LogMeta;
  /** Implement your custom transformation of your log data before write, e.g sanitize */
  readonly translator?: LogTranslator;
  /** Show Error payload stack for level not less than specified. LogLevel.Error by default */
  readonly errorPayloadStackLevel?: LogLevel;
};
