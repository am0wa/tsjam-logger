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
- **metadata** (add any info to all log entries per appId e.g. `{ userId: 007 }`)
- **buffering** (useful for crash reporting)
- **sanitization** of sensitive fields (perf optimized, `{ sanitize: ['sessionId'] }`)
- **stack output** of any call (configurable,`{ withStack: true }`)
- **fully customizable** (use your own format)
- **fair Errors serialization** into string (check `JSON.stringify(new Error('Oops')); // {}`)
- **stringify** payload at any moment (`{ stringify: true }`)
- **zero third-party dependencies**

**Output example:**  
`[app161125][2024-01-21T18:33:02.981Z][info][#user] Logged In: { username: Bob, password: '***' }`

## Installation

```
npm install @tsjam/logger
```

---

## Usage <small>(Out of Box)</small>

`ConsoleOutput` is the default output channel.  
U could override it with Ur own ones...

```typescript
import { jamLogger } from '@tsjam/logger';

jamLogger.info('Hello Logger!');
// [app161125][2024-01-21T18:33:02.981Z][info] Hello Logger!
```

### Tagged Logger

U can tag child loggers to easily filter logs by tags.

```typescript
const logger = jamLogger.tagged('user'); // child logger with added tags
logger.info('Greetings for', { name: 'Bob' });
// [app161125][2024-01-21T18:33:02.981Z][info][#user] Greetings for { name: 'Bob' }
```

### Sensitive Fields Sanitization

```typescript
jamLogger.debug({ sanitize: ['password'] }, 'Logged in', { name: 'Bob', password: 'ABC' });
// [app170723][2024-02-06T16:47:56.398Z][debug] Logged in  { name: 'Bob', password: '***' }
```

**Note:** U could pass `sanitizeSensitiveTranslator` in createLogger to always sanitize sensitive fields by default. Yet it's more perf optimized to sanitize only when needed.

## Usage <small>(bake ur Own Logger)</small>

```typescript
export const logger = JamLogger.create({
  appId: `ioApp${Date.now()}`,
  channels: [...defaultOutputChannels /* { out: MyKibanaOutput } */], // default output channel is ConsoleOutput
});
export const aiLogger = logger.taggeg('ai'); // child logger with #ai tag
```

### Custom Output Channel

```typescript
const myOutput: LogOutput = {
  write: ({ appId, date, level, message, data, context }: LogEntry) => {
    // Format raw log entry and send it anywhere U wish
  },
};
//...
export const logger = JamLogger.create({
  channels: [...defaultOutputChannels, { out: myOutput }, { out: myKibanaOutput }],
});
```

### Buffering

Use simplistic `BufferOutput` to buffer logs for any crash reporting or remote monitoring.
Do not forget to `flush` after report is sent.

```typescript
export const logBuffer = new BufferOutput(2000);
export const logger = JamLogger.create({
  channels: [...defaultOutputChannels, { out: logBuffer }],
});
```

### Metadata

Metadata is especially useful for remote reporting & monitoring.

```typescript
import { JamLogger } from '@tsjam/logger';
//...
export const logger = JamLogger.create({
   metadata: { userId: 007 }, // use it however U wish in ur output channel next to log entry
});
//...
JamLogger.updateMeta(logger.appId, { userId: 546 }); // update metadata
```

## Usage <small>(with LogContext Per single Call)</small>

### Stack Visibility (show / hide / trim)

Shown on Error payloads (same like console.log);

```typescript
jamLogger.warn('Oops!', new Error('Something went wrong'));
// [app170723][2024-02-06T17:02:00.108Z][warn] Oops  Error: Something went wrong
//    at Object.<anonymous> (...tsjam-logger/tests/logging/log.util.spec.ts:10:49)
//    at Promise.then.completed (...tsjam-logger/node_modules/jest-circus/build/utils.js:298:28)
//    ...
```

Hide stack on Error payloads for specified levels

```typescript
const logger = JamLogger.create({ errorPayloadStackLevel: LogLevel.Error });
//...
logger.warn('Oops!', new Error('Something went wrong'));
// [app170723][2024-02-06T17:02:00.108Z][warn] Oops  Error: Something went wrong
```

Hide stack for single call

```typescript
jamLogger.warn({ withStack: false }, 'Oops!', new Error('Something went wrong'));
// [app170723][2024-02-06T17:02:00.108Z][warn] Oops  Error: Something went wrong
```

Show stack for single call (even without Error)

```typescript
jamLogger.warn({ withStack: true }, 'Oops! Spoiled the milk!');
// [app170723][2024-02-06T17:13:59.496Z][warn] Oops! Spoiled the milk! Stack:
//   at Object.<anonymous> (...tsjam-logger/tests/logging/log.util.spec.ts:10:15)
//   at Promise.then.completed (...tsjam-logger/node_modules/jest-circus/build/utils.js:298:28)
//   ...
```

**Note:** it's also possible to trim the stack to specified depth via `trimStack`

---

### Translators

There are some built-in translators for log data u could use while baking ur own logger:

- `jsonStringifyTranslator` – `stringify` log data (used on `{ stringify: true }` in context)
- `stringifyErrorStackTranslator` – fairly serialize Error into string (used on Errors payload)
- `sanitizeSensitiveTranslator` - sanitize any sensitive fields  
   (used on `{ sanitize: ['password'] }` in context) defaults: `['password', 'token', 'secret', 'sessionId']`

**Note:** These translators applied either to a Single log call or to All logs by default, U could add Ur own too.

**Note:** U could add custom translator if U need one for all channels transformation.
Otherwise, it's recommended to process raw logEntry in Ur particular output channel.

---

### License

@tsjam/logger is [MIT licensed](https://github.com/am0wa/tsjam-logger/blob/main/LICENSE)

---

@seeAlso

[TSJam API Documentation](https://am0wa.github.io/tsjam/modules.html)
