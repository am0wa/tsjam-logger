import { Logs } from '../log.utils.js';
import type { LogMessage, LogTranslator } from '../types.js';

/**
 * Stringifies Error Stack.
 */
export const stringifyErrorStackTranslator: LogTranslator<number | undefined> = {
  map({ message, optionalParams }: LogMessage, trimStack): LogMessage {
    return {
      message,
      optionalParams: optionalParams.map((one) => (one instanceof Error ? Logs.stringifyError(one, trimStack) : one)),
    };
  },
};
