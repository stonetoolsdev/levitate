<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { defaultTemplates } from '~/helpers/defaultTemplates'

interface TemplateSet {
  id: string
  name: string
  isDefault: boolean
  templates: Record<string, { subject: string; body_plain: string; body_html: string }>
}

const toast = useToast()
const twigExample = "{% if location %}Location: {{ location }}{% endif %}"

const TIMINGS = [
  { key: '2_weeks', label: '2 weeks before' },
  { key: '1_week', label: '1 week before' },
  { key: '3_days', label: '3 days before' },
  { key: 'day_of', label: 'Day of' },
]

const variableReference = [
  { name: '{{ event_name }}', description: 'The event title' },
  { name: '{{ date }}', description: 'Full formatted date, e.g. Friday, May 9, 2025' },
  { name: '{{ time }}', description: 'Start time, e.g. 9:00 AM' },
  { name: '{{ end_time }}', description: 'End time' },
  { name: '{{ location }}', description: 'Location or link' },
  { name: '{{ duration }}', description: 'Duration, e.g. 1.5 hours' },
  { name: '{{ organizer }}', description: 'Organizer name' },
  { name: '{{ reply_to }}', description: 'Reply-to email address' },
  { name: '{{ description }}', description: 'Event description' },
  { name: '{{ days_until }}', description: 'Days until event (14, 7, 3, or 0)' },
  { name: '{{ timing_label }}', description: '"2 weeks before", "1 week before", etc.' },
]



const sets = useLocalStorage<TemplateSet[]>('templateSets', [])
const editingSet = ref<TemplateSet | null>(null)

function blankModalForm() {
  return {
    name: '',
    isDefault: false,
    templates: Object.fromEntries(
      TIMINGS.map(t => [t.key, { ...defaultTemplates[t.key] }])
    ) as Record<string, { subject: string; body_plain: string; body_html: string }>,
  }
}

const modalOpen = ref(false)
const modalForm = reactive(blankModalForm())
function openCreateModal() {
  editingSet.value = null
  Object.assign(modalForm, blankModalForm())
  modalOpen.value = true
}
function openEditModal(set: TemplateSet) {
  editingSet.value = set
  modalForm.name = set.name
  modalForm.isDefault = set.isDefault
  modalForm.templates = JSON.parse(JSON.stringify(set.templates))
  modalOpen.value = true
}

function resetToDefault(timingKey: string) {
  modalForm.templates[timingKey] = { ...defaultTemplates[timingKey] }
}

function saveSet() {
  if (!modalForm.name.trim()) return

  if (editingSet.value) {
    const idx = sets.value.findIndex(s => s.id === editingSet.value!.id)
    if (idx !== -1) {
      sets.value[idx] = {
        ...sets.value[idx],
        name: modalForm.name,
        isDefault: modalForm.isDefault,
        templates: JSON.parse(JSON.stringify(modalForm.templates)),
      }
    }
  } else {
    sets.value.push({
      id: crypto.randomUUID(),
      name: modalForm.name,
      isDefault: modalForm.isDefault,
      templates: JSON.parse(JSON.stringify(modalForm.templates)),
    })
  }

  if (modalForm.isDefault) {
    const thisId = editingSet.value?.id ?? sets.value[sets.value.length - 1].id
    sets.value.forEach(s => { s.isDefault = s.id === thisId })
  }

  modalOpen.value = false
  toast.add({ title: editingSet.value ? 'Template set updated' : 'Template set created', duration: 2000 })
}

function makeDefault(id: string) {
  sets.value.forEach(s => { s.isDefault = s.id === id })
  toast.add({ title: 'Default updated', duration: 2000 })
}

