/**@see https://kulshekhar.github.io/ts-jest/docs/guides/esm-support*/
import baseConfig from '@tsjam/jest-config-recommended/jest.config.mjs';

console.log('Jest ESM Windmills...', baseConfig);

/** @type {import('jest').Config} */
const config = {
  ...baseConfig,
  rootDir: './',
  // @see https://jestjs.io/docs/configuration#transformignorepatterns-arraystring
  transformIgnorePatterns: [], // transform esm
  setupFiles: [],
};

export default config;
