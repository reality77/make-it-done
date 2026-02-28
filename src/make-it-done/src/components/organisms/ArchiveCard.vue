<script setup lang="ts">
import { ref } from 'vue'
import type { Checklist } from '../../types'
import AppBadge from '../atoms/AppBadge.vue'
import AppButton from '../atoms/AppButton.vue'

defineProps<{
  checklist: Checklist
}>()

defineEmits<{
  (e: 'unarchive', checklistId: string): void
  (e: 'delete', checklistId: string): void
}>()

const isExpanded = ref(false)

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4">
    <!-- Header -->
    <div class="flex items-center gap-2 min-w-0">
      <button
        class="text-zinc-700 hover:text-zinc-400 transition-colors text-xs w-4 shrink-0 text-left"
        @click="isExpanded = !isExpanded"
      >
        {{ isExpanded ? '▾' : '▸' }}
      </button>

      <span class="text-sm text-zinc-500 truncate flex-1">
        {{ checklist.runLabel ?? checklist.title }}
      </span>

      <AppBadge :kind="checklist.kind" />

      <span v-if="checklist.archivedAt" class="text-xs text-zinc-700 shrink-0">
        {{ formatDate(checklist.archivedAt) }}
      </span>

      <div class="flex items-center gap-1 shrink-0">
        <AppButton variant="ghost" @click="$emit('unarchive', checklist.id)">Restore</AppButton>
        <AppButton variant="danger" @click="$emit('delete', checklist.id)">Delete</AppButton>
      </div>
    </div>

    <!-- Body (collapsed by default) -->
    <div v-if="isExpanded && checklist.items.length > 0" class="mt-3 pl-5 space-y-1">
      <div
        v-for="item in checklist.items"
        :key="item.id"
        class="flex items-center gap-2 py-0.5"
      >
        <input
          type="checkbox"
          :checked="item.done"
          disabled
          class="accent-violet-500 w-4 h-4 shrink-0 opacity-40 cursor-not-allowed"
        />
        <span
          class="text-sm text-zinc-600"
          :class="item.done ? 'line-through' : ''"
        >
          {{ item.text }}
        </span>
      </div>
    </div>
  </div>
</template>
