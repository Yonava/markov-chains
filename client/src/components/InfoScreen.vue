<template>
  <div class="text-white p-5 pt-8">
    <h1 class="text-4xl font-bold">
      Your Markov Chain
    </h1>
    <div
      v-for="data in formattedMarkov"
      :key="data.title"
      class="mt-5"
    >
      <h2 class="text-3xl font-semibold">
        {{ data.title }}
      </h2>
      <p class="text-xl">
        {{ data.content }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getColor } from '@/colorizer'
import { computed } from 'vue'

const props = defineProps<{
  markov: Record<string, any>;
}>();

type Format = {
  title: string;
  content: string;
}

const formattedMarkov = computed(() => {
  const output: Format[] = []

  const totalStates = {
    title: 'States',
    content: `There are ${props.markov.totalStates} total states. ${props.markov.recurrentStateCount} of them are recurrent and ${props.markov.transientStateCount} of them are transient.`
  }

  output.push(totalStates)

  const recurrentStates = {
    title: 'Recurrent States',
    content: props.markov.recurrentStates.join(', ') || 'None'
  }

  output.push(recurrentStates)

  const transientStates = {
    title: 'Transient States',
    content: props.markov.transientStates.join(', ') || 'None'
  }

  output.push(transientStates)

  const communicatingClasses = {
    title: 'Communicating Classes',
    content: `There are ${props.markov.communicatingClassCount} communicating classes. ${props.markov.communicatingClasses}`
  }

  output.push(communicatingClasses)

  return output
})
</script>