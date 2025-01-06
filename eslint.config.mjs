import jamEslint from '@tsjam/eslint-config-recommended';

console.info('Linting..🕵️', jamEslint.configs.recommendedTS);

/**
 * @see https://typescript-eslint.io/users/configs/#recommended
 */
export default [
  {
    ignores: ['node_modules', 'lib', 'dist', "**/*.config.js"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...jamEslint.configs.recommendedTS,
  {
    rules: {
      'no-param-reassign': 'error',
      '@typescript-eslint/unbound-method': 'error',
      '@typescript-eslint/default-param-last': 'warn',
      '@typescript-eslint/restrict-plus-operands': 'warn',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          filter: {
            regex: '^_',
            match: true,
          },
        },
      ],
    },
  },
];
