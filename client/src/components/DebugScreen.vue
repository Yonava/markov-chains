<template>
  <div
    v-if="showDebug"
    class="absolute top-0 right-0 z-50 text-white text-xl bg-red-500 p-4 opacity-75"
    style="pointer-events: none;"
  >
    <div v-for="(value, key) in markov">
      <b>
        {{ key }}:
      </b>
      <br>
      {{ value || 'undefined' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  markov: Record<string, any>;
}>();

const showDebug = ref(false);

addEventListener('keydown', (e) => {
  if (e.key === 'd') {
    showDebug.value = !showDebug.value;
  }
});
</script>