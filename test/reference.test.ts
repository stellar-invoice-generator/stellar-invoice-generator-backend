/**
 * @file apps/api/test/reference.test.ts
 * @summary Unit tests for short reference generator.
 * 
 * Test Scenarios:
 *   1. Byte length enforcement: Reference string is strictly <= 28 bytes under UTF-8 encoding.
 *   2. Uniqueness & entropy: 10,000 generated references produce 0 collisions.
 *   3. Ambiguous character exclusion: Does not contain confusing chars like 0, O, I, 1.
 * 
 * Interacting Modules:
 *   - Tests utils/reference.util.ts.
 */

