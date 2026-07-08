# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`@tsjam/logger` — a zero-dependency, vanilla TypeScript logger library with multiple output channels, published to npm as an ESM package (`"type": "module"`). All source imports use explicit `.js` extensions (NodeNext module resolution).

## Commands

- **Build:** `npm run build` (runs `tsc -b src/tsconfig.json`, emits to `lib/`)
- **Test:** `npm test` (Jest via SWC, config in `jest.config.mjs`; tests live in `tests/`, named `*.spec.ts`)
- **Single test:** `npx jest --config jest.config.mjs tests/logging/logger.spec.ts` (or `-t 'test name'`)
- **Lint:** `npm run lint` (ESLint over `src` only)
- **Format:** `npm run format` (Prettier, config from `@tsjam/lint-config`)
- **Clean:** `npm run clean` (removes `lib/`)

Husky pre-commit runs lint-staged (eslint --fix + prettier on staged files). `prepublishOnly` runs clean + build + test.

Note: `tests/` has its own `tsconfig.json` using `module: ESNext` / `moduleResolution: bundler` — Jest crashes with NodeNext, so don't "align" it with the src config.

## Architecture

Everything lives in `src/logging/`, re-exported through `src/index.ts` → `src/logging/index.ts`. The flow of a log call:

1. **`JamLogger` (`logger.ts`)** — the core class. `JamLogger.create(config)` is the factory (instances are memoized per config object via a WeakMap). `logMessage()` is the pipeline: it extracts the message string, finds a `LogMeta` object among the args (detected via a `Symbol.for('logs.meta')` signature — see `log.meta.ts`), applies error-stack stringification (governed by `errorStackLevel`/`trimStack` in `StackConfig`), applies the configured `LogTranslator`, then builds a `LogEntry` and distributes it.
2. **`LogOutputRegistry` (`output.registry.ts`)** — holds `LogOutputChannel`s (an output + optional minimum `LogLevel`) and resolves which outputs receive an entry by severity, with a per-level cache.
3. **`LogOutput` implementations** — `ConsoleOutput` (default channel, formats `[appId][ISO date][level][#tags] message`) and `BufferOutput` (ring buffer for crash reporting). Custom outputs just implement `write(entry: LogEntry)`.

Key concepts:

- **Tagged child loggers**: `logger.tagged('user')` returns a lightweight `Logger` object (not a `JamLogger` instance) that shares appId/channels and merges tags (unique, sorted).
- **Metadata**: per-appId metadata is stored in a static `JamLogger.metaMap` and merged with per-call `LogMeta` args. `LogMeta.bake()` "signs" plain objects with the non-enumerable symbol so `logMessage` can distinguish meta from ordinary payload data.
- **Translators** (`src/logging/translators/`): pure `LogMessage → LogMessage` mappers (json-stringify, stringify-error, sanitize-sensitive). One can be set globally via `LoggerConfig.translator`; `Logs` utilities (`log.utils.ts`) expose them for per-call use (e.g. `Logs.sanitize(...)`).
- **`LogLevel`/`LogLevels` (`level.enum.ts`)**: string enum with severity ordering Debug < Info < Warn < Error < Silent; channels output entries at or above their configured level.

Public API surface is whatever `src/logging/index.ts` re-exports — check it before assuming a symbol is public (e.g. translators and `LogOutputRegistry` are not re-exported there).
