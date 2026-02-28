Scaffold a new Vue 3 component for the make-it-done app following its conventions.

The user will specify a component name and atomic design layer. If not provided, ask for them.

## Rules

- Place the file at `src/make-it-done/src/components/<layer>/<ComponentName>.vue`
- Use `<script setup lang="ts">` with `defineProps` and `defineEmits` (typed generics, not runtime declarations)
- No enums — use string literal union types only (TypeScript `erasableSyntaxOnly` is enabled)
- Style with Tailwind CSS v4 utility classes only — no `<style>` blocks unless unavoidable
- Follow the design tokens from `docs/plan.md`:
  - Card bg: `bg-zinc-900`, border: `border border-zinc-800`
  - Primary text: `text-zinc-100`, muted: `text-zinc-400`
  - Accent: `bg-violet-600 hover:bg-violet-500`
  - Danger: `hover:text-red-400`

## Layer guidelines

- **atoms/** — single-responsibility UI primitives (AppButton, AppInput, AppCheckbox, AppBadge)
- **molecules/** — small compositions of atoms (ItemRow, TabItem)
- **organisms/** — feature-complete sections (ChecklistCard, ArchiveCard, ChecklistForm, TabBar)
- **templates/** — full view layouts wired to composables (ActiveView, TemplatesView, ArchiveView)

After creating the file, confirm the path and show the component's props/emits interface.
