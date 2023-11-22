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

        <button
          @click="addEdge"
          class="bg-gray-800 absolute bottom-0 left-0 w-60 h-20 hover:bg-gray-900 text-white text-3xl"
        >
          New Edge
        </button>

        <input
          type="text"
          v-model="tEdgeInput"
          class="bg-gray-800 absolute bottom-0 left-0 hover:bg-gray-900 text-white text-md"
        >

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
          {{ killBoxMessage }}
        </div>

        <!-- nodes -->
        <div
          v-for="node in nodes"
          :key="node.id"
        >
          <button
            @mouseup="checkDeleteNode($event, node)"
            class="fixed z-10 w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-900 border-4 border-gray-900"
            :style="node.style"
            :ref="(el) => (node.ref = el)"
          >
            <span class="text-white text-3xl">
              {{ node.id }}
            </span>
          </button>
        </div>

        <!-- edges -->
        <div
          v-for="edge in edges"
          :key="edge.id"
        >
          <div
            class="fixed bg-gray-900"
            :style="computeEdgeStyle(edge)"
          ></div>
          <!-- add arrow indicating edge direction and label indicating weight -->
        </div>
      </div>

    </div>

    <div class="absolute top-0 left-0 z-50 text-white text-xl bg-red-500 p-4 opacity-75">
      <b>
        Adjacency Map:
      </b>
      <br>
      <div>
        {{ adjacencyMap }}
      </div>
    </div>



    <div
      class="absolute top-0 right-0 text-white text-xl bg-blue-500 p-4 z-50 opacity-75"
    >
      <b>
        Transition Matrix:
      </b>
      <div
        v-for="row in transitionMatrix"
        class="flex flex-row w-full justify-around gap-7"
      >
        <div v-for="cell in row">
          {{ cell.toFixed(2)}}
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, type ComponentPublicInstance } from 'vue'
import { useDraggable } from '@vueuse/core'

type Node = {
  id: number
  style: any
  children: number[]
  // useDraggable throws error if HTMLElement is not passed,
  // but vue3 throws error when not using ComponentPublicInstance... wtf!
  ref: Element | ComponentPublicInstance | null | any
}

type Edge = {
  id: number
  from: number
  to: number
  weight: number
}

const nodesCreated = ref(0)

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

const tEdgeInput = ref('')

const addEdge = () => {

  const [from, to] = tEdgeInput.value.split(' ').map((n) => parseInt(n))

  const edge: Edge = {
    id: edges.value.length,
    from,
    to,
    weight: 1,
  }

  edges.value.push(edge)
}

const computeEdgeStyle = (edge: Edge) => {
  const fromNode = nodes.value.find((n) => n.id === edge.from)
  const toNode = nodes.value.find((n) => n.id === edge.to)

  if (!fromNode || !toNode) return {}

  const fromRect = fromNode.ref.getBoundingClientRect()
  const toRect = toNode.ref.getBoundingClientRect()

  // handle self-referencing states. they should go out a little and make a curved loop back
  if (toNode === fromNode) {
    // TODO: implement
  }

  // handle bidirectional edges by offsetting them
  const allEdgesWithNodes = edges.value.filter((e) => e.from === edge.from || e.to === edge.from)
  const isBidirectional = allEdgesWithNodes.length > 1
  // at most two edges may share a node
  const edgeIndex = allEdgesWithNodes.findIndex((e) => e.id === edge.id)
  const isMinNode = edgeIndex === 0

  const x1 = fromRect.x + fromRect.width / 2
  const y1 = fromRect.y + fromRect.height / 2
  const x2 = toRect.x + toRect.width / 2
  const y2 = toRect.y + toRect.height / 2

  const radians = Math.atan2(y2 - y1, x2 - x1)
  const angle = radians * (180 / Math.PI)

  const length = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

  const calculatePerpendicularOffset = (angle: number, lineSeparation: number) => {
    const perpendicularAngle = angle + Math.PI / 2
    const distanceX = lineSeparation * Math.cos(perpendicularAngle)
    const distanceY = lineSeparation * Math.sin(perpendicularAngle)

    return {
      distanceX,
      distanceY,
    }
  }

  const {distanceX, distanceY}  = calculatePerpendicularOffset(radians, 10)
  
  
  if (isBidirectional) {
    if (isMinNode) {
      return {
        width: `${length}px`,
        height: '7px',
        transform: `rotate(${angle}deg)`,
        transformOrigin: `0 0`,
        top: `${y1 + distanceY}px`,
        left: `${x1 + distanceX}px`,
      }
    } else {
      return {
        width: `${length}px`,
        height: '7px',
        transform: `rotate(${angle}deg)`,
        transformOrigin: `0 0`,
        top: `${y1 + distanceY}px`,
        left: `${x1 + distanceX}px`,
      }
    }
  }

  return {
    width: `${length}px`,
    height: '7px',
    transform: `rotate(${angle}deg)`,
    transformOrigin: '0 0',
    top: `${y1}px`,
    left: `${x1}px`,
  }

}

const killBox = ref(null)
const killBoxMessage = ref('Delete Node')

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

const checkDeleteNode = (event: any, node: Node) => {
  // see if node is in kill box
  const killBoxRect = killBox.value.getBoundingClientRect()
  const nodeRect = event.target.getBoundingClientRect()

  if (
    nodeRect.x > killBoxRect.x - 60 &&
    nodeRect.x < killBoxRect.x + killBoxRect.width + 60 &&
    nodeRect.y > killBoxRect.y - 60 &&
    nodeRect.y < killBoxRect.y + killBoxRect.height + 60
  ) {

    // delete node
    const index = nodes.value.findIndex((n) => n.id === node.id)

    // delete all edges connected to node
    edges.value = edges.value.filter((e) => e.from !== node.id && e.to !== node.id)

    // update kill box message
    killBoxMessage.value = `Node ${node.id} Was Tasty!`
    nodes.value.splice(index, 1)

    setTimeout(() => {
      killBoxMessage.value = 'Delete Node'
    }, 2000)
  }
}

const adjacencyMap = computed(() => nodes.value.reduce((acc, curr) => acc.set(
  curr.id,
  edges.value
    .filter((edge) => edge.from === curr.id)
    .map((edge) => edge.to)
), new Map() as Map<number, number[]>))

const transitionMatrix = computed(() => Array.from(adjacencyMap.value).reduce((acc, [node, children]) => {
  // replace uniform weight with adjustable weights
  const uniformWeight = 1 / children.length
  const noChildMap = (n: Node) => n.id === node ? 1 : 0
  const childMap = (n: Node) => children.includes(n.id) ? uniformWeight : 0
  const row = children.length === 0
    ? nodes.value.map(noChildMap)
    : nodes.value.map(childMap)
  acc.push(row)
  return acc
}, [] as number[][]))
</script>