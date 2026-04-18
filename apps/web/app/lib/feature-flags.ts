/**
 * Build-time feature flags for the web -> @nouploads/core migration.
 *
 * Each flag toggles a single tool between its forked legacy implementation
 * (in <tool>.legacy.ts) and the new core-delegating implementation (in
 * <tool>.core.ts). The flipping happens at build time — bundlers strip the
 * unused branch, so there's no dead-code shipping cost.
 *
 * Migration workflow per tool:
 *   1. Add the entry below set to `true`, create <tool>.core.ts and
 *      <tool>.legacy.ts (the existing fork), update <tool>.ts to dispatch.
 *   2. Verify locally + ship to prod, soak briefly.
 *   3. Once stable, a follow-up PR removes the entry, deletes
 *      <tool>.legacy.ts, and inlines the core call directly into <tool>.ts.
 *
 * If a tool regresses in prod after migration, fastest fix is to flip the
 * flag to `false` and redeploy — no code changes needed. (Or `git revert`
 * the migration commit; either works.)
 *
 * See MIGRATION_TRACKER.md for which tool is in which phase.
 */
export const USE_CORE_IMPL = {} as const satisfies Record<string, boolean>;

/** Type-safe accessor with default false for missing entries. */
export function useCoreImpl(toolId: keyof typeof USE_CORE_IMPL): boolean {
	return USE_CORE_IMPL[toolId] ?? false;
}
