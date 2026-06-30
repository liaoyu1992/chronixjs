import type { RuleItem } from 'async-validator';

/**
 * A single validation rule applied to a form field.
 *
 * re-exports `async-validator`'s `RuleItem` as
 * chronix-ui's canonical rule type. chronix-ui ships no validation
 * algorithms of its own — `async-validator` is the industry standard
 * and is kept as a peer dependency (see `package.json:peerDependencies`).
 *
 * Common rule shapes:
 *
 * ```ts
 * { required: true, message: 'Name is required' }
 * { type: 'string', min: 3, max: 50, message: 'Name must be 3-50 chars' }
 * { type: 'email', message: 'Invalid email' }
 * { pattern: /^[A-Z]/, message: 'Must start with capital letter' }
 * {
 *   asyncValidator: async (rule, value) => {
 *     const taken = await checkUsernameTaken(value);
 *     if (taken) throw new Error('Username already taken');
 *   },
 * }
 * ```
 *
 * The full rule schema is documented at the async-validator repository.
 * chronix-ui makes no additions or restrictions; whatever async-validator
 * accepts, `ValidationRule` accepts.
 */
export type ValidationRule = RuleItem;
