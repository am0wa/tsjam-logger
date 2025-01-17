const isObject = (item: unknown): item is Record<string, unknown> => {
  return item !== null && typeof item === 'object';
};

/** Log Utils */
export namespace Logs {
  /** @return simple Date based appId e.g. `'app1737054910132'` */
  export const generateAppId = (): string => `app${Date.now()}`;

  /** @return Tags line e.g. '[#tag1,#tag2]' */
  export const tagsLine = (tags: readonly string[] | undefined): string => {
    return tags?.length ? `[${tags.map((tag) => `#${tag}`).join()}]` : '';
  };

  /** @return Stringified error. Trims stack to `numStackLines` is specified */
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

  /**
   * @default ['password', 'token', 'secret', 'sessionId']
   */
  export const knownSensitiveFields: readonly string[] = ['password', 'token', 'secret', 'sessionId'];

  /**
   * Sanitizes sensitive fields e.g. // { password: '***' }
   * Supports primitives, objects and arrays.
   */
  export const sanitize = <T>(data: T, sensitiveFields = knownSensitiveFields, deep = false, mask = '***'): T => {
    if (!isObject(data)) {
      return data;
    }
    if (Array.isArray(data)) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions,@typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
      return data.map((one) => sanitize(one, sensitiveFields, deep)) as any;
    }
    const sanitized = { ...data };
    Object.keys(sanitized).forEach((key) => {
      if (sensitiveFields.find((sensitive) => key.match(sensitive))) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        sanitized[key] = mask;
      }
      const value = sanitized[key];
      if (isObject(value)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        sanitized[key] = sanitize(value, sensitiveFields, deep);
      }
    });
    return sanitized;
  };

  export const stringNode = (value: string | undefined): string => {
    return value?.length ? `[${value}]` : '';
  };
}
