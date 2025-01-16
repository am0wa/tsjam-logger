import { LogMeta } from './log.meta';

const isObject = (item: unknown): item is Record<string, unknown> => {
  return item !== null && typeof item === 'object';
};

/** Log Utils */
export namespace Logs {
  export const tagsLine = (tags: readonly string[] | undefined): string => {
    return tags?.length ? `[${tags.map((tag) => `#${tag}`).join()}]` : '';
  };

  export const stringifyError = (error: Error, numStackLines: number | undefined): string => {
    if (numStackLines === 0) {
      return `${error.name}: ${error.message}`;
    }

    const stack: string = error.stack ?? '';
    const out: readonly string[] = stack.split('\n').filter((line) => !line.includes('logger.')); // remove logger related lines

    return `${out.slice(0, numStackLines ?? out.length).join('\n')}`;
  };

  export const createStack = (numStackLines: number | undefined): string => {
    if (numStackLines === 0) {
      return '';
    }
    return Logs.stringifyError(new Error(), numStackLines).replace('Error:', 'Stack:');
  };

  /**
   * Safe JSON.stringify with proper error instances serialisation.
   */
  export const stringify = (
    data: unknown,
    replacer?: (number | string)[] | null,
    space?: string | number,
  ): string | undefined => {
    if (data instanceof Error) {
      return JSON.stringify(Logs.stringifyError(data, undefined), replacer, space);
    }
    try {
      return JSON.stringify(data, replacer, space);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      return undefined;
    }
  };

  export const commonSensitiveFields = ['password', 'token', 'secret', 'sessionId'];

  /**
   * Sanitizes sensitive fields e.g. // { password: '***' }
   * Supports primitives, objects and arrays.
   */
  export const sanitize = <T>(data: T, deep = false, sensitiveFields: readonly string[] = commonSensitiveFields): T => {
    if (!isObject(data)) {
      return data;
    }
    if (Array.isArray(data)) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions,@typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
      return data.map((one) => sanitize(one, deep, sensitiveFields)) as any;
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
        sanitized[key] = sanitize(value, deep, sensitiveFields);
      }
    });
    return sanitized;
  };

  export const stringNode = (value: string | undefined): string => {
    return value?.length ? `[${value}]` : '';
  };

  export const metaLine = (meta: LogMeta | undefined): string => {
    if (!meta) {
      return '';
    }
    return Object.entries(meta)
      .map(([key, value]) => {
        return isObject(value) ? `${key}: ${Logs.stringify(value)}` : `${key}: ${value}`;
      })
      .join(',');
  };
}
