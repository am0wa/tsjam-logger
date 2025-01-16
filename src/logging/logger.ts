import { ConsoleOutput } from './console.output';
import { LogLevel, LogLevels } from './level.enum';
import { LogMeta } from './log.meta';
import { LogOutputRegistry } from './output.registry';
import { stringifyErrorStackTranslator } from './translators';
import {
  LogEntry,
  Logger,
  LoggerConfig,
  LogMessage,
  LogMethod,
  LogOutputChannel,
  LogTag,
  LogTranslator,
  StackConfig,
} from './types';

const emptyTranslator: LogTranslator = {
  map: (logMessage: LogMessage) => logMessage,
};

export const generateAppId = (): string => `app${Date.now()}`;
export const defaultOutputChannels: readonly LogOutputChannel[] = [{ out: new ConsoleOutput() }];

export class JamLogger implements Logger {
  /** Logger with same config would be created only once and shared across the app */
  static readonly instancesMap = new WeakMap<LoggerConfig, Logger>();

  static create(config: LoggerConfig = {}): Logger {
    let instance = JamLogger.instancesMap.get(config);
    if (!instance) {
      instance = new JamLogger({ ...config });
      JamLogger.instancesMap.set(config, instance);
    }
    return instance;
  }

  private static metaMap = new Map<string, LogMeta>();

  static updateMeta(appId: string, metadata: Record<string, unknown>): LogMeta {
    const oldMeta = JamLogger.metaMap.get(appId) ?? {};
    const newMeta = LogMeta.bake({ ...oldMeta, ...metadata });
    JamLogger.metaMap.set(appId, newMeta);
    return newMeta;
  }

  readonly appId: string;
  readonly tags: readonly LogTag[];
  readonly channels: LogOutputRegistry;
  readonly translator: LogTranslator;
  readonly stackConfig: StackConfig;

  protected constructor({
    appId = generateAppId(),
    channels = defaultOutputChannels,
    tags = [],
    metadata = LogMeta.EMPTY,
    translator = emptyTranslator,
    errorStackLevel = LogLevel.Error,
  }: LoggerConfig) {
    this.appId = appId;
    this.tags = [...tags].sort();
    this.channels = new LogOutputRegistry(channels);
    this.translator = translator;
    this.stackConfig = {
      errorStackLevel: errorStackLevel,
    };
    JamLogger.updateMeta(appId, metadata);
  }

  get metadata(): LogMeta {
    return JamLogger.metaMap.get(this.appId) ?? LogMeta.EMPTY;
  }

  readonly error: LogMethod = (...args) => this.logMessage(LogLevel.Error, this.tags, ...args);
  readonly warn: LogMethod = (...args) => this.logMessage(LogLevel.Warn, this.tags, ...args);
  readonly info: LogMethod = (...args) => this.logMessage(LogLevel.Info, this.tags, ...args);
  readonly debug: LogMethod = (...args) => this.logMessage(LogLevel.Debug, this.tags, ...args);

  tagged(...tags: LogTag[]): Logger {
    const nextTags = [...new Set([...this.tags, ...tags])].sort(); // unique and sorted

    return {
      appId: this.appId,
      channels: this.channels,
      tagged: this.tagged.bind(this, ...nextTags), // preserve the ability to chain
      error: (...args) => this.logMessage(LogLevel.Error, nextTags, ...args),
      warn: (...args) => this.logMessage(LogLevel.Warn, nextTags, ...args),
      info: (...args) => this.logMessage(LogLevel.Info, nextTags, ...args),
      debug: (...args) => this.logMessage(LogLevel.Debug, nextTags, ...args),
      tags: nextTags,
    };
  }

  /**
   * @param level
   * @param tags
   * @param args – optionalParams. Note: `LogMeta` could be among arguments (nearly last).
   */
  logMessage(level: LogLevel, tags: readonly LogTag[], ...args: unknown[]): void {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const message = typeof args[0] === 'string' ? (args.shift() as string) : '';

    const metaIdx = args.findIndex(LogMeta.isSigned);
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const argsMeta: LogMeta = metaIdx === -1 ? LogMeta.EMPTY : (args[metaIdx] as LogMeta);

    let logMessage: LogMessage = {
      message,
      optionalParams: [...args.slice(0, metaIdx), ...args.slice(metaIdx + 1)],
    };

    const hasErrorPayload = logMessage.optionalParams.some((one) => one instanceof Error);
    if (hasErrorPayload) {
      const trimStack =
        LogLevels.severity(level) < LogLevels.severity(this.stackConfig.errorStackLevel)
          ? 0
          : this.stackConfig.trimStack;
      logMessage = stringifyErrorStackTranslator.map(logMessage, trimStack);
    }
    logMessage = this.translator.map(logMessage);

    this.write({
      appId: this.appId,
      date: new Date(),
      level,
      tags: argsMeta.tags?.length ? tags.concat(argsMeta.tags) : tags,
      message: logMessage.message,
      data: logMessage.optionalParams,
      meta: argsMeta === LogMeta.EMPTY ? this.metadata : LogMeta.bake({ ...this.metadata, ...argsMeta }),
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
 * Factory method for Main application Logger.
 * Use `jamLogger` instance if you prefer out of box solution.
 *
 * @see `LoggerConfig` to customize.
 */
export const createLogger = (config?: LoggerConfig): Logger => {
  return JamLogger.create(config);
};

/**
 * Ready-made - Application Logger with:
 * - Console Output (same api)
 * - stacks for Error log Level
 * - auto-generated appId
 * - tags support
 * - fields sanitization by demand. (e.g. `jamLogger.info({ sanitize: ['sessionId', 'password'] }, 'Wow', someData)`)
 *
 * log example:
 *  `[app1611253982848][2021-01-21T18:33:02.981Z][debug][#client] Logged In, { username: Bob, password: '***' }`
 */
export const jamLogger = JamLogger.create();
