<template>
  <div class="absolute w-full h-full bg-gray-600">
    <div class="flex flex-col items-center justify-center h-full p-12">
      <h1
        class="text-5xl font-bold text-white mb-5"
      >
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
          v-if="!simState.running && !simState.ready"
          @click="simState.ready = true"
          class="bg-gray-800 absolute top-0 right-0 w-60 h-20 hover:bg-gray-900 text-white text-3xl z-10"
        >
          Run Simulation
        </button>
        <button
          v-else-if="simState.running"
          @click="simState.running = false"
          class="bg-gray-800 absolute top-0 right-0 w-60 h-20 hover:bg-gray-900 text-white text-3xl z-10"
        >
          Stop (Steps: {{ simState.step }})
        </button>
        <button
          v-else-if="simState.ready"
          @click="simState.ready = false"
          class="bg-gray-800 absolute top-0 right-0 w-60 h-20 hover:bg-gray-900 text-white text-3xl z-10"
        >
          Select A Node
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
          v-for="(node, index) in nodes"
          :key="node.id"
        >
          <button
            @click="nodeClicked(node)"
            @mousedown="currentNodeOnTop = node.id"
            @mouseup="checkDeleteNode($event, node)"
            :class="`fixed w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-900 border-4 ` + getColor(node)[1] + ' ' + (node.id === currentNodeOnTop ? 'z-50' : 'z-10')"
            :style="node.style + '; opacity:' + (node.style ? 1 : 0)"
            :ref="(el) => (node.ref = el)"
          >
            <span
              v-if="!simState.running"
              class="text-white text-3xl"
            >
              {{ node.id }}
            </span>
            <span
              v-else
              class="text-white text-xl"
            >
              {{ simState.probVector[index] }}
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
            :style="computeEdgeStyle(edge).line"
          >
            <div
              :style="computeEdgeStyle(edge).arrow"
            >
              <p
                v-if="edge.id !== currentEdgeBeingEdited"
                @dblclick="startEditing(edge.id)"
                :style="computeEdgeStyle(edge).weight"
                class="text-white"
              >{{ edge.weight }}</p>
              <input
                v-else
                @blur="stopEditing()"
                @keyup.enter="stopEditing()"
                :v-bind="edge.weight"
                :style="computeEdgeStyle(edge).weight"
                type="text"
                v-model="edge.weight"
              >
            </div>
          </div>
        </div>
      </div>

    </div>

    <DebugScreen :markov="markov" />

  </div>
</template>

<script setup lang="ts">
import { ref, type ComponentPublicInstance } from 'vue'
import { useDraggable } from '@vueuse/core'
import { useStateAnalysis } from '@/useStateAnalysis';
import { getStateAfterNSteps } from '@/useLinearAlgebra';
import DebugScreen from '@/components/DebugScreen.vue';

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

const markov = useStateAnalysis(nodes, edges)

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

const currentNodeOnTop = ref<Number>(-1)

const currentEdgeBeingEdited = ref<Number>(-1)

const startEditing = (edgeId: number) => {
  currentEdgeBeingEdited.value = edgeId
}
const stopEditing = () => {
  currentEdgeBeingEdited.value = -1
}

