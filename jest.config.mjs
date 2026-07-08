/**@see https://github.com/swc-project/jest*/
import baseConfig from '@tsjam/swc-jest-config-recommended/jest.config.mjs';

/** @type {import('jest').Config} */
const config = {
  ...baseConfig,
  rootDir: './',
};

export default config;