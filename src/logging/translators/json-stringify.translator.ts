import { Logs } from '../log.utils';
import { LogTranslator } from '../types';

/**
 * Invokes JSON.stringify on log data arguments.
 * Stringifies Errors fairly (not just {} as regular JSON.stringify(new Error('Boo')))
 */
export const jsonStringifyTranslator: LogTranslator = {
  map: ({ message, optionalParams }) => {
    return {
      message,
      optionalParams: optionalParams.map((one) =>
        one instanceof Error ? JSON.stringify(Logs.stringifyError(one, undefined)) : JSON.stringify(one),
      ),
    };
  },
};
