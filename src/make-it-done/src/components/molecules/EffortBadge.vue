<script setup lang="ts">
import type { TaskEffort } from '../../types'
import AppBadge from '../atoms/AppBadge.vue'

defineProps<{
  effort: TaskEffort
}>()

const colorMap: Record<TaskEffort, string> = {
  small:  'text-emerald-400 bg-emerald-950',
  medium: 'text-blue-400 bg-blue-950',
  large:  'text-orange-400 bg-orange-950',
}
</script>

<template>
  <AppBadge :class="colorMap[effort]">{{ effort }}</AppBadge>
</template>
