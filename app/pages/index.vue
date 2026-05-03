<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import Twig from 'twig'

const toast = useToast()

// ── Form state ────────────────────────────────────────────────────
const today = new Date()
const form = reactive({
  event_name: '',
  description: '',
  date_raw: today.toISOString().split('T')[0],
  time_raw: '09:00',
  duration_hours: 1,
  location: '',
  organizer: '',
  reply_to: '',
})

const canGenerate = computed(() =>
  form.event_name.trim() !== '' && form.date_raw !== '' && form.time_raw !== ''
)

const TIMINGS = [
  { key: '2_weeks', label: '2 weeks before', days: 14, alarmMin: 20160 },
  { key: '1_week', label: '1 week before', days: 7, alarmMin: 10080 },
  { key: '3_days', label: '3 days before', days: 3, alarmMin: 4320 },
  { key: 'day_of', label: 'Day of', days: 0, alarmMin: 60 },
]

const reminderTabs = TIMINGS.map(t => ({ label: t.label, key: t.key }))

const storedSets = useLocalStorage<Record<string, any>[]>('templateSets', [])

const templateSetOptions = computed(() => {
  if (!storedSets.value.length) return [{ label: 'Default (built-in)', value: '__default__' }]
  return [
    { label: 'Default (built-in)', value: '__default__' },
    ...storedSets.value.map(s => ({ label: s.name, value: s.id })),
  ]
})

const selectedTemplateSet = ref('__default__')

const mergeTags = [
  '{{ event_name }}', '{{ date }}', '{{ time }}', '{{ end_time }}',
  '{{ location }}', '{{ duration }}', '{{ organizer }}', '{{ reply_to }}',
  '{{ description }}', '{{ days_until }}', '{{ timing_label }}',
]

function copyTag(tag: string) {
  navigator.clipboard.writeText(tag)
  toast.add({ title: 'Copied', description: tag, duration: 1500 })
}

// ── Default templates ─────────────────────────────────────────────
const defaultTemplates: Record<string, { subject: string; body_plain: string; body_html: string }> = {
  '2_weeks': {
    subject: 'Reminder: {{ event_name }} — 2 weeks away',
    body_plain: `Hi,
 
Just a heads-up that {{ event_name }} is coming up in 2 weeks.
 
Date: {{ date }}
Time: {{ time }}{% if location %}\nLocation: {{ location }}{% endif %}{% if description %}\n\n{{ description }}{% endif %}
 
{% if organizer %}Questions? Reply to this email{% if reply_to %} ({{ reply_to }}){% endif %}.{% endif %}
 
See you there,
{{ organizer }}`,
    body_html: `<p>Hi,</p>
<p>Just a heads-up that <strong>{{ event_name }}</strong> is coming up in 2 weeks.</p>
<p><strong>Date:</strong> {{ date }}<br>
<strong>Time:</strong> {{ time }}{% if location %}<br><strong>Location:</strong> {{ location }}{% endif %}</p>
{% if description %}<p>{{ description }}</p>{% endif %}
<p>See you there,<br>{{ organizer }}</p>`,
  },
  '1_week': {
    subject: 'Reminder: {{ event_name }} — next week',
    body_plain: `Hi,
 
A reminder that {{ event_name }} is coming up next week.
 
Date: {{ date }}
Time: {{ time }}{% if location %}\nLocation: {{ location }}{% endif %}{% if description %}\n\n{{ description }}{% endif %}
 
See you there,
{{ organizer }}`,
    body_html: `<p>Hi,</p>
<p>A reminder that <strong>{{ event_name }}</strong> is coming up next week.</p>
<p><strong>Date:</strong> {{ date }}<br>
<strong>Time:</strong> {{ time }}{% if location %}<br><strong>Location:</strong> {{ location }}{% endif %}</p>
{% if description %}<p>{{ description }}</p>{% endif %}
<p>See you there,<br>{{ organizer }}</p>`,
  },
  '3_days': {
    subject: 'Reminder: {{ event_name }} — this {{ date }}',
    body_plain: `Hi,
 
Just a reminder that {{ event_name }} is in 3 days.
 
Date: {{ date }}
Time: {{ time }}{% if location %}\nLocation: {{ location }}{% endif %}{% if description %}\n\n{{ description }}{% endif %}
 
See you soon,
{{ organizer }}`,
    body_html: `<p>Hi,</p>
<p>Just a reminder that <strong>{{ event_name }}</strong> is in 3 days.</p>
<p><strong>Date:</strong> {{ date }}<br>
<strong>Time:</strong> {{ time }}{% if location %}<br><strong>Location:</strong> {{ location }}{% endif %}</p>
{% if description %}<p>{{ description }}</p>{% endif %}
<p>See you soon,<br>{{ organizer }}</p>`,
  },
  'day_of': {
    subject: 'Today: {{ event_name }}',
    body_plain: `Hi,
 
Just a reminder that {{ event_name }} is happening today.
 
Time: {{ time }}{% if location %}\nLocation: {{ location }}{% endif %}{% if description %}\n\n{{ description }}{% endif %}
 
See you soon,
{{ organizer }}`,
    body_html: `<p>Hi,</p>
<p>Just a reminder that <strong>{{ event_name }}</strong> is happening today.</p>
<p><strong>Time:</strong> {{ time }}{% if location %}<br><strong>Location:</strong> {{ location }}{% endif %}</p>
{% if description %}<p>{{ description }}</p>{% endif %}
<p>See you soon,<br>{{ organizer }}</p>`,
  },
}

