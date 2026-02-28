Review the product plan and report which user stories are implemented vs. still pending.

1. Read `docs/plan.md` to get the full list of epics and user stories (E1-US1 through E4-US2).
2. Inspect the source files under `src/make-it-done/src/` to determine what is actually implemented:
   - `src/types.ts` — data model
   - `src/composables/useChecklists.ts` — state and business logic
   - `src/components/` — UI components
   - `src/App.vue` — top-level wiring
3. For each user story, mark it as:
   - ✅ **Done** — fully implemented
   - 🚧 **Partial** — started but incomplete
   - ❌ **Missing** — not yet started
4. Output a concise table grouped by epic, then suggest which story to tackle next.
