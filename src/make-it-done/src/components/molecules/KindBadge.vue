<script setup lang="ts">
import type { ChecklistKind } from '../../types'
import AppBadge from '../atoms/AppBadge.vue'

defineProps<{
  kind: ChecklistKind
}>()

const colorMap: Record<ChecklistKind, string> = {
  'one-time': 'bg-zinc-800 text-zinc-400',
  'template':  'bg-violet-900/40 text-violet-300',
  'run':       'bg-blue-900/40 text-blue-300',
}
</script>

<template>
  <AppBadge pill :class="colorMap[kind]">{{ kind }}</AppBadge>
</template>