// ── Generate ──────────────────────────────────────────────────────
const generated = ref(false)
const renderedEmails = ref<Record<string, { subject: string; body_plain: string; body_html: string }>>({})

function buildTwigContext() {
  const [y, mo, d] = form.date_raw.split('-').map(Number)
  const [h, mi] = form.time_raw.split(':').map(Number)
  const start = new Date(y, mo - 1, d, h, mi)
  const end = new Date(start.getTime() + form.duration_hours * 3600000)

  return {
    event_name: form.event_name,
    description: form.description,
    date: start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    time: start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    end_time: end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    location: form.location,
    duration: `${form.duration_hours} hour${form.duration_hours !== 1 ? 's' : ''}`,
    organizer: form.organizer,
    reply_to: form.reply_to,
  }
}

function renderTwig(template: string, context: Record<string, any>): string {
  try {
    const tmpl = Twig.twig({ data: template })
    return tmpl.render(context)
  } catch {
    return template
  }
}

function getTemplates(timingKey: string) {
  if (selectedTemplateSet.value === '__default__') {
    return defaultTemplates[timingKey]
  }
  const set = storedSets.value.find(s => s.id === selectedTemplateSet.value)
  return set?.templates?.[timingKey] ?? defaultTemplates[timingKey]
}

function generate() {
  if (!canGenerate.value) return
  const ctx = buildTwigContext()
  const emails: Record<string, any> = {}

  for (const timing of TIMINGS) {
    const tmpl = getTemplates(timing.key)
    const timingCtx = { ...ctx, days_until: timing.days, timing_label: timing.label }
    emails[timing.key] = {
      subject: renderTwig(tmpl.subject, timingCtx),
      body_plain: renderTwig(tmpl.body_plain, timingCtx),
      body_html: renderTwig(tmpl.body_html, timingCtx),
    }
  }

  renderedEmails.value = emails
  generated.value = true
}

function reset() {
  generated.value = false
  renderedEmails.value = {}
}

// ── iCal ──────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, '0') }

