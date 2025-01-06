import { LogContext } from './types';

const isObject = (item: unknown): item is Record<string, unknown> => {
  return item !== null && typeof item === 'object';
};

/** Log Utils */
export namespace logs {
  export const tagsLine = (tags: readonly string[] | undefined): string => {
    return tags?.length ? `[${tags.map((tag) => `#${tag}`).join()}]` : '';
  };

  export const commonSensitiveFields = ['password', 'token', 'secret', 'sessionId'];

  /**
   * Sanitizes sensitive Data.
   * Supports primitives, objects and arrays.
   */
  export const sanitizeSensitiveData = <T>(
    data: T,
    deep = false,
    sensitiveFields: readonly string[] = commonSensitiveFields,
  ): T => {
    if (!isObject(data)) {
      return data;
    }
    if (Array.isArray(data)) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions,@typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
      return data.map((one) => sanitizeSensitiveData(one, deep, sensitiveFields)) as any;
    }
    const sanitized = { ...data };
    Object.keys(sanitized).forEach((key) => {
      if (sensitiveFields.find((sensitive) => key.match(sensitive))) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        sanitized[key] = '***';
      }
      const value = sanitized[key];
      if (isObject(value)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        sanitized[key] = sanitizeSensitiveData(value, deep, sensitiveFields);
      }
    });
    return sanitized;
  };

  export const stringNode = (value: string | undefined): string => {
    return value?.length ? `[${value}]` : '';
  };

  export const contextLine = (context: LogContext | undefined): string => {
    if (!context) {
      return '';
    }

    let line = '';
    Object.keys(context).forEach((key) => {
      if (key == 'tags') {
        line += tagsLine(context[key]);
      } else {
        line += key !== 'withStack' && key !== 'trimStack' && key !== 'sanitize' ? stringNode(`${context[key]}`) : '';
      }
    });
    return line;
  };
}
