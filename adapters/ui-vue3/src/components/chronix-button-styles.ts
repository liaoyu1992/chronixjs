/**
 * Button stylesheet moved to the framework-
 * agnostic core (`packages/ui/src/button/button-styles.ts`) so all
 * 3 adapters (vue3 / vue2 / react) share the same CSS string and
 * injection function. This module re-exports for backwards
 * compatibility with the adapter API.
 */
export { CHRONIX_BUTTON_CSS, ensureChronixButtonStyles } from '@chronixjs/ui';
