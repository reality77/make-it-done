<script setup lang="ts">
import { ref } from 'vue'
import type { ChecklistItem } from '../../types'
import AppCheckbox from '../atoms/AppCheckbox.vue'

const props = defineProps<{
  item: ChecklistItem
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'update-text', text: string): void
  (e: 'remove'): void
  (e: 'start-edit'): void
}>()

const isEditing = ref(false)
const editText = ref('')

const vFocus = {
  mounted(el: Element) {
    const input = el as HTMLInputElement
    input.focus()
    input.select()
  },
}

function startEdit(): void {
  isEditing.value = true
  editText.value = props.item.text
  emit('start-edit')
}

function confirmEdit(): void {
  const text = editText.value.trim()
  if (text) emit('update-text', text)
  isEditing.value = false
  editText.value = ''
}

function cancelEdit(): void {
  isEditing.value = false
  editText.value = ''
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') { e.preventDefault(); confirmEdit() }
  else if (e.key === 'Escape') { cancelEdit() }
}

defineExpose({ cancelEdit })
</script>

<template>
  <div class="flex items-center gap-2 py-1 group">
    <AppCheckbox :model-value="item.done" @update:model-value="$emit('toggle')" />

    <input
      v-if="isEditing"
      v-focus
      v-model="editText"
      class="bg-transparent border-b border-zinc-700 focus:border-violet-500 outline-none text-zinc-100 text-sm py-0.5 transition-colors flex-1"
      @keydown="onKeydown"
      @blur="confirmEdit"
    />

    <span
      v-else
      class="flex-1 cursor-text min-w-0 truncate"
      :class="item.done ? 'line-through text-zinc-600' : 'text-zinc-300'"
      @click="startEdit"
    >
      {{ item.text }}
    </span>

    <button
      class="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all text-xs shrink-0 cursor-pointer"
      @click="$emit('remove')"
    >
      ✕
    </button>
  </div>
</template>
