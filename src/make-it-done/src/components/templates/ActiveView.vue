<script setup lang="ts">
import type { Checklist } from '../../types'
import ChecklistCard from '../organisms/ChecklistCard.vue'
import AppButton from '../atoms/AppButton.vue'

defineProps<{
  checklists: Checklist[]
  focusChecklistId?: string | null
}>()

defineEmits<{
  (e: 'toggle-item', checklistId: string, itemId: string): void
  (e: 'add-item', checklistId: string, text: string): void
  (e: 'update-item-text', checklistId: string, itemId: string, text: string): void
  (e: 'remove-item', checklistId: string, itemId: string): void
  (e: 'edit', checklistId: string): void
  (e: 'delete', checklistId: string): void
  (e: 'archive', checklistId: string): void
  (e: 'create'): void
  (e: 'create-template'): void
}>()
</script>

<template>
  <div>
    <div class="flex justify-end items-center gap-2 mb-4">
      <AppButton variant="ghost" @click="$emit('create-template')">+ New Template</AppButton>
      <AppButton variant="primary" @click="$emit('create')">+ New Checklist</AppButton>
    </div>

    <p v-if="checklists.length === 0" class="text-center text-zinc-600 py-12 text-sm">
      No active checklists. Create one to get started.
    </p>

    <div v-else class="space-y-3">
      <ChecklistCard
        v-for="checklist in checklists"
        :key="checklist.id"
        :checklist="checklist"
        :auto-focus-add-item="focusChecklistId === checklist.id"
        @toggle-item="(cId, iId) => $emit('toggle-item', cId, iId)"
        @add-item="(cId, text) => $emit('add-item', cId, text)"
        @update-item-text="(cId, iId, text) => $emit('update-item-text', cId, iId, text)"
        @remove-item="(cId, iId) => $emit('remove-item', cId, iId)"
        @edit="(cId) => $emit('edit', cId)"
        @delete="(cId) => $emit('delete', cId)"
        @archive="(cId) => $emit('archive', cId)"
      />
    </div>
  </div>
</template>
