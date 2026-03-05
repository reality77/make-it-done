<script setup lang="ts">
defineProps<{
  pill?: boolean
}>()
</script>

<template>
  <span
    class="text-xs px-1.5 py-0.5 font-medium shrink-0"
    :class="pill ? 'rounded-full px-2' : 'rounded'"
  >
    <slot />
  </span>
</template>