const deleteModalOpen = ref(false)
const deletingSet = ref<TemplateSet | null>(null)
function confirmDelete(set: TemplateSet) {
  deletingSet.value = set
  deleteModalOpen.value = true
}
function deleteSet() {
  sets.value = sets.value.filter(s => s.id !== deletingSet.value?.id)
  deleteModalOpen.value = false
  toast.add({ title: 'Template set deleted', duration: 2000 })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <UContainer class="py-10">

      <TemplatesHeader
        @templateheader:newtemplateset:click="openCreateModal" />

      <!-- Empty state -->
      <div v-if="!sets.length"
        class="flex flex-col items-center justify-center py-20 text-center text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
        <UIcon name="i-lucide-mail"
          class="w-10 h-10 mb-3 opacity-40" />
        <p class="text-sm font-medium">No template sets yet</p>
        <p class="text-xs mt-1">Create one to override the built-in
          defaults.</p>
        <UButton @click="openCreateModal" size="sm" class="mt-4"
          variant="outline">Create template set</UButton>
      </div>

      <!-- Template set list -->
      <div v-else class="space-y-4">
        <UCard v-for="set in sets" :key="set.id">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ set.name }}</p>
                <UBadge v-if="set.isDefault" color="primary"
                  variant="soft" size="xs">Default</UBadge>
              </div>
              <div class="flex gap-2">
                <UButton v-if="!set.isDefault"
                  @click="makeDefault(set.id)" variant="ghost"
                  size="xs" color="neutral">
                  Set as default
                </UButton>
                <UButton @click="openEditModal(set)" variant="ghost"
                  size="xs" icon="i-lucide-pencil" color="neutral" />
                <UButton @click="confirmDelete(set)" variant="ghost"
                  size="xs" icon="i-lucide-trash-2" color="error" />
              </div>
            </div>
          </template>

          <!-- Preview of timing slots -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div v-for="timing in TIMINGS" :key="timing.key"
              class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <p
                class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {{ timing.label }}</p>
              <p
                class="text-xs text-gray-700 dark:text-gray-300 truncate">
                {{ set.templates?.[timing.key]?.subject || '—' }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Variable reference -->
      <UCard class="mt-8">
        <template #header>
          <p
            class="font-medium text-sm text-gray-900 dark:text-white">
            Available Twig variables</p>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          <div v-for="tag in variableReference" :key="tag.name"
            class="flex items-start gap-3">
            <code
              class="text-xs text-primary-600 dark:text-primary-400 font-mono whitespace-nowrap mt-0.5">{{
                tag.name }}</code>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{
              tag.description }}</span>
          </div>
        </div>
        <div
          class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p class="text-xs text-gray-400">
            You can use Twig logic too, e.g.
            <code
              class="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{{
                twigExample }}</code>
          </p>
        </div>
      </UCard>

    </UContainer>

    <!-- Create / Edit modal -->
    <UModal v-model:open="modalOpen"
      :title="editingSet ? 'Edit template set' : 'New template set'"
      fullscreen>
      <template #body>
        <div class="space-y-6 p-1">
          <UFormField label="Template set name" required>
            <UInput v-model="modalForm.name"
              placeholder="e.g. Formal, Casual, Conference"
              class="w-full" />
          </UFormField>

          <UCheckbox v-model="modalForm.isDefault"
            label="Use as default in the generator" />

          <UTabs
            :items="TIMINGS.map(t => ({ label: t.label, key: t.key }))"
            class="w-full">
            <template #content="{ item }">
              <div class="pt-4 space-y-4">
                <UFormField :label="`Subject line`" required>
                  <UInput
                    v-model="modalForm.templates[item.key].subject"
                    placeholder="e.g. Reminder: {{ event_name }} — {{ timing_label }}"
                    class="w-full font-mono text-sm" />
                </UFormField>

                <UFormField label="Plain text body" required>
                  <UTextarea
                    v-model="modalForm.templates[item.key].body_plain"
                    :rows="10" class="w-full font-mono text-sm"
                    placeholder="Plain text version of the email..." />
                </UFormField>

                <UFormField label="HTML body" required>
                  <UTextarea
                    v-model="modalForm.templates[item.key].body_html"
                    :rows="10" class="w-full font-mono text-sm"
                    placeholder="<p>HTML version of the email...</p>" />
                </UFormField>

                <UButton @click="resetToDefault(item.key)"
                  variant="ghost" size="xs" color="neutral"
                  icon="i-lucide-rotate-ccw">
                  Reset this slot to built-in default
                </UButton>
              </div>
            </template>
          </UTabs>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton @click="modalOpen = false" variant="ghost"
            color="neutral">Cancel</UButton>
          <UButton @click="saveSet"
            :disabled="!modalForm.name.trim()">
            {{ editingSet ? 'Save changes' : 'Create' }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete confirm modal -->
    <UModal v-model:open="deleteModalOpen"
      title="Delete template set">
      <template #body>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete <strong>{{ deletingSet?.name
          }}</strong>?
          This cannot be undone.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton @click="deleteModalOpen = false" variant="ghost"
            color="neutral">Cancel</UButton>
          <UButton @click="deleteSet" color="error">Delete</UButton>
        </div>
      </template>
    </UModal>

  </div>
</template>