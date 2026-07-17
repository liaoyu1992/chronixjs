import { defineConfig } from 'tsup';
import { copyFileSync } from 'fs';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  treeshake: true,
  minify: false,
  splitting: false,
  external: ['vue', '@chronixjs/table', '@chronixjs/cx-kit'],
  onSuccess: () => {
    copyFileSync('../../node_modules/@chronixjs/table/dist/styles.css', 'dist/styles.css');
  },
});
