import { LogTag } from './types';

export namespace LogMeta {
  export const SYM = Symbol.for('logs.meta');

  export const EMPTY = <const>{ [LogMeta.SYM]: true };

  export const isSigned = (data: unknown): data is LogMeta => {
    if (data == null || typeof data !== 'object') {
      return false;
    }
    return LogMeta.SYM in data;
  };

  /** Transforms metadata into signed metadata, which is easy to track */
  export const bake = (data: object): LogMeta => {
    if (data == null || data === EMPTY) {
      return EMPTY;
    }

    Object.defineProperty(data, LogMeta.SYM, { enumerable: false, configurable: false, value: true });
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return data as LogMeta;
  };
}

/** Key-Value info to sent in each log entry, e.g. 'userAgent', 'hostname', 'userId' etc. */
export type LogMeta = {
  [LogMeta.SYM]: true;
  readonly [key: string]: unknown;
  readonly tags?: readonly LogTag[];
};
