import { Logs } from '../log.utils.js';
import type { LogTranslator } from '../types.js';

/**
 * Invokes JSON.stringify on log data arguments.
 * Stringifies Errors fairly (not just {} as regular JSON.stringify(new Error('Boo')))
 */
export const jsonStringifyTranslator: LogTranslator = {
  map: ({ message, optionalParams }) => {
    return {
      message,
      optionalParams: optionalParams.map((one) => Logs.stringify(one)),
    };
  },
};
