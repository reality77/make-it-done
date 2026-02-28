# make-it-done — Product Plan

## Product Overview

A lightweight checklist app where users can manage multiple checklists. Checklists are either **one-time** (auto-archive on completion) or **templates** (reusable — each "run" creates an independent checklist instance). Data is stored in `localStorage`. The UI is dark, modern, and concise.

---

## Epics & User Stories

### Epic 1 — One-Time Checklists

A one-time checklist is a finite project or task list. Once all items are checked off, it automatically moves to the archive.

| ID | User Story | Acceptance Criteria |
|----|-----------|---------------------|
| E1-US1 | As a user, I can create a one-time checklist with a title | A form lets me enter a title, add items, and submit. The checklist appears in the Active tab. |
| E1-US2 | As a user, I can add items to a checklist after creation | An "Add item" control inside the card lets me append new items inline. |
| E1-US3 | As a user, I can check and uncheck individual items | Clicking a checkbox toggles the item's done state immediately. |
| E1-US4 | As a user, I can edit the text of any item | The item text is an editable field; changes commit on blur or Enter. |
| E1-US5 | As a user, I can remove an item from a checklist | A remove button (visible on hover) deletes the item from the list. |
| E1-US6 | As a user, I can edit a checklist's title | An Edit action opens the form pre-filled with the current title and items. |
| E1-US7 | As a user, I can delete a checklist | A Delete action removes the checklist permanently after confirmation. |
| E1-US8 | As a user, a checklist auto-archives when all items are done | The moment the last item is checked, the card disappears from Active and appears in Archive. A checklist with zero items does not auto-archive. |
| E1-US9 | As a user, I can manually archive an active checklist | An "Archive" action moves the checklist to the Archive tab without requiring all items to be done. |
| E1-US10 | As a user, I can see progress at a glance | Each active card shows a "X / N done" counter in its header. |

---

### Epic 2 — Templates

A template is a reusable checklist definition. Templates are never archived. Each "run" creates a fresh, independent checklist instance.

