import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'playwright-report/',
      'test-results/',
      'allure-report/',
      'allure-results/',
      '.claude/',
      'ci/local/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    // Config files live outside tsconfig, so type-aware rules cannot run on them.
    files: ['**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    // Playwright fixtures declare dependencies as `async ({}, use)` when they need none.
    files: ['fixtures/**/*.ts'],
    rules: { 'no-empty-pattern': 'off' },
  },
  {
    // Playwright rules where tests live; POM and utils are covered by the type-aware rules above.
    files: ['tests/**/*.ts', 'seed.spec.ts'],
    extends: [playwright.configs['flat/recommended']],
    rules: {
      'playwright/no-networkidle': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-element-handle': 'error',
      'playwright/no-page-pause': 'error',
      'playwright/expect-expect': [
        'error',
        { assertFunctionPatterns: ['^should.*', '^verify.*', '^expect.*'] },
      ],
      'playwright/no-conditional-in-test': 'warn',
      // A destructured fixture is requested for its setup/teardown, not always for its value.
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      // CLAUDE.md sanctions test.fixme() for an irreparably broken test.
      'playwright/no-skipped-test': 'off',
    },
  },
  {
    // The seed file is a scaffold the generator agent overwrites, not a real test.
    files: ['seed.spec.ts'],
    rules: { 'playwright/expect-expect': 'off' },
  },
  prettier,
);
