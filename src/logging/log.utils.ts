import { LogContext } from './types';

const isObject = (item: unknown): item is Record<string, unknown> => {
  return item !== null && typeof item === 'object';
};

/** Log Utils */
export namespace Logs {
  export const tagsLine = (tags: readonly string[] | undefined): string => {
    return tags?.length ? `[${tags.map((tag) => `#${tag}`).join()}]` : '';
  };

  export const commonSensitiveFields = ['password', 'token', 'secret', 'sessionId'];

  export const stringifyError = (error: Error, numStackLines: number | undefined): string => {
    if (numStackLines === 0) {
      return `${error.name}: ${error.message}`;
    }

    const stack: string = error.stack ?? '';
    const out: readonly string[] = stack.split('\n').filter((line) => !line.includes('logger.')); // remove logger related lines

    return `${out.slice(0, numStackLines ?? out.length).join('\n')}`;
  };

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
