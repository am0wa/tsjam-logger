import { ConsoleOutput } from './console.output';
import { LogLevel, LogLevels } from './level.enum';
import { Logs } from './log.utils';
import { LogOutputRegistry } from './output.registry';
import { jsonStringifyTranslator } from './translators/json-stringify.translator';
import { sanitizeSensitiveTranslator } from './translators/sanitize-sensitive.translator';
import { stringifyErrorStackTranslator } from './translators/stringify-error.translator';
import {
  LogContext,
  LogEntry,
  Logger,
  LoggerConfig,
  LogMessage,
  LogMeta,
  LogMethod,
  LogOutputChannel,
  LogTag,
  LogTranslator,
} from './types';

const createStack = (numStackLines: number | undefined): string => {
  if (numStackLines === 0) {
    return '';
  }
  return Logs.stringifyError(new Error(), numStackLines).replace('Error:', 'Stack:');
};

const emptyTranslator: LogTranslator = {
  map: (logMessage: LogMessage) => logMessage,
};

export const generateAppId = (): string => `app${Date.now()}`;
export const defaultOutputChannels: readonly LogOutputChannel[] = [{ out: new ConsoleOutput() }];

/**
 * Factory method for Main application Logger.
 * Use `jamLogger` instance if you prefer out of box solution.
 *
 * @see `LoggerConfig` to customize.
 */
export const createLogger = (config?: LoggerConfig): Logger => {
  return JamLogger.create(config);
};

export class JamLogger implements Logger {
  static readonly defaultInstance = JamLogger.create();

  /** Logger with same config would be created only once and shared across the app */
  private static instances = new WeakMap<LoggerConfig, Logger>();

  static create(config: LoggerConfig = {}): Logger {
    const instance = JamLogger.instances.get(config) ?? new JamLogger({ ...config });
    JamLogger.instances.set(config, instance);
    return instance;
  }

  readonly appId: string;
  readonly tags: readonly LogTag[];
  readonly channels: LogOutputRegistry;
  readonly errorPayloadStackLevel: LogLevel;
  readonly translator: LogTranslator;

  metadata: LogMeta;

  protected constructor({
    appId = generateAppId(),
    channels = defaultOutputChannels,
    tags = [],
    errorPayloadStackLevel = LogLevel.Debug,
    translator = emptyTranslator,
    metadata = {},
  }: LoggerConfig) {
    this.appId = appId;
    this.tags = [...tags].sort();
    this.channels = new LogOutputRegistry(channels);
    this.errorPayloadStackLevel = errorPayloadStackLevel;
    this.translator = translator;
    this.metadata = metadata;
  }

  readonly error: LogMethod = (...args) => this.logMessage(LogLevel.Error, this.metadata, this.tags, ...args);
  readonly warn: LogMethod = (...args) => this.logMessage(LogLevel.Warn, this.metadata, this.tags, ...args);
  readonly info: LogMethod = (...args) => this.logMessage(LogLevel.Info, this.metadata, this.tags, ...args);
  readonly debug: LogMethod = (...args) => this.logMessage(LogLevel.Debug, this.metadata, this.tags, ...args);

  tagged(tags: LogTag): Logger {
    const nextTags = [...new Set([...this.tags, ...tags])].sort();

    const meta = { ...this.metadata };
    return {
      ...this,
      metadata: { ...this.metadata },
      error: (...args) => this.logMessage(LogLevel.Error, meta, nextTags, ...args),
      warn: (...args) => this.logMessage(LogLevel.Warn, meta, nextTags, ...args),
      info: (...args) => this.logMessage(LogLevel.Info, meta, nextTags, ...args),
      debug: (...args) => this.logMessage(LogLevel.Debug, meta, nextTags, ...args),
      tags: nextTags,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logMessage(level: LogLevel, meta: LogMeta, tags: readonly LogTag[], ...args: any[]): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const argsContext: LogContext =
      typeof args[0] === 'string'
        ? {
            /* empty */
          }
        : { ...args.shift() };
    const context = {
      ...argsContext,
      tags: argsContext.tags?.length ? argsContext.tags?.concat(tags) : tags.slice(),
    };

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const message = typeof args[0] === 'string' ? (args.shift() as string) : '';
    let logMessage: LogMessage = { message, optionalParams: args };

    if (context.sanitize) {
      logMessage = sanitizeSensitiveTranslator.map(logMessage, context.sanitize);
    }

    const hasErrorPayload = logMessage.optionalParams.some((one) => one instanceof Error);
    const trimStack =
      context.withStack === false || LogLevels.severity(level) < LogLevels.severity(this.errorPayloadStackLevel)
        ? 0
        : context.trimStack;

    if (hasErrorPayload) {
      logMessage = stringifyErrorStackTranslator.map(logMessage, trimStack);
    }

    if (context.stringify) {
      logMessage = jsonStringifyTranslator.map(logMessage);
    }
    logMessage = this.translator.map(logMessage);

    const stack = context.withStack && !hasErrorPayload ? createStack(trimStack) : '';

    this.write({
      appId: this.appId,
      date: new Date(),
      level,
      meta,
      context,
      message: logMessage.message,
      data: logMessage.optionalParams,
      stack,
    });
  }

  /** Log distribution by available channels */
  readonly write = (logEntry: LogEntry): void => {
    try {
      this.channels.byLogLevel(logEntry.level).forEach((o) => o.write(logEntry));
    } catch (err) {
      console.error(`Failed to write Log entry: ${JSON.stringify(logEntry)}`, err);
    }
  };
}

/**
 * Ready-made - Application Logger with:
 * - Console Output (same api)
 * - stacks for Error log Level
 * - auto-generated appId
 * - tags support
 * - fields sanitization by demand. (e.g. `jamLogger.info({ sanitize: ['sessionId'] }, 'Wow', someData)`)
 *
 * log example:
 *  `[app1611253982848][2021-01-21T18:33:02.981Z][debug][#client] Logged In, { username: Bob, password: '***' }`
 */
export const jamLogger = JamLogger.defaultInstance;
