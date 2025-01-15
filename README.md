# @tsjam/logger

**Vanilla TypeScript Logger**

Not opinionated ts Logger with multiple output channels 🍰

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

```typescript
import { jamLogger } from '@tsjam/logger';

jamLogger.info('Hello Logger!');
// [app161125][2024-01-21T18:33:02.981Z][info] Hello Logger!
```

#### Tagged Logger

```typescript
const logger = jamLogger.tagged('user'); // child logger with added tags
logger.info('Greetings for', { name: 'Bob' });
// [app161125][2024-01-21T18:33:02.981Z][info][#user] Greetings for { name: 'Bob' }
```

single usage

```typescript
jamLogger.info({ tags: ['user', 'vip'] }, 'Greetings for', { name: 'John' });
// [app161125][2024-01-21T18:33:02.981Z][info][#user,#vip] Greetings for { name: 'John' }
```

#### Sensitive Fields Sanitization

```typescript
jamLogger.debug({ sanitize: ['password'] }, 'Logged in', { name: 'Bob', password: 'ABC' });
// [app170723][2024-02-06T16:47:56.398Z][debug] Logged in  { name: 'Bob', password: '***' }
```

**Note:** U could pass `Logger.sanitizeSensitiveTranslator` in createLogger to always sanitize sensitive fields by default. Yet it's more perf optimized to sanitize only when needed.

#### Stack Visibility (show / hide / trim)

Shown on Error payloads (same like Console.log);

```typescript
jamLogger.warn('Oops!', new Error('Something went wrong'));
// [app170723][2024-02-06T17:02:00.108Z][warn] Oops  Error: Something went wrong
//    at Object.<anonymous> (...tsjam-logger/tests/logging/log.util.spec.ts:10:49)
//    at Promise.then.completed (...tsjam-logger/node_modules/jest-circus/build/utils.js:298:28)
//    ...
```

Hide stack

```typescript
jamLogger.warn({ withStack: false }, 'Oops!', new Error('Something went wrong'));
// [app170723][2024-02-06T17:02:00.108Z][warn] Oops  Error: Something went wrong
```

**Note:** it could be set as default per instance in createLogger

Show stack for any call

```typescript
jamLogger.warn({ withStack: true }, 'Oops! Spoiled the milk!');
// [app170723][2024-02-06T17:13:59.496Z][warn] Oops! Spoiled the milk! Stack:
//   at Object.<anonymous> (...tsjam-logger/tests/logging/log.util.spec.ts:10:15)
//   at Promise.then.completed (...tsjam-logger/node_modules/jest-circus/build/utils.js:298:28)
//   ...
```

**Note:** it's also possible to just trim the stack to a certain depth via `trimStack`

---

## Usage <small>(bake ur Own Logger)</small>

```typescript
export const logger = createLogger({
  appId: `ioApp${Date.now()}`,
  channels: [...defaultOutputChannels /* { out: MyOutput } */], // default output channel is ConsoleOutput
  translator: jsonStringifyTranslator, // JSON.stringify All log data arguments
});
export const aiLogger = logger.taggeg('ai'); // child logger with #ai tag
```

**Note:** if U want to use ur own Output Channel or to Customize output format,
to get raw (not stringified) payload do not set translator.

### Custom Output Channel

```typescript
const myOutput: LogOutput = {
  write: ({ appId, date, level, message, data, context }: LogEntry) => {
    // do something with log payload
  },
};
//...
export const logger = createLogger({
  channels: [...defaultOutputChannels, { out: myOutput }, { out: myKibanaOutput }],
});
```

### Buffering

Use simplistic `BufferOutput` to buffer logs for any crash reporting or remote monitoring.
Do not forget to `flush` after report is sent.

```typescript
export const logBuffer = new BufferOutput(2000);
export const logger = createLogger({
  channels: [...defaultOutputChannels, { out: logBuffer }],
});
```

### Metadata

Metadata is especially useful for remote reporting & monitoring.

```typescript
import { createLogger, JamLogger } from '@tsjam/logger';
//...
export const logger = createLogger({
   metadata: { userId: 007 }, // use it however U wish in ur output channel next to log entry
});
//...
JamLogger.updateMeta(logger.appId, { userId: 546 }); // update metadata
```

### Translators

There are some built-in translators for log data u could use while baking ur own logger:

- `jsonStringifyTranslator` – `stringify` log data (used on `{ stringify: true }` in context)
- `stringifyErrorStackTranslator` – fairly serialize Error into string (used on Errors payload)
- `sanitizeSensitiveTranslator` - sanitize any sensitive fields  
   (used on `{ sanitize: ['password'] }` in context) defaults: `['password', 'token', 'secret', 'sessionId']`

**Note:** These translators applied either to a Single log call or to All logs by default, U could add Ur own too.

---

### License

@tsjam/logger is [MIT licensed](https://github.com/am0wa/tsjam-logger/blob/main/LICENSE)

---

@seeAlso

[TSJam API Documentation](https://am0wa.github.io/tsjam/modules.html)
