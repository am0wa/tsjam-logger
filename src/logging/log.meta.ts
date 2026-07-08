import type { LogTag } from './types.js';

export namespace LogMeta {
  export const SYM = Symbol.for('logs.meta');

  export const EMPTY = <const>{ [LogMeta.SYM]: true };

  export const isSigned = (data: unknown): data is LogMeta => {
    if (data == null || typeof data !== 'object') {
      return false;
    }
    return LogMeta.SYM in data;
  };

  /** Meta with no enumerable payload – nothing to merge or print (one-off tags don't count) */
  export const isEmpty = (meta: LogMeta): boolean => {
    return meta === LogMeta.EMPTY || Object.keys(meta).length === 0;
  };

  /**
   * Bakes one-off tags for a single log call, e.g. `jamLogger.info('cache rebuilt', LogMeta.tag('startup'))`.
   * Tags land in `LogEntry.tags` only (hidden from the meta printout, use `bake` for printable metadata).
   */
  export const tag = (...tags: readonly LogTag[]): LogMeta => {
    if (tags.length === 0) {
      return EMPTY;
    }
    const meta = {};
    // Making tags non-enumerable hides it from Object.keys, spread, and JSON.stringify while argsMeta.tags remains directly readable — so logMessage still concats the tags into entry.tags, but isEmpty is
    // true, the logger reuses this.metadata as-is (no merge allocation), and nothing leaks into the printed metadata. The tags live only where they belong: entry.tags.
    Object.defineProperty(meta, 'tags', { enumerable: false, configurable: false, value: tags });
    Object.defineProperty(meta, LogMeta.SYM, { enumerable: false, configurable: false, value: true });
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return meta as LogMeta;
  };

  /** Transforms metadata into signed metadata, which is easy to track */
  export const bake = (data: object): LogMeta => {
    if (data === EMPTY || data == null || Object.keys(data).length === 0) {
      return EMPTY;
    }
    if (LogMeta.SYM in data) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return data as LogMeta;
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
