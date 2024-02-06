# @tsjam/logger

**Vanilla TypeScript Logger**

Not opinionated ts Logger with multiple output channels.

**Advantages:**

- **appId** (distinguish log between multiple instances)
- **tags** support (tag child loggers, find and filter certain logs super-fast)
- **multiple channels** output (add ur own output: e.g. parallel remote monitoring)
- **buffering** (useful for crash reporting)
- **sanitization** of sensitive fields (perf optimized, add `{ sanitize: ['sessionId'] }`)
- **stack output** of any call (configurable, add `{ withStack: true }`)
- **fully customizable** (use your own format)
- **fair Errors serialization** into string (check `JSON.stringify(new Error('Oops')); // {}`)
- **strigify** payload at any moment (add `{ stringify: true }`)
- **zero third-party dependencies**

**Output example:**  
`[app1611253982848][2024-01-21T18:33:02.981Z][info][#user] Logged In: { username: Bob, password: '***' }`

### Installing

```
npm install @tsjam/logger
```

---

## Usage <small>(Out of Box)</small>

```typescript
import { jamLogger } from '@tsjam/logger';

jamLogger.info('Hello Logger!');
// [app1611253982848][2024-01-21T18:33:02.981Z][info] Hello Logger!
```

#### Tagged Logger

```typescript
const logger = jamLogger.tagged('user'); // child logger with added tags
logger.info('Greetings for', { name: 'Bob' });
// [app1611253982848][2024-01-21T18:33:02.981Z][info][#user] Greetings for { name: 'Bob' }
```

single usage

```typescript
jamLogger.info({ tags: ['#user', '#vip'] }, 'Greetings for', { name: 'John' });
// [app1611253982848][2024-01-21T18:33:02.981Z][info][#user,#vip] Greetings for { name: 'John' }
```

#### Sensitive Fields Sanitization

```typescript
jamLogger.debug({ sanitize: ['password'] }, 'Logged in', { name: 'Bob', password: 'ABC' });
// [app1707238076394][2024-02-06T16:47:56.398Z][debug] Logged in  { name: 'Bob', password: '***' }
```

#### Stack Visibility (show / hide / trim)

Shown on Error payloads (same like Console.log);

```typescript
jamLogger.warn('Oops!', new Error('Something went wrong'));
// [app1707238920096][2024-02-06T17:02:00.108Z][warn] Oops  Error: Something went wrong
//    at Object.<anonymous> (...tsjam-logger/tests/logging/log.util.spec.ts:10:49)
//    at Promise.then.completed (...tsjam-logger/node_modules/jest-circus/build/utils.js:298:28)
//    ...
```

Hide stack

```typescript
jamLogger.warn({ withStack: false }, 'Oops!', new Error('Something went wrong'));
// [app1707238920096][2024-02-06T17:02:00.108Z][warn] Oops  Error: Something went wrong
```

Show stack for any call

```typescript
jamLogger.warn({ withStack: true }, 'Oops! Spoiled the milk!');
// [app1707239639479][2024-02-06T17:13:59.496Z][warn] Oops! Spoiled the milk! Stack:
// at Object.<anonymous> (...tsjam-logger/tests/logging/log.util.spec.ts:10:15)
// at Promise.then.completed (...tsjam-logger/node_modules/jest-circus/build/utils.js:298:28)
// ...
```

**Note:** it's also possible to just trim the stack to a certain depth via `trimStack`

---

## Usage <small>(bake ur Own Logger)</small>

```typescript
export const logger = createLogger({
  appId: `ioApp${Date.now()}`,
  channels: [...Logger.getDefaultChannels() /* { out: MyOutput } */], // default output channel is ConsoleOutput
  translator: Logger.jsonStringifyTranslator, // JSON.stringify All log data arguments
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
```

### Buffering

Use simplistic `BufferOutput` to buffer logs for any crash reporting or remote monitoring.
Do not forget to `flush` after report is sent.

```typescript
export const logBuffer = new BufferOutput(2000);
export const logger = createLogger({
  channels: [...Logger.getDefaultChannels(), { out: logBuffer }],
});
```

### Translators

There are some built-in translators for log data u could use while baking ur own logger:

- `Logger.jsonStringifyTranslator` – JSON.stringify All log data arguments (used when `{ stringify: true }` is passed in context)
- `Logger.stringifyErrorStackTranslator` – Fairly serialize Error into string (used by default on Errors payload)
-

---

@seeAlso

[TSJam API Documentation](https://am0wa.github.io/tsjam/modules.html)
