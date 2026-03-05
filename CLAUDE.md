# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`get-it-done` is a Vue 3 + TypeScript + Vite + Tailwind CSS v4 checklist app. It uses the Composition API with `<script setup>` syntax throughout. Components follow **Atomic Design** (atoms → molecules → organisms → templates → page).

## Project Root

The Vite app lives at `src/get-it-done/` — **all commands must be run from there**:

```bash
cd src/get-it-done
npm run dev        # Start dev server with HMR
npm run build      # Type-check with vue-tsc, then bundle with Vite
npm run preview    # Preview the production build locally
```

No lint or test commands are configured yet.

## Architecture

**Entry flow:** `index.html` → `src/main.ts` → `src/App.vue`

- **State** lives in `src/composables/useChecklists.ts` — a module-singleton composable backed by `localStorage`
- **Types** are defined in `src/types.ts` (no enums — string literal union types only)
- **Components** follow Atomic Design under `src/components/`:
  - `atoms/` — `AppButton`, `AppInput`, `AppCheckbox`, `AppBadge`
  - `molecules/` — `ItemRow`, `TabItem`
  - `organisms/` — `ChecklistCard`, `ArchiveCard`, `ChecklistForm`, `TabBar`
  - `templates/` — `ActiveView`, `TemplatesView`, `ArchiveView`
- **Styling** uses Tailwind CSS v4 — `@import "tailwindcss"` in `src/style.css`, no config file needed

## TypeScript

Strict mode is enabled (`strict: true`, `noUnusedLocals`, `noUnusedParameters`). The `erasableSyntaxOnly` option is set — use string literal union types instead of enums or namespaces.

## Product Plan

Full epics, user stories, and technical design are in `docs/plan.md`.
