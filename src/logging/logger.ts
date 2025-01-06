import { ConsoleOutput } from './console.output';
import { LogLevel, LogLevels } from './level.enum';
import { logs } from './log.utils';
import { LogOutputRegistry } from './output.registry';
import { LogContext, LogEntry, LogMessage, LogOutputChannel, LogTag, LogTranslator } from './types';

interface LogMethod {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (message: string, ...args: any[]): void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (context: LogContext, message: string, ...args: any[]): void;
}

/** Log distribution by available channels */
const write = (logEntry: LogEntry, outputChannels: LogOutputRegistry): void => {
  try {
    outputChannels.byLogLevel(logEntry.level).forEach((o) => o.write(logEntry));
  } catch (err) {
    // tslint:disable-next-line:no-console
    console.error('Failed to write Logs', err);
  }
};

const stringifyError = (error: Error, numStackLines: number | undefined): string => {
  if (numStackLines === 0) {
    return `${error.name}: ${error.message}`;
  }

  const stack: string = error.stack ?? '';
  const out: readonly string[] = stack.split('\n').filter((line) => !line.includes('logger.')); // remove logger related lines

  return `${out.slice(0, numStackLines ?? out.length).join('\n')}`;
};

const createStack = (numStackLines: number | undefined): string => {
  if (numStackLines === 0) {
    return '';
  }
  return stringifyError(new Error(), numStackLines).replace('Error:', 'Stack:');
};

export const emptyTranslator: LogTranslator = {
  map(logMessage: LogMessage): LogMessage {
    return logMessage;
  },
};

/**
 * Stringifies Error Stack.
 */
export const stringifyErrorStackTranslator: LogTranslator<number | undefined> = {
  map({ message, optionalParams }: LogMessage, trimStack): LogMessage {
    return {
      message,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      optionalParams: optionalParams.map((one) => (one instanceof Error ? stringifyError(one, trimStack) : one)),
    };
  },
};

/**
 * Invokes JSON.stringify on log data arguments.
 * Stringifies Errors fairly (not just {} as regular JSON.stringify(new Error('Boo')))
 */
export const jsonStringifyTranslator: LogTranslator = {
  map: ({ message, optionalParams }) => {
    return {
      message,
      optionalParams: optionalParams.map((one) =>
        one instanceof Error ? JSON.stringify(stringifyError(one, undefined)) : JSON.stringify(one),
      ),
    };
  },
};

/**
 * Sanitizes all sensitive data that should not be exposed.
 * For performance optimization – it's good to sanitize data ONLY in places when it's actually needed.
 */
export const sanitizeSensitiveTranslator: LogTranslator<readonly string[]> = {
  map({ message, optionalParams }: LogMessage, sensitive = logs.commonSensitiveFields): LogMessage {
    return { message, optionalParams: logs.sanitizeSensitiveData(optionalParams, true, sensitive) };
  },
};

const bakeLogWithLevel = (
  level: LogLevel,
  outputChannels: LogOutputRegistry,
  tags: readonly LogTag[],
  appId?: string,
  translator: LogTranslator = emptyTranslator,
  // For compatibility with console default behaviour always show stack for error payload by default
  errorPayloadStackLevel = LogLevel.Debug,
): LogMethod => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any[]): void => {
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const message: string = typeof args[0] === 'string' ? args.shift() : '';
    let logMessage: LogMessage = { message, optionalParams: args };

    if (context.sanitize) {
      logMessage = sanitizeSensitiveTranslator.map(logMessage, context.sanitize);
    }

    const hasErrorPayload = logMessage.optionalParams.some((one) => one instanceof Error);
    const trimStack =
      context.withStack === false || LogLevels.severity(level) < LogLevels.severity(errorPayloadStackLevel)
        ? 0
        : context.trimStack;

    if (hasErrorPayload) {
      logMessage = stringifyErrorStackTranslator.map(logMessage, trimStack);
    }

    if (context.stringify) {
      logMessage = jsonStringifyTranslator.map(logMessage);
    }
    logMessage = translator.map(logMessage);

    // create synthetic stack if there is no Error payload.
    const stack = context.withStack && !hasErrorPayload ? createStack(trimStack) : '';

    write(
      {
        date: new Date(),
        level,
        appId,
        context,
        message: logMessage.message,
        data: logMessage.optionalParams,
        stack,
      },
      outputChannels,
    );
  };
};

export namespace Logger {
  let defaultChannels: readonly LogOutputChannel[] = [{ out: new ConsoleOutput() }];

  export const setDefaultChannels = (...channels: readonly LogOutputChannel[]): void => {
    defaultChannels = channels;
  };

  export const getDefaultChannels = (): readonly LogOutputChannel[] => {
    return defaultChannels;
  };
}

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

type LoggerOptions = {
  /** Application Id - to distinguish loggers of multiple instances of your Apps or services */
  readonly appId?: string;
  /** Stream your log simultaneously into multiple output channels */
  readonly channels?: readonly LogOutputChannel[];
  /** Tag your logger, so it would be easily to filter logs */
  readonly tags?: readonly LogTag[];
  /** Implement your custom transformation of your log data before write, e.g sanitize */
  readonly translator?: LogTranslator;
  /** Show Error payload stack for level not less than specified. LogLevel.Error by default */
  readonly errorPayloadStackLevel?: LogLevel;
};

export const generateAppId = (): string => `app${Date.now()}`;

const cacheMap = new Map<string, Logger>();

const getCacheKey = (tags: readonly LogTag[]): string => [...tags].sort().join(',');

/**
 * Factory method for Main application Logger.
 * Use `jamLogger` instance if you prefer out of box solution.
 *
 * @see `LoggerOptions` to customize.
 */
export const createLogger = ({
  appId,
  channels,
  tags,
  translator,
  errorPayloadStackLevel,
}: LoggerOptions = {}): Logger => {
  const sortedTags = tags?.slice() ?? [];
  sortedTags.sort();
  const id = appId ?? generateAppId();
  const logChannels = new LogOutputRegistry(channels ?? Logger.getDefaultChannels());
  return {
    error: bakeLogWithLevel(LogLevel.Error, logChannels, sortedTags, id, translator, errorPayloadStackLevel),
    warn: bakeLogWithLevel(LogLevel.Warn, logChannels, sortedTags, id, translator, errorPayloadStackLevel),
    info: bakeLogWithLevel(LogLevel.Info, logChannels, sortedTags, id, translator, errorPayloadStackLevel),
    debug: bakeLogWithLevel(LogLevel.Debug, logChannels, sortedTags, id, translator, errorPayloadStackLevel),
    channels: logChannels,
    tags: sortedTags,
    tagged: (...newTags): Logger => {
      const nextTags = new Set([...sortedTags, ...newTags]);
      const cacheKey = getCacheKey([...nextTags]);

      if (cacheMap.has(cacheKey)) {
        return cacheMap.get(cacheKey)!;
      }
      const childLogger = createLogger({
        appId,
        channels,
        tags: sortedTags.concat(newTags),
        translator,
        errorPayloadStackLevel,
      });
      cacheMap.set(cacheKey, childLogger);

      return childLogger;
    },
    appId: id,
  };
};

/**
 * Ready made - Application Logger with:
 * - Console Output (same api)
 * - stacks for Error log Level
 * - auto-generated appId
 * - tags support
 * - fields sanitization by demand. (e.g. `jamLogger.info({ sanitize: ['sessionId'] }, 'Wow', someData)`)
 *
 * log example:
 *  `[app1611253982848][2021-01-21T18:33:02.981Z][debug][#client] Logged In, { username: Bob, password: '***' }`
 */
export const jamLogger = createLogger();
