<script setup lang="ts">
import type { Checklist } from '../../types'
import ChecklistCard from '../organisms/ChecklistCard.vue'
import AppButton from '../atoms/AppButton.vue'

defineProps<{
  templates: Checklist[]
  focusChecklistId?: string | null
}>()

defineEmits<{
  (e: 'toggle-item', checklistId: string, itemId: string): void
  (e: 'add-item', checklistId: string, text: string): void
  (e: 'update-item-text', checklistId: string, itemId: string, text: string): void
  (e: 'remove-item', checklistId: string, itemId: string): void
  (e: 'edit', checklistId: string): void
  (e: 'delete', checklistId: string): void
  (e: 'run', checklistId: string): void
  (e: 'create'): void
}>()
</script>

<template>
  <div>
    <div class="flex justify-end mb-4">
      <AppButton variant="primary" @click="$emit('create')">+ New Template</AppButton>
    </div>

    <p v-if="templates.length === 0" class="text-center text-zinc-600 py-12">
      No templates yet. Create one to reuse a checklist multiple times.
    </p>

    <div v-else class="space-y-3">
      <ChecklistCard
        v-for="template in templates"
        :key="template.id"
        :checklist="template"
        :auto-focus-add-item="focusChecklistId === template.id"
        @toggle-item="(cId, iId) => $emit('toggle-item', cId, iId)"
        @add-item="(cId, text) => $emit('add-item', cId, text)"
        @update-item-text="(cId, iId, text) => $emit('update-item-text', cId, iId, text)"
        @remove-item="(cId, iId) => $emit('remove-item', cId, iId)"
        @edit="(cId) => $emit('edit', cId)"
        @delete="(cId) => $emit('delete', cId)"
        @run="(cId) => $emit('run', cId)"
      />
    </div>
  </div>
</template>