| ID | User Story | Acceptance Criteria |
|----|-----------|---------------------|
| E2-US1 | As a user, I can create a template with a title and predefined items | The creation form lets me choose "Template" as the kind. The template appears in the Templates tab. |
| E2-US2 | As a user, I can run a template | A "Run" button on a template card creates a new checklist instance in the Active tab. All items start unchecked. |
| E2-US3 | As a user, run instances are labeled sequentially | Each run instance shows "Template Title — Run #N" so I can distinguish multiple runs. |
| E2-US4 | As a user, running a template does not modify it | After running, the template remains unchanged in the Templates tab. |
| E2-US5 | As a user, I can run the same template multiple times | Each run creates a new independent instance. Run count increments (Run #1, Run #2, …). |
| E2-US6 | As a user, I can edit a template's title and items | An Edit action updates the template definition. Existing run instances are not affected. |
| E2-US7 | As a user, I can delete a template | Deleting a template also removes all its run instances. |
| E2-US8 | As a user, template items can be checked during editing | Checking items in a template is safe — templates never auto-archive. |

---

### Epic 3 — Archive

The Archive stores completed or manually archived checklists. It is hidden by default and accessible via the Archive tab.

| ID | User Story | Acceptance Criteria |
|----|-----------|---------------------|
| E3-US1 | As a user, I can view all archived checklists | The Archive tab lists completed one-time checklists and completed run instances. |
| E3-US2 | As a user, archived checklists show when they were archived | Each archive card shows the date it was archived. |
| E3-US3 | As a user, I can restore an archived checklist to Active | A "Restore" action un-archives the item; it returns to the Active tab. |
| E3-US4 | As a user, I can permanently delete an archived checklist | A "Delete" action in the Archive tab removes the item permanently. |
| E3-US5 | As a user, the Archive tab shows a count badge | The tab label shows how many archived items exist so I know without switching. |

---

### Epic 4 — Persistence

| ID | User Story | Acceptance Criteria |
|----|-----------|---------------------|
| E4-US1 | As a user, my data persists across page refreshes | All checklists, items, and state are saved to `localStorage` and restored on load. |
| E4-US2 | As a user, corrupt or missing storage does not crash the app | If `localStorage` data is malformed, the app starts with an empty state. |

---

## Technical Implementation Plan

### Stack

- **Vue 3** — Composition API, `<script setup lang="ts">` throughout
- **TypeScript** — strict mode, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` (no enums)
- **Vite** — dev server + build
- **Tailwind CSS v4** — utility-first styling, no external component library

### Tailwind Setup

```bash
npm install tailwindcss @tailwindcss/vite
```

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
```

`src/style.css`:
```css
@import "tailwindcss";

body { @apply bg-zinc-950 text-zinc-100 min-h-screen; }
#app { @apply max-w-2xl mx-auto px-4 py-8; }
```

No `tailwind.config.js` needed for v4.

---

### Data Model (`src/types.ts`)

```typescript
type ChecklistKind = 'one-time' | 'template' | 'run'

interface ChecklistItem {
  id: string        // crypto.randomUUID()
  text: string
  done: boolean
}

interface Checklist {
  id: string
  kind: ChecklistKind
  title: string
  items: ChecklistItem[]
  archived: boolean
  createdAt: string          // ISO 8601
  archivedAt: string | null
  templateId: string | null  // set only when kind === 'run'
  runLabel: string | null    // e.g. "Deploy Checklist — Run #3"
}
```

One flat `Checklist[]` for all kinds. `kind` discriminates rendering and behaviour.

---

### State Management (`src/composables/useChecklists.ts`)

**State:** `const checklists = ref<Checklist[]>([])`

**Persistence:** `hydrate()` on init reads from `localStorage`. A deep `watch` calls `persist()` on every mutation. Storage key: `'make-it-done-v1'`.

**Computed views:**
| Name | Filter |
|------|--------|
| `activeChecklists` | `kind !== 'template'` and `!archived` |
| `templates` | `kind === 'template'` |
| `archivedChecklists` | `archived === true`, sorted newest first |
| `allChecklists` | raw `checklists.value` (for edit lookup) |

**Exposed functions:**

| Function | Description |
|----------|-------------|
| `createChecklist(kind, title, items)` | Appends a new checklist |
| `updateChecklist(id, patch)` | Updates title and/or items (items get fresh IDs) |
| `deleteChecklist(id)` | Deletes checklist; if template, also removes all its runs |
| `toggleItem(checklistId, itemId)` | Flips `done`, then runs auto-archive check |
| `archiveChecklist(id)` | Sets `archived = true` |
| `unarchiveChecklist(id)` | Sets `archived = false`, clears `archivedAt` |
| `runTemplate(templateId)` | Creates a `run` snapshot with fresh item IDs, all unchecked |
| `addItem(checklistId)` | Appends a blank item |
| `updateItemText(checklistId, itemId, text)` | Updates item text |
| `removeItem(checklistId, itemId)` | Removes an item |

**Auto-archive** (private `maybeAutoArchive`): fires at end of `toggleItem`. Skips templates. If `items.length > 0` and every item is done → sets `archived = true`, `archivedAt = now ISO`.

---

### Component Architecture (Atomic Design)

```
src/components/
  atoms/
    AppButton.vue         variants: primary | ghost | danger | icon
    AppInput.vue          v-model text input
    AppCheckbox.vue       v-model checkbox
    AppBadge.vue          kind label with colour per kind
  molecules/
    ItemRow.vue           checkbox + editable text + remove button
    TabItem.vue           single tab button
  organisms/
    ChecklistCard.vue     full interactive card
    ArchiveCard.vue       read-only archived card
    ChecklistForm.vue     modal create/edit form
    TabBar.vue            tab row
  templates/
    ActiveView.vue        active tab layout
    TemplatesView.vue     templates tab layout
    ArchiveView.vue       archive tab layout

App.vue                   page: owns global state, wires everything
src/composables/
  useChecklists.ts
src/types.ts
```

#### Visual Design Tokens (Tailwind)

| Token | Value |
|-------|-------|
| Page background | `bg-zinc-950` |
| Card background | `bg-zinc-900` |
| Card border | `border-zinc-800` |
| Primary text | `text-zinc-100` |
| Muted text | `text-zinc-400` |
| Accent (primary actions) | `bg-violet-600 hover:bg-violet-500` |
| Danger | `hover:text-red-400` |
| Badge — one-time | `bg-zinc-800 text-zinc-400` |
| Badge — template | `bg-violet-900/40 text-violet-300` |
| Badge — run | `bg-blue-900/40 text-blue-300` |
| Active tab indicator | `border-b-2 border-violet-500` |

---

### Component Interfaces

#### Atoms

**`AppButton.vue`**
```typescript
defineProps<{ variant: 'primary' | 'ghost' | 'danger' | 'icon'; type?: 'button' | 'submit' }>()
```

**`AppInput.vue`**
```typescript
defineProps<{ modelValue: string; placeholder?: string; autofocus?: boolean }>()
defineEmits<{ (e: 'update:modelValue', v: string): void; (e: 'blur'): void; (e: 'keydown', ev: KeyboardEvent): void }>()
```

**`AppCheckbox.vue`**
```typescript
defineProps<{ modelValue: boolean }>()
defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
```

**`AppBadge.vue`**
```typescript
defineProps<{ kind: ChecklistKind }>()
```

#### Molecules

**`ItemRow.vue`**
```typescript
defineProps<{ item: ChecklistItem; editable: boolean }>()
defineEmits<{
  (e: 'toggle'): void
  (e: 'update-text', text: string): void
  (e: 'remove'): void
}>()
// Internal: localText = ref(item.text), committed on blur + Enter
```

**`TabItem.vue`**
```typescript
defineProps<{ label: string; active: boolean; count?: number }>()
defineEmits<{ (e: 'select'): void }>()
```

#### Organisms

**`ChecklistCard.vue`**
```typescript
defineProps<{ checklist: Checklist }>()
defineEmits<{
  (e: 'toggle-item', checklistId: string, itemId: string): void
  (e: 'add-item', checklistId: string): void
  (e: 'update-item-text', checklistId: string, itemId: string, text: string): void
  (e: 'remove-item', checklistId: string, itemId: string): void
  (e: 'edit', checklistId: string): void
  (e: 'delete', checklistId: string): void
  (e: 'run', checklistId: string): void
  (e: 'archive', checklistId: string): void
}>()
// Local: isExpanded = ref(true)
```

**`ArchiveCard.vue`**
```typescript
defineProps<{ checklist: Checklist }>()
defineEmits<{
  (e: 'unarchive', checklistId: string): void
  (e: 'delete', checklistId: string): void
}>()
// Local: isExpanded = ref(false)
```

**`ChecklistForm.vue`** (modal)
```typescript
defineProps<{ checklist: Checklist | null; defaultKind: 'one-time' | 'template' }>()
defineEmits<{
  (e: 'save', payload: {
    id: string | null
    kind: ChecklistKind
    title: string
    items: Omit<ChecklistItem, 'id'>[]
  }): void
  (e: 'cancel'): void
}>()
```
Backdrop: `fixed inset-0 bg-black/60 flex items-center justify-center z-50`.
`@click.self` → cancel. `keydown.esc` on window → cancel.

**`TabBar.vue`**
```typescript
defineProps<{ activeTab: 'active' | 'templates' | 'archive'; archiveCount: number }>()
defineEmits<{ (e: 'change', tab: 'active' | 'templates' | 'archive'): void }>()
```

#### Templates

**`ActiveView.vue`**
```typescript
defineProps<{ checklists: Checklist[] }>()
// Emits: toggle-item, add-item, update-item-text, remove-item, edit, delete, archive, create
```

**`TemplatesView.vue`**
```typescript
defineProps<{ templates: Checklist[] }>()
// Emits: toggle-item, add-item, update-item-text, remove-item, edit, delete, run, create
```

**`ArchiveView.vue`**
```typescript
defineProps<{ checklists: Checklist[] }>()
// Emits: unarchive, delete
```

---

### App.vue State

```typescript
const activeTab = ref<'active' | 'templates' | 'archive'>('active')
const formState = ref<{
  checklist: Checklist | null
  defaultKind: 'one-time' | 'template'
} | null>(null)
```

All composable calls are wired here; views and cards emit upward.

---

### Implementation Order

1. `npm install tailwindcss @tailwindcss/vite` + `vite.config.ts`
2. `src/types.ts`
3. `src/composables/useChecklists.ts`
4. `src/style.css`
5. Atoms: `AppButton`, `AppCheckbox`, `AppInput`, `AppBadge`
6. Molecules: `ItemRow`, `TabItem`
7. Organisms: `ChecklistCard`, `ArchiveCard`, `ChecklistForm`, `TabBar`
8. Templates: `ActiveView`, `TemplatesView`, `ArchiveView`
9. `src/App.vue`
10. Delete `src/components/HelloWorld.vue`
11. `npm run build` — must pass with zero TypeScript errors

---

### Verification Checklist

- [x] `npm run build` passes with zero errors
- [ ] Create a one-time checklist → check all items → card moves to Archive automatically
- [ ] Create a template → Run → run instance appears in Active, template stays in Templates
- [ ] Run same template again → label shows Run #2
- [ ] Archive tab → Restore → card returns to Active
- [ ] Page refresh → all data persists
- [ ] Delete a template → its runs are also removed
- [ ] Corrupt `localStorage` → app starts with empty state, no crash
