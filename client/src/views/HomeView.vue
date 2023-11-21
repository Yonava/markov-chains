<template>
  <div class="absolute w-full h-full bg-gray-600">
    <div class="flex flex-col items-center justify-center h-full p-12">
      <h1 class="text-5xl font-bold text-white mb-5">
        Create A Markov Chain
      </h1>
      <div class="a-12 w-full h-[900px] bg-gray-700 rounded-xl relative overflow-hidden">
        <!-- control panel -->
        <button
          class="bg-gray-800 absolute top-0 left-0 w-60 h-20 hover:bg-gray-900 text-white text-3xl"
        >
          New Node
        </button>

        <!-- simulate -->
        <button
          class="bg-gray-800 absolute top-0 right-0 w-60 h-20 hover:bg-gray-900 text-white text-3xl"
        >
          Run Simulation
        </button>

        <!-- nodes -->
        <button
          v-for="node in nodes"
          :key="node.id"
          class="absolute w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-900"
          :style="{ top: node.y + 'px', left: node.x + 'px' }"
        >
          <span class="text-white text-3xl">{{ node.id }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type Node = {
  id: number
  x: number
  y: number
  children: number[]
}

const nodes = ref<Node[]>([
  {
    id: 0,
    x: 100,
    y: 100,
    children: [1, 2],
  },
  {
    id: 1,
    x: 300,
    y: 100,
    children: [3],
  },
  {
    id: 2,
    x: 300,
    y: 300,
    children: [3],
  },
  {
    id: 3,
    x: 500,
    y: 200,
    children: [],
  },
])
</script>