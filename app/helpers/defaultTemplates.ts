// ── Default templates (mirrors index.vue) ─────────────────────────
export const defaultTemplates: Record<
  string,
  { subject: string; body_plain: string; body_html: string }
> = {
  "2_weeks": {
    subject: "Reminder: {{ event_name }} — 2 weeks away",
    body_plain: `Hi,\n\nJust a heads-up that {{ event_name }} is coming up in 2 weeks.\n\nDate: {{ date }}\nTime: {{ time }}{% if location %}\nLocation: {{ location }}{% endif %}{% if description %}\n\n{{ description }}{% endif %}\n\nSee you there,\n{{ organizer }}`,
    body_html: `<p>Hi,</p>\n<p>Just a heads-up that <strong>{{ event_name }}</strong> is coming up in 2 weeks.</p>\n<p><strong>Date:</strong> {{ date }}<br>\n<strong>Time:</strong> {{ time }}{% if location %}<br><strong>Location:</strong> {{ location }}{% endif %}</p>\n{% if description %}<p>{{ description }}</p>{% endif %}\n<p>See you there,<br>{{ organizer }}</p>`,
  },
  "1_week": {
    subject: "Reminder: {{ event_name }} — next week",
    body_plain: `Hi,\n\nA reminder that {{ event_name }} is coming up next week.\n\nDate: {{ date }}\nTime: {{ time }}{% if location %}\nLocation: {{ location }}{% endif %}{% if description %}\n\n{{ description }}{% endif %}\n\nSee you there,\n{{ organizer }}`,
    body_html: `<p>Hi,</p>\n<p>A reminder that <strong>{{ event_name }}</strong> is coming up next week.</p>\n<p><strong>Date:</strong> {{ date }}<br>\n<strong>Time:</strong> {{ time }}{% if location %}<br><strong>Location:</strong> {{ location }}{% endif %}</p>\n{% if description %}<p>{{ description }}</p>{% endif %}\n<p>See you there,<br>{{ organizer }}</p>`,
  },
  "3_days": {
    subject: "Reminder: {{ event_name }} — in 3 days",
    body_plain: `Hi,\n\nJust a reminder that {{ event_name }} is in 3 days.\n\nDate: {{ date }}\nTime: {{ time }}{% if location %}\nLocation: {{ location }}{% endif %}{% if description %}\n\n{{ description }}{% endif %}\n\nSee you soon,\n{{ organizer }}`,
    body_html: `<p>Hi,</p>\n<p>Just a reminder that <strong>{{ event_name }}</strong> is in 3 days.</p>\n<p><strong>Date:</strong> {{ date }}<br>\n<strong>Time:</strong> {{ time }}{% if location %}<br><strong>Location:</strong> {{ location }}{% endif %}</p>\n{% if description %}<p>{{ description }}</p>{% endif %}\n<p>See you soon,<br>{{ organizer }}</p>`,
  },
  day_of: {
    subject: "Today: {{ event_name }}",
    body_plain: `Hi,\n\nJust a reminder that {{ event_name }} is happening today.\n\nTime: {{ time }}{% if location %}\nLocation: {{ location }}{% endif %}{% if description %}\n\n{{ description }}{% endif %}\n\nSee you soon,\n{{ organizer }}`,
    body_html: `<p>Hi,</p>\n<p>Just a reminder that <strong>{{ event_name }}</strong> is happening today.</p>\n<p><strong>Time:</strong> {{ time }}{% if location %}<br><strong>Location:</strong> {{ location }}{% endif %}</p>\n{% if description %}<p>{{ description }}</p>{% endif %}\n<p>See you soon,<br>{{ organizer }}</p>`,
  },
};