function toICalDate(dt: Date) {
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`
}

function buildIcs() {
  const [y, mo, d] = form.date_raw.split('-').map(Number)
  const [h, mi] = form.time_raw.split(':').map(Number)
  const start = new Date(y, mo - 1, d, h, mi)
  const end = new Date(start.getTime() + form.duration_hours * 3600000)
  const now = new Date()

  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EventGen//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Math.random().toString(36).slice(2)}${Date.now()}@eventgen`,
    `DTSTAMP:${toICalDate(now)}`,
    `DTSTART:${toICalDate(start)}`,
    `DTEND:${toICalDate(end)}`,
    `SUMMARY:${form.event_name}`,
    form.description ? `DESCRIPTION:${form.description.replace(/\n/g, '\\n')}` : '',
    form.location ? `LOCATION:${form.location}` : '',
    form.organizer ? `ORGANIZER;CN=${form.organizer}:mailto:${form.reply_to || 'noreply@example.com'}` : '',
  ].filter(Boolean)

  for (const t of TIMINGS) {
    lines.push(
      'BEGIN:VALARM',
      `TRIGGER:-PT${t.alarmMin}M`,
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${form.event_name}`,
      'END:VALARM',
    )
  }

  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}

function downloadIcs() {
  const content = buildIcs()
  const blob = new Blob([content], { type: 'text/calendar' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${form.event_name.replace(/\s+/g, '-')}.ics`
  a.click()
}

// ── Email copy / download ─────────────────────────────────────────
function copyEmail(timingKey: string, type: 'plain' | 'html') {
  const content = type === 'plain'
    ? renderedEmails.value[timingKey]?.body_plain
    : renderedEmails.value[timingKey]?.body_html
  navigator.clipboard.writeText(content ?? '')
  toast.add({ title: 'Copied to clipboard', duration: 1500 })
}

function downloadEmail(timingKey: string, type: 'plain' | 'html') {
  const content = type === 'plain'
    ? renderedEmails.value[timingKey]?.body_plain
    : renderedEmails.value[timingKey]?.body_html
  const ext = type === 'plain' ? 'txt' : 'html'
  const mime = type === 'plain' ? 'text/plain' : 'text/html'
  const blob = new Blob([content ?? ''], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `reminder-${timingKey}-${form.event_name.replace(/\s+/g, '-')}.${ext}`
  a.click()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <UContainer class="py-10">


      <!-- header -->
      <div class="mb-8">
        <IndexHeader />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <!-- Left: Form -->
        <div class="space-y-6">
          <UCard>
            <template #header>
              <p class="font-medium text-gray-900 dark:text-white">
                Event details</p>
            </template>

            <div class="space-y-4">
              <UFormField label="Event name" required>
                <UInput v-model="form.event_name"
                  placeholder="Annual board meeting" class="w-full" />
              </UFormField>

              <UFormField label="Description">
                <UTextarea v-model="form.description"
                  placeholder="Brief description of the event..."
                  :rows="3" class="w-full" />
              </UFormField>

              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Date" required>
                  <UInput v-model="form.date_raw" type="date"
                    class="w-full" />
                </UFormField>
                <UFormField label="Time" required>
                  <UInput v-model="form.time_raw" type="time"
                    class="w-full" />
                </UFormField>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Duration (hours)">
                  <UInput v-model.number="form.duration_hours"
                    type="number" min="0.5" step="0.5"
                    class="w-full" />
                </UFormField>
                <UFormField label="Location / link">
                  <UInput v-model="form.location"
                    placeholder="Room 4B or Zoom link"
                    class="w-full" />
                </UFormField>
              </div>

              <UFormField label="Organizer name">
                <UInput v-model="form.organizer"
                  placeholder="Your name or organization"
                  class="w-full" />
              </UFormField>

              <UFormField label="Reply-to email">
                <UInput v-model="form.reply_to" type="email"
                  placeholder="you@example.com" class="w-full" />
              </UFormField>

              <UFormField label="Template set">
                <USelect v-model="selectedTemplateSet"
                  :options="templateSetOptions" class="w-full" />
              </UFormField>
            </div>

            <template #footer>
              <div class="flex gap-3">
                <UButton @click="generate" :disabled="!canGenerate"
                  size="md" class="flex-1" justify="center">
                  Generate
                </UButton>
                <UButton @click="reset" variant="ghost" size="md"
                  color="neutral">
                  Reset
                </UButton>
              </div>
            </template>
          </UCard>

          <!-- Merge tag reference -->
          <UCard>
            <template #header>
              <p
                class="font-medium text-gray-900 dark:text-white text-sm">
                Available template variables</p>
            </template>
            <div class="flex flex-wrap gap-2">
              <UBadge v-for="tag in mergeTags" :key="tag"
                variant="soft" color="neutral"
                class="font-mono text-xs cursor-pointer"
                @click="copyTag(tag)">{{ tag }}</UBadge>
            </div>
            <p class="mt-3 text-xs text-gray-400">Click a tag to copy
              it.</p>
          </UCard>
        </div>

        <!-- Right: Output -->
        <div>
          <!-- Empty state -->
          <div v-if="!generated"
            class="flex flex-col items-center justify-center h-64 text-center text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            <UIcon name="i-lucide-file-output"
              class="w-10 h-10 mb-3 opacity-40" />
            <p class="text-sm">Fill in the form and hit Generate</p>
          </div>

          <div v-else class="space-y-4">
            <!-- iCal download -->
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <p
                    class="font-medium text-gray-900 dark:text-white">
                    Calendar file</p>
                  <UBadge variant="soft" color="success" size="xs">
                    iCal / Google Calendar</UBadge>
                </div>
              </template>
              <p
                class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                One .ics file with all 4 reminder alerts baked in.
                Works with
                Apple Calendar, Google Calendar, and Outlook.
              </p>
              <UButton @click="downloadIcs" variant="outline"
                icon="i-lucide-download" size="sm">
                Download .ics file
              </UButton>
            </UCard>

            <!-- Email outputs -->
            <UCard>
              <template #header>
                <p class="font-medium text-gray-900 dark:text-white">
                  Reminder emails</p>
              </template>

              <UTabs :items="reminderTabs" class="w-full">
                <template #content="{ item }">
                  <div class="pt-4 space-y-4">
                    <div>
                      <p
                        class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Subject</p>
                      <p
                        class="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2">
                        {{ renderedEmails[item.key]?.subject || '—' }}
                      </p>
                    </div>

                    <UTabs
                      :items="[{ label: 'Plain text', key: 'plain' }, { label: 'HTML', key: 'html' }]">
                      <template #content="{ item: subItem }">
                        <div class="pt-3">
                          <div class="relative">
                            <pre
                              class="text-xs bg-gray-50 dark:bg-gray-900 rounded-lg p-3 overflow-auto max-h-64 whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">{{ subItem.key === 'plain' ? renderedEmails[item.key]?.body_plain : renderedEmails[item.key]?.body_html }}</pre>
                            <UButton
                              @click="copyEmail(item.key, subItem.key)"
                              variant="ghost" size="xs"
                              icon="i-lucide-copy"
                              class="absolute top-2 right-2" />
                          </div>
                          <div class="flex gap-2 mt-2">
                            <UButton
                              @click="downloadEmail(item.key, subItem.key)"
                              variant="ghost" size="xs"
                              icon="i-lucide-download">
                              Download .{{ subItem.key === 'plain' ?
                                'txt' : 'html' }}
                            </UButton>
                          </div>
                        </div>
                      </template>
                    </UTabs>
                  </div>
                </template>
              </UTabs>
            </UCard>
          </div>
        </div>
      </div>

    </UContainer>
  </div>
</template>