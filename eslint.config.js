import base from '@chronixjs/eslint-config/base';

export default [
  ...base,
  {
    ignores: ['**/dist/**', '**/.turbo/**', '**/coverage/**', '**/node_modules/**'],
  },
];
