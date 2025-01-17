import { Logs } from '../log.utils';
import { LogMessage, LogTranslator } from '../types';

/**
 * Sanitizes all sensitive data that should not be exposed.
 * For performance optimization – it's good to sanitize data ONLY in places when it's actually needed.
 */
export const sanitizeSensitiveTranslator: LogTranslator<readonly string[]> = {
  map({ message, optionalParams }: LogMessage, sensitive): LogMessage {
    return { message, optionalParams: Logs.sanitize(optionalParams, sensitive, true) };
  },
};
