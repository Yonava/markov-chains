<template>
  <div class="absolute w-full h-full bg-gray-600">
    <div class="flex flex-col items-center justify-center h-full p-12">
      <h1 class="text-5xl font-bold text-white mb-5">
        Create A Markov Chain
      </h1>
      <div class="w-full h-[900px] bg-gray-700 rounded-xl relative overflow-hidden">
        <!-- control panel -->
        <button
          @click="addNode"
          class="bg-gray-800 absolute top-0 left-0 w-60 h-20 hover:bg-gray-900 text-white text-3xl"
        >
          New Node
        </button>

        <!-- simulate -->
        <button
          class="bg-gray-800 absolute top-0 right-0 w-60 h-20 hover:bg-gray-900 text-white text-3xl z-10"
        >
          Run Simulation
        </button>

        <!-- node killer -->
        <div
          ref="killBox"
          class="bg-red-800 absolute bottom-0 right-0 hover:bg-red-700 text-white text-3xl hover:bg-red-700 px-10 py-5"
        >
          Delete Node
        </div>

        <!-- nodes -->
        <div
          v-for="node in nodes"
          :key="node.id"
        >
          <button
            @mouseup="checkDeleteNode"
            class="fixed w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-900 border-4 border-gray-900"
            :style="node.style"
            :ref="(el) => (node.ref = el)"
          >
            <span class="text-white text-3xl">
              {{ node.id }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type ComponentPublicInstance, type ComputedRef } from 'vue'
import { useDraggable } from '@vueuse/core'

type Node = {
  id: number
  style: any
  children: number[]
  // useDraggable throws error if HTMLElement is not passed,
  // but vue3 throws error when not using ComponentPublicInstance... wtf!
  ref: Element | ComponentPublicInstance | null | any
}

const nodesCreated = ref(0)

const nodes = ref<Node[]>([])

const killBox = ref(null)

const addNode = async () => {
  const node: Node = {
    id: nodesCreated.value++,
    style: null,
    children: [],
    ref: null,
  }

  nodes.value.push(node)

  // wait for event loop to finish before getting node ref
  await new Promise((resolve) => setTimeout(resolve, 0))

  const { style } = useDraggable(node.ref, {
    initialValue: {
      x: Math.floor(Math.random() * 1000),
      y: Math.floor(Math.random() * 1000)
    },
  })

  const index = nodes.value.findIndex((n) => n.id === node.id)
  nodes.value[index].style = style
}

const checkDeleteNode = (event: any) => {
  // see if node is in kill box
  const killBoxRect = killBox.value.getBoundingClientRect()
  const nodeRect = event.target.getBoundingClientRect()

  console.log(killBoxRect, nodeRect)

  if (
    nodeRect.x > killBoxRect.x &&
    nodeRect.x < killBoxRect.x + killBoxRect.width &&
    nodeRect.y > killBoxRect.y &&
    nodeRect.y < killBoxRect.y + killBoxRect.height
  ) {
    // delete node
    const index = nodes.value.findIndex((n) => n.id === event.target.id)
    nodes.value.splice(index, 1)
  }
}
</script>