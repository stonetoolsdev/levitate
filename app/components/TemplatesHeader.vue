<script setup lang="ts">
defineEmits<{
  'templateheader:newtemplateset:click': []
}>()
</script>

<template>
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Levitate</h1>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        Email templates</h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Templates use
        <a href="https://twig.symfony.com/doc/3.x/" target="_blank"
          class="text-primary-500 hover:underline">Twig
          syntax</a>.
        <NuxtLink to="/"
          class="text-primary-500 hover:underline ml-2">← Back to
          generator</NuxtLink>
      </p>
    </div>
    <UButton @click="$emit('templateheader:newtemplateset:click')"
      icon="i-lucide-plus">New
      template set</UButton>
  </div>
</template>