const computeEdgeStyle = (edge: Edge) => {
  const fromNode = nodes.value.find((n) => n.id === edge.from)
  const toNode = nodes.value.find((n) => n.id === edge.to)

  if (!fromNode || !toNode) return {}

  const fromRect = fromNode.ref.getBoundingClientRect()
  const toRect = toNode.ref.getBoundingClientRect()

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

  const { distanceX, distanceY }  = calculatePerpendicularOffset(radians, 10)

  const unitX = distanceX / Math.sqrt(distanceX ** 2 + distanceY ** 2)
  const unitY = distanceY / Math.sqrt(distanceX ** 2 + distanceY ** 2)

  const curveRadius = 25

  if (edge.from === edge.to) {
    return {
      line: {
        position: 'absolute',
        top: `${y1 - 190}px`,
        left: `${x1}px`,
        width: `${distanceY * 2 + 16}px`,
        height: `100px`,
        'transform-origin': '0 0',
        // 45 deg should become 50% of greatest angle between other edges
        transform: 'rotate(45deg)',
        'border-radius': `${curveRadius}px ${curveRadius}px 0 0`,
        border: '8px solid rgb(17 24 39)',
        background: 'transparent',
      },
      arrow: {
        width: 0,
        height: 0,
        transform: `translate(-26px, 26px)`,
        'border-left': '20px solid transparent',
        'border-right': '20px solid transparent',
        'border-top': '20px solid rgb(17 24 39)',
      },
      weight: {
        // 45 deg should become 50% of greatest angle between other edges
        'transform-origin': '0 0',
        transform: `rotate(${-1 * 45}deg) translate(${Math.cos(radians) * 10}px, ${-Math.cos(radians) * 60}px)`
      }
    }
  }

  // handle bidirectional edges by offsetting them
  const ingoingNodeChildren = markov.value.adjacencyMap.get(edge.to) ?? []
  const outgoingNodeChildren = markov.value.adjacencyMap.get(edge.from) ?? []

  const isBidirectional = ingoingNodeChildren.includes(edge.from) && outgoingNodeChildren.includes(edge.to)

  if (isBidirectional) {
    if (edge.from < edge.to) {
      return {
        line: {
          width: `${length - 60}px`,
          height: '8px',
          transform: `rotate(${angle}deg)`,
          transformOrigin: `0 0`,
          top: `${y1 + distanceY}px`,
          left: `${x1 + distanceX}px`,
        },
        arrow: {
          width: 0,
          height: 0,
          transform: `translate(${length - 60}px, -16px)`,
          'border-top': '20px solid transparent',
          'border-bottom': '20px solid transparent',
          'border-left': '20px solid rgb(17 24 39)',
        },
        weight: {
          transform: `rotate(${-1 * angle}deg) translate(${-Math.cos(radians) * length / 3}px, ${-Math.sin(radians) * length / 3}px)`
        }
      }
    } else {
      return {
        line: {
          width: `${length - 60}px`,
          height: '8px',
          transform: `rotate(${angle}deg)`,
          transformOrigin: `0 0`,
          top: `${y1 + distanceY}px`,
          left: `${x1 + distanceX}px`,
        },
        arrow: {
          width: 0,
          height: 0,
          transform: `translate(${length - 60}px, -16px)`,
          'border-top': '20px solid transparent',
          'border-bottom': '20px solid transparent',
          'border-left': '20px solid rgb(17 24 39)',
        },
        weight: {
          transform: `rotate(${-1 * angle}deg) translate(${-Math.cos(radians) * length / 3}px, ${-Math.sin(radians) * length / 3}px)`
        }
      }
    }
  }

  return {
    line: {
      width: `${length - 60}px`,
      height: '8px',
      transform: `rotate(${angle}deg)`,
      transformOrigin: '0 0',
      top: `${y1 - unitY * 4}px`,
      left: `${x1 - unitX * 4}px`,
    },
    arrow: {
      width: 0,
      height: 0,
      transform: `translate(${length - 60}px, -16px)`,
      'border-top': '20px solid transparent',
      'border-bottom': '20px solid transparent',
      'border-left': '20px solid rgb(17 24 39)',
    },
    weight: {
      transform: `rotate(${-1 * angle}deg) translate(${-Math.cos(radians) * length / 3}px, ${-Math.sin(radians) * length / 3}px)`
    }
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

const getColor = (node: Node) => {

  const index = markov.value.nodeToComponentMap.get(node.id)

  if (markov.value.transientStates.includes(node.id)) return ['Gray', 'border-gray-900']
  if (index === undefined) return ['Gray', 'border-gray-900']

  const colors = [
    ['Red', 'border-red-500'],
    ['Orange', 'border-yellow-500'],
    ['Green', 'border-green-500'],
    ['Blue', 'border-blue-500'],
    ['Indigo', 'border-indigo-500'],
    ['Purple', 'border-purple-500'],
    ['Pink', 'border-pink-500'],
  ]

  return colors[index % colors.length]
}

const simState = ref({
  running: false,
  ready: false,
  step: 0,
  probVector: [] as number[],
})

const nodeClicked = (node: Node) => {
  if (simState.value.ready && !simState.value.running) {
    simState.value.running = true
    simState.value.step = 0
    simState.value.ready = false
    const nodeIndex = nodes.value.findIndex((n) => n.id === node.id)
    simState.value.probVector = new Array(nodes.value.length).fill(0).map((_, i) => i === nodeIndex ? 1 : 0)
    runSimulation()
  }
}

const runSimulation = () => {
  const sim = setInterval(() => {
    if (simState.value.running) {
      simState.value.step++
      simState.value.probVector = getStateAfterNSteps(
        markov.value.transitionMatrix,
        simState.value.probVector,
        1
      )
    } else {
      clearInterval(sim)
      simState.value.probVector = []
      simState.value.step = 0
    }
  }, 500)
}
</script>