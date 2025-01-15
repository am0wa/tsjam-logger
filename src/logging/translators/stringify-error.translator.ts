import { Logs } from '../log.utils';
import { LogMessage, LogTranslator } from '../types';

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
