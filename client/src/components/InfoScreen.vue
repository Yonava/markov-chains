<template>
  <div>
    {{ markov }}
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  markov: Record<string, any>;
}>();
</script>