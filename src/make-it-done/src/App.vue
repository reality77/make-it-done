<script setup lang="ts">
import { ref } from 'vue'
import type { Checklist, ChecklistKind } from './types'
import { useChecklists } from './composables/useChecklists'
import TabBar from './components/organisms/TabBar.vue'
import ChecklistForm from './components/organisms/ChecklistForm.vue'
import ActiveView from './components/templates/ActiveView.vue'
import TemplatesView from './components/templates/TemplatesView.vue'
import ArchiveView from './components/templates/ArchiveView.vue'

const activeTab = ref<'active' | 'templates' | 'archive'>('active')

const formState = ref<{
  checklist: Checklist | null
  defaultKind: 'one-time' | 'template'
} | null>(null)

const {
  activeChecklists,
  templates,
  archivedChecklists,
  getChecklist,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  toggleItem,
  archiveChecklist,
  unarchiveChecklist,
  runTemplate,
  addItem,
  updateItemText,
  removeItem,
} = useChecklists()

function openCreateForm(kind: 'one-time' | 'template'): void {
  formState.value = { checklist: null, defaultKind: kind }
}

function openEditForm(checklistId: string): void {
  const found = getChecklist(checklistId)
  if (!found) return
  formState.value = {
    checklist: found,
    defaultKind: found.kind === 'template' ? 'template' : 'one-time',
  }
}

function handleFormSave(payload: {
  id: string | null
  kind: ChecklistKind
  title: string
  items: { id: string | null; text: string; done: boolean }[]
}): void {
  if (payload.id === null) {
    createChecklist(payload.kind, payload.title, payload.items.map(({ text, done }) => ({ text, done })))
  } else {
    updateChecklist(payload.id, {
      title: payload.title,
      items: payload.items.map(i => ({
        id: i.id ?? crypto.randomUUID(),
        text: i.text,
        done: i.done,
      })),
    })
  }
  formState.value = null
}

function handleRunTemplate(checklistId: string): void {
  runTemplate(checklistId)
  activeTab.value = 'active'
}
</script>

<template>
  <header class="mb-8">
    <h1 class="text-2xl font-semibold tracking-tight text-zinc-100">make-it-done</h1>
  </header>

  <TabBar
    :activeTab="activeTab"
    :archiveCount="archivedChecklists.length"
    @change="activeTab = $event"
  />

  <main>
    <ActiveView
      v-if="activeTab === 'active'"
      :checklists="activeChecklists"
      @toggle-item="toggleItem"
      @add-item="addItem"
      @update-item-text="updateItemText"
      @remove-item="removeItem"
      @edit="openEditForm"
      @delete="deleteChecklist"
      @archive="archiveChecklist"
      @create="openCreateForm('one-time')"
    />

    <TemplatesView
      v-else-if="activeTab === 'templates'"
      :templates="templates"
      @toggle-item="toggleItem"
      @add-item="addItem"
      @update-item-text="updateItemText"
      @remove-item="removeItem"
      @edit="openEditForm"
      @delete="deleteChecklist"
      @run="handleRunTemplate"
      @create="openCreateForm('template')"
    />

    <ArchiveView
      v-else-if="activeTab === 'archive'"
      :checklists="archivedChecklists"
      @unarchive="unarchiveChecklist"
      @delete="deleteChecklist"
    />
  </main>

  <ChecklistForm
    v-if="formState !== null"
    :key="formState.checklist?.id ?? 'new'"
    :checklist="formState.checklist"
    :defaultKind="formState.defaultKind"
    @save="handleFormSave"
    @cancel="formState = null"
  />
</template>
