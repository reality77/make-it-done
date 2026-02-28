<script setup lang="ts">
import type { Checklist } from '../../types'
import ArchiveCard from '../organisms/ArchiveCard.vue'

defineProps<{
  checklists: Checklist[]
}>()

defineEmits<{
  (e: 'unarchive', checklistId: string): void
  (e: 'delete', checklistId: string): void
}>()
</script>

<template>
  <div>
    <p v-if="checklists.length === 0" class="text-center text-zinc-600 py-12 text-sm">
      Nothing archived yet.
    </p>

    <div v-else class="space-y-3">
      <ArchiveCard
        v-for="checklist in checklists"
        :key="checklist.id"
        :checklist="checklist"
        @unarchive="(cId) => $emit('unarchive', cId)"
        @delete="(cId) => $emit('delete', cId)"
      />
    </div>
  </div>
</template>
