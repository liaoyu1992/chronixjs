import base from '@chronixjs/eslint-config/vue';

export default [
  ...base,
  {
    ignores: ['**/dist/**', '**/.turbo/**', '**/coverage/**', '**/node_modules/**'],
  },
];
