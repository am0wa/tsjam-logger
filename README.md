# @tsjam/logger

**Vanilla TypeScript Logger**

Not opinionated ts Logger with Multiple output channels 🍰  
Useful for parallel console output & remote monitoring 👩‍🚀

[![MIT licensed](https://img.shields.io/badge/license-MIT-blue)](https://github.com/am0wa/tsjam-logger/blob/main/LICENSE)
[![npm version](https://badge.fury.io/js/%40tsjam%2Flogger.svg)](https://badge.fury.io/js/%40tsjam%2Flogger)
[![multichannel](https://img.shields.io/badge/multichannel%20output-8A2BE2)](#usage-bake-ur-own-logger)
[![hashtags](https://img.shields.io/badge/%23hashtags-blue)](#tagged-logger)
[![timestamps](https://img.shields.io/badge/timestamps-blue)](#tagged-logger)

**Advantages:**

- **appId** (distinguish log between multiple app instances)
- **timestamps** (milliseconds matter)
- **hashtags** (tag child loggers, find and filter certain logs super-fast)
- **multiple channels** output (add ur own output: e.g. parallel console output & remote monitoring)
- **metadata** (for all log entries per appId or per call e.g. `{ userId: 007 }`)
- **buffering** (useful for crash reporting)
- **fully customizable** (use your own log format)
- **fair Errors serialization** into string (check `JSON.stringify(new Error('Oops')); // {}`)
- **sanitization** of sensitive fields (perf optimized, `Logs.sanitize({ password: 'ABC' })`)
- **safe stringify** payload at any moment (`Logs.stringify(data)`)
- **trim stack** to number of lines or fully cut (configurable,`{ trimStack: 3 }`)
- **zero third-party dependencies**

**Output example:**  
`[app161125][2024-01-21T18:33:02.981Z][info][#user] Logged In: { username: Bob, password: '***' }`

# Installation

```
npm install @tsjam/logger
```

---

# Usage

## Out of Box

`ConsoleOutput` is the default output channel. Specify Ur own ones if needed...

```typescript
import { jamLogger } from '@tsjam/logger';

jamLogger.info('Hello Logger!');
// [app161125][2024-01-21T18:33:02.981Z][info] Hello Logger!
```

### Tagged Logger

Tag child loggers to easily filter logs by tags.

```typescript
const logger = jamLogger.tagged('user'); // child logger with added tags

logger.info('Greetings for', { name: 'Bob' });
// [app161125][2024-01-21T18:33:02.981Z][info][#user] Greetings for { name: 'Bob' }
```

## Bake Own Logger

```typescript
const logger = JamLogger.create({
  appId: `ioApp${Date.now()}`,
  channels: [...defaultOutputChannels /* { out: MyKibanaOutput } */], // default output channel is ConsoleOutput
});
const aiLogger = logger.taggeg('ai'); // child logger with #ai tag
```

### Custom Output Channel

```typescript
const myOutput: LogOutput = {
  write: ({ appId, date, level, message, data, context }: LogEntry) => {
    // Format raw log entry and send it anywhere U wish
  },
};

const logger = JamLogger.create({
  channels: [...defaultOutputChannels, { out: myOutput }, { out: myKibanaOutput }],
});
```

### Buffering

Use simplistic `BufferOutput` to buffer logs for any crash reporting or remote monitoring.
Do not forget to `flush` after report is sent.

```typescript
const logBuffer = new BufferOutput(2000);
const logger = JamLogger.create({
  channels: [...defaultOutputChannels, { out: logBuffer }],
});
```

### Metadata

Metadata is especially useful for remote reporting & monitoring.

```typescript
import { JamLogger } from '@tsjam/logger';

const logger = JamLogger.create({
   metadata: { userId: 007 }, // use it however U wish in ur output channel next to log entry
});
//...
JamLogger.updateMeta(logger.appId, { userId: 546 }); // update metadata
```

Pass additional meta per call.

```typescript
const logger = JamLogger.create({
  metadata: { userId: 007 }, // use it however U wish in ur output channel next to log entry
});
logger.info('Whats Up?', LogMeta.bake({ drink: 'dry martini' }));
// [app170723][2025-01-16T16:47:56.398Z][debug] Whats Up?
// meta: { "userId": "007", "drink": "'dry martini' }"
```

## Cook per single call

### Sensitive Fields Sanitization

```typescript
jamLogger.debug('Logged in', Loges.sanitize({ name: 'Bob', password: 'ABC' }));
// [app170723][2024-02-06T16:47:56.398Z][debug] Logged in  { name: 'Bob', password: '***' }
```

**Note:** to always sanitize sensitive fields use `sanitizeSensitiveTranslator` config option.  
Yet it's more perf optimized to sanitize only when needed.

### Stack Visibility

Shown on Error payloads (same like console.log);

```typescript
jamLogger.warn('Oops!', new Error('Something went wrong'));
// [app170723][2024-02-06T17:02:00.108Z][warn] Oops  Error: Something went wrong
//    at Object.<anonymous> (...tsjam-logger/tests/logging/log.utils.spec.ts:10:49)
//    at Promise.then.completed (...tsjam-logger/node_modules/jest-circus/build/utils.js:298:28)
//    ...
```

Hide stack on Error payloads for specified levels

```typescript
const logger = JamLogger.create({ errorStackLevel: LogLevel.Error });

logger.warn('Oops!', new Error('Something went wrong'));
// [app170723][2024-02-06T17:02:00.108Z][warn] Oops  Error: Something went wrong
```

Trim stack to few lines

```typescript
const logger = JamLogger.create({ trimStack: 2 });
logger.warn('Oops!', new Error('Spoiled the milk!'));
// [app170723][2024-02-06T17:13:59.496Z][warn] Oops! Spoiled the milk! Stack:
//   at Object.<anonymous> (...tsjam-logger/tests/logging/log.utils.spec.ts:10:15)
//   at Promise.then.completed (...tsjam-logger/node_modules/jest-circus/build/utils.js:298:28)
//   ...
```

**Note:** it's also possible to trim the stack to specified depth via `trimStack`

---

### Translators

There are some built-in translators for log data u could use while baking ur own logger:

- `jsonStringifyTranslator` – safely stringify log data `Logs.stringify(data)`
- `stringifyErrorStackTranslator` – fairly serialize Error correctly `Logs.stringifyError(error)`
- `sanitizeSensitiveTranslator` - sanitize sensitive fields defaults: `['password', 'token', 'secret', 'sessionId']`

**Note:** These translators applied either to a Single log call or to All logs by default, U could add Ur own too.

**Note:** U could add custom translator if U need one for all channels transformation.
Otherwise, it's recommended to process raw logEntry in Ur particular output channel.

---

## License

@tsjam/logger is [MIT licensed](https://github.com/am0wa/tsjam-logger/blob/main/LICENSE)

---

[TSJam Logger Documentation](https://am0wa.github.io/tsjam-logger)

@seeAlso

[TSJam API Documentation](https://am0wa.github.io/tsjam/modules.html)
