<template>
  <div class="absolute w-full h-full bg-gray-600" style="user-select: none;">
    <div class="flex flex-col items-center justify-center h-full p-12">
      <h1
        @click="generateNewNodesAndEdges"
        class="text-5xl font-bold text-white mb-5"
      >
        Create A Markov Chain
      </h1>
      <div class="w-full h-[900px] bg-gray-700 rounded-xl relative overflow-hidden">
        <!-- control panel -->
        <button
          @click="addNode()"
          @dblclick.stop
          class="bg-gray-800 absolute top-0 left-0 w-60 h-20 hover:bg-gray-900 text-white text-3xl"
        >
          New Node
        </button>

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
        <button
          @click="showInfo = !showInfo"
          class="bg-gray-800 absolute bottom-0 left-0 w-60 h-20 hover:bg-gray-900 text-white text-3xl z-10"
        >
          {{ showInfo ? 'Hide' : 'Show' }} Info
        </button>

        <!-- node killer -->
        <div
          ref="killBox"
          class="bg-red-800 absolute bottom-0 right-0 hover:bg-red-700 text-white text-3xl hover:bg-red-700 px-10 py-5"
        >
          {{ killBoxMessage }}
        </div>

        <!-- mini nodes -->
        <div
          v-for="(node, index) in miniNodes"
          :key="index"
          @mouseover="miniNodeState.hovered = true"
          @mouseleave="miniNodeState.hovered = false"
          @mousedown="miniNodeState.onTheMove = index"
          @mouseup="miniNodeDropped()"
          class="fixed rounded-full bg-gray-900 w-6 h-6 z-50 cursor-pointer scale-90 hover:scale-110 transition ease-in-out duration-200"
          :style="node.style + '; opacity:' + (node.style ? 1 : 0)"
          :ref="(el) => (node.ref = el)"
        >
        </div>
          <div
            v-if="miniNodeState.onTheMove !== -1"
            class="fixed bg-gray-900 z-30"
            :style="computeEdgeStyleGivenNodeRefs(miniNodes[miniNodeState.onTheMove].ref, miniNodeState.startNode?.ref, 0).line"
          >
        </div>

        <!-- nodes -->
        <div
          v-for="(node, index) in nodes"
          :key="node.id"
        >
          <button
            @keyup.delete="deleteNode(node)"
            @mousedown="nodeClicked(node)"
            @mouseover="updateNodeOnTop(node.id)"
            @mouseup="checkDeleteNode($event, node); initMiniNodes(node)"
            :class="`fixed w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-900 border-4 ` + getColor(node, markov)[1] + ' ' + (node.id === currentNodeOnTop ? 'z-40' : 'z-10')"
            :style="node.style + '; opacity:' + (node.style ? 1 : 0)"
            :ref="(el) => (node.ref = el)"
          >
            <div
              @mouseover="initMiniNodes(node)"
              @mouseleave="removeMiniNodesByNodeLeave()"
              class="w-28 h-28 absolute rounded-full"
            ></div>
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
            @dblclick.stop="deleteEdge(edge.id)"
            class="fixed bg-gray-900"
            :style="computeEdgeStyle(edge).line"
          >
            <div
              :style="computeEdgeStyle(edge).arrow"
            >
              <input
                v-if="!markovOptions.uniformEdgeProbability"
                @click.stop
                v-model.number="edge.weight"
                :style="computeEdgeStyle(edge).weight"
                class="w-12 bg-transparent text-white font-bold text-xl"
              />
            </div>
          </div>
        </div>
      </div>

    </div>

    <DebugScreen :markov="markov" />
    <div
      @click="showInfo = false"
      :style="{
        'opacity': showInfo ? 1 : 0,
        'pointer-events': showInfo ? 'all' : 'none',
        'background-color': 'rgba(0, 0, 0, 0.6)',
      }"
      class="fixed z-50 transition-opacity duration-200 absolute top-0 left-0 w-1/3 h-full cursor-pointer"
    >
      <InfoScreen
        :markov="markov"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, type ComponentPublicInstance, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { useDraggable } from '@vueuse/core'
import { useStateAnalysis, transitionMatrixToNodesAndEdges } from '@/useStateAnalysis';
import { getStateAfterNSteps } from '@/useLinearAlgebra';
import { getColor } from '@/colorizer';
import DebugScreen from '@/components/DebugScreen.vue';
import InfoScreen from '@/components/InfoScreen.vue';

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

const keybindings: Record<string, () => void> = {
  'r': () => generateNewNodesAndEdges(),
  's': () => simState.value.ready = !simState.value.ready,
  'n': () => addNode(),
  '+': () => markovOptions.value.steadyStatePrecision++,
  '-': () => markovOptions.value.steadyStatePrecision--,
  'e': () => markovOptions.value.uniformEdgeProbability = !markovOptions.value.uniformEdgeProbability,
  'p': () => toggleSimulationPause(),
}

document.addEventListener('keydown', (event) => {
  if (keybindings[event.key]) keybindings[event.key]()
})

document.addEventListener('dblclick', (event) => {
  addNode(event.clientX - 40, event.clientY - 40)
})

const showInfo = ref(false)

const nodesCreated = ref(0)

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

type MiniNode = {
  ref: MaybeRefOrGetter
  style: ComputedRef
}

let miniNodes = ref<MiniNode[]>([])

const miniNodeState = ref({
  hovered: false,
  onTheMove: -1,
  startNode: null as Node | null,
  reset: () => {
    miniNodeState.value.onTheMove = -1
    miniNodeState.value.hovered = false
    miniNodeState.value.startNode = null
  }
})

const initMiniNodes = async (startNode: Node) => {

  if (miniNodeState.value.onTheMove !== -1) return

  // reset miniNodeState
  miniNodeState.value.reset()
  miniNodeState.value.startNode = startNode

  const startNodeX = startNode.ref.getBoundingClientRect().x
  const startNodeY = startNode.ref.getBoundingClientRect().y

  miniNodes.value = new Array(4).fill(0).map((_) => ({} as MiniNode))
  await new Promise((resolve) => setTimeout(resolve, 0))

  const offsets = [
    { x: 28, y: -10 }, // top
    { x: 65, y: 30 }, // right
    { x: -10, y: 30 }, // left
    { x: 28, y: 65 }, // bottom
  ]

  miniNodes.value.forEach((node, index) => {
    const { style } = useDraggable(node.ref, {
      initialValue: {
        x: startNodeX + offsets[index].x,
        y: startNodeY + offsets[index].y,
      },
    })
    miniNodes.value[index].style = style
  })
}

const miniNodeDropped = () => {
  const startNode = miniNodeState.value.startNode
  const miniNode = miniNodes.value[miniNodeState.value.onTheMove].ref

  if (!startNode || !miniNode) {
    throw new Error('startNode or miniNode is null')
  }

  const miniNodeRect = miniNode.getBoundingClientRect()

  // loop through nodes and see if any are in miniNodeRect with a high tolerance threshold
  const nodeInMiniNodeRect = nodes.value.find((node) => {
    const nodeRect = node.ref.getBoundingClientRect()
    const tolerance = 60
    return (
      nodeRect.x > miniNodeRect.x - tolerance &&
      nodeRect.x < miniNodeRect.x + miniNodeRect.width + tolerance &&
      nodeRect.y > miniNodeRect.y - tolerance &&
      nodeRect.y < miniNodeRect.y + miniNodeRect.height + tolerance
    )
  })

  if (nodeInMiniNodeRect) {
    // add edge from startNode to nodeInMiniNodeRect
    addEdge({
      from: startNode.id,
      to: nodeInMiniNodeRect.id,
      weight: 1,
    })
  }

  // get the node that was dropped on
  miniNodes.value = []
  miniNodeState.value.reset()
}

const removeMiniNodesByNodeLeave = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  if (miniNodeState.value.onTheMove !== -1 || miniNodeState.value.hovered) return
  miniNodes.value = []
}

const deleteEdge = (edgeId: number) => {
  edges.value = edges.value.filter(edge => edge.id !== edgeId)

  // remove from edgeAngleMap
  for (const nodeId of edgeAngleMap.value.keys()) {
    let node = edgeAngleMap.value.get(nodeId)
    if (node) {
        node = node.filter(edgeAnglePair => edgeAnglePair.edgeId !== edgeId)
    }
  }
}

const generateNewNodesAndEdges = () => {
  nodes.value = []
  edges.value = []
  nodesCreated.value = 0
  const matrixSize = Math.floor(Math.random() * 10) + 1
  const edgeValue = () => Math.random() < 1 / matrixSize ? Number(Math.random().toFixed(2)) : 0
  const newTransitionMatrix = new Array(matrixSize).fill(0).map(() => new Array(matrixSize).fill(0).map(() => edgeValue()))
  const matrix = [
    [(1/3), (2/3), 0],
    [(1/4), (1/2), (1/4)],
    [0, (1/4), (3/4)]
  ]
  transitionMatrixToNodesAndEdges(
    matrix,
    addNode,
    addEdge
  )
}

const markovOptions = ref({
  uniformEdgeProbability: false,
  steadyStatePrecision: 3
})

const { state: markov } = useStateAnalysis(nodes, edges, markovOptions)

const addEdge = (options: {
  to: number
  from: number
  weight: number
}) => {

  const edgeAlreadyExists = edges.value.find((edge) => {
    return edge.from === options.from && edge.to === options.to
  })

  if (edgeAlreadyExists) return

  const edge: Edge = {
    id: edges.value.length,
    from: options.from,
    to: options.to,
    weight: options.weight,
  }

  edges.value.push(edge)
}

const currentNodeOnTop = ref(-1)

const updateNodeOnTop = (nodeId: number) => {
  if (miniNodeState.value.onTheMove !== -1) return
  currentNodeOnTop.value = nodeId
}

const edgeAngleMap = ref(new Map<number, {
  edgeId: number,
  angle: number,
}[]>())


const addToEdgeAngleMap = (nodeId: number, edgeId: number, angle: number): void => {
  const currentNode = edgeAngleMap.value.get(nodeId) || []
  const currentNodeSet = new Set(currentNode.map(edge => edge.edgeId));
  if (!currentNodeSet.has(edgeId)) {
    edgeAngleMap.value.set(nodeId, [...currentNode, {
      edgeId: edgeId,
      angle: angle
    }])
  } else {
    const index = currentNode.findIndex(edge => edge.edgeId === edgeId);
    if (index !== -1) currentNode[index].angle = angle
  }
}

const deleteFromEdgeAngleMap = (nodeId: number) => {
  edgeAngleMap.value.delete(nodeId)
  // delete associated data
  edgeAngleMap.value.forEach((nodeData, key) => {
    const updatedNodeData = nodeData.filter(edge => edge.edgeId !== nodeId)
    if (updatedNodeData.length > 0) {
      edgeAngleMap.value.set(key, updatedNodeData)
    } else {
      edgeAngleMap.value.delete(key)
    }
  })
}

const getOpenSpace = (angles: { edgeId: number; angle: number }[]): number => {
  const anglesList = angles.map(angle => angle.angle * (Math.PI / 180))

  if (anglesList.length === 0) return 0

  let sumSin = 0;
  let sumCos = 0;

  for (const angleInRadians of anglesList) {
    sumSin += Math.sin(angleInRadians);
    sumCos += Math.cos(angleInRadians);
  }

  const meanAngle = Math.atan2(sumSin / anglesList.length, sumCos / anglesList.length);

  const meanAngleInDegrees = (meanAngle + 2 * Math.PI) % (2 * Math.PI) * (180 / Math.PI);

  return (meanAngleInDegrees - 90) % 360
}


const computeEdgeStyleGivenNodeRefs = (toNodeRef: any, fromNodeRef: any, offset = 60) => {

  if (!toNodeRef || !fromNodeRef) return null

  const fromRect = fromNodeRef.getBoundingClientRect()
  const toRect = toNodeRef.getBoundingClientRect()

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

  const arrow = {
    width: 0,
    height: 0,
    transform: `translate(${length - 60}px, -16px)`,
    'border-top': '20px solid transparent',
    'border-bottom': '20px solid transparent',
    'border-left': '20px solid',
    'border-left-color': 'rgb(17 24 39)',
  }

  const weight = {
    transform: `rotate(${-1 * angle}deg) translate(${-Math.cos(radians) * length / 2.33}px, ${-Math.sin(radians) * length / 2.33}px)`
  }

  const line = {
    width: `${length - offset}px`,
    height: '8px',
    transform: `rotate(${angle}deg)`,
    transformOrigin: '0 0',
    top: `${y1 - unitY * 4}px`,
    left: `${x1 - unitX * 4}px`,
  }

  return {
    line,
    arrow,
    weight,
    y1,
    x1,
    distanceX,
    distanceY,
    radians,
  }
}

const computeEdgeStyle = (edge: Edge) => {
  const fromNode = nodes.value.find((n) => n.id === edge.from)
  const toNode = nodes.value.find((n) => n.id === edge.to)

  if (!fromNode || !toNode) return null

  const edgeStyleData = computeEdgeStyleGivenNodeRefs(toNode.ref, fromNode.ref)

  if (!edgeStyleData) return null

  const { line, arrow, weight, y1, x1, distanceX, distanceY, radians } = edgeStyleData

  if (edge.from === edge.to) {

    const curveRadius = 25
    let angle = getOpenSpace(edgeAngleMap.value.get(edge.from) ?? [])
    
    return {
      line: {
        position: 'absolute',
        top: `${y1 - 216}px`,
        left: `${x1 - 65}px`,
        width: `${distanceY * 2 + 16}px`,
        height: `100px`,
        'transform-origin': '50% 100%',
        transform: `rotate(${angle}deg)`,
        'border-radius': `${curveRadius}px ${curveRadius}px 0 0`,
        border: '8px solid rgb(17 24 39)',
        background: 'transparent',
      },
      arrow: {
        width: 0,
        height: 0,
        transform: `translate(-24px, 38px)`,
        'border-left': '20px solid transparent',
        'border-right': '20px solid transparent',
        'border-top': '20px solid rgb(17 24 39)',
      },
      weight: {
        transform: `translate(12px, -58px) rotate(${-1 * angle}deg) `
      }
    }
  }

  addToEdgeAngleMap(edge.from, edge.id, radians * 180 / Math.PI)
  addToEdgeAngleMap(edge.to, edge.id, radians * 180 / Math.PI + 180)

  // handle bidirectional edges by offsetting them
  const ingoingNodeChildren = markov.value.adjacencyMap.get(edge.to) ?? []
  const outgoingNodeChildren = markov.value.adjacencyMap.get(edge.from) ?? []

  const isBidirectional = ingoingNodeChildren.includes(edge.from) && outgoingNodeChildren.includes(edge.to)

  const bidirectionalAdjustment = {
    top: `${y1 + distanceY}px`,
    left: `${x1 + distanceX}px`,
  }

  if (isBidirectional) {
    line.top = bidirectionalAdjustment.top
    line.left = bidirectionalAdjustment.left
  }

  return {
    line,
    arrow,
    weight
  }
}

const killBox = ref(null)
const killBoxMessage = ref('Delete Node')

const addNode = async (x?: number, y?: number) => {

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
      x: x ?? 250 + Math.floor(Math.random() * 500),
      y: y ?? 250 + Math.floor(Math.random() * 500)
    },
  })

  const index = nodes.value.findIndex((n) => n.id === node.id)
  nodes.value[index].style = style
}

const checkDeleteNode = (event: any, node: Node) => {
  const killBoxRect = killBox.value.getBoundingClientRect()
  const nodeRect = event.target.getBoundingClientRect()
  if (
    nodeRect.x > killBoxRect.x - 60 &&
    nodeRect.x < killBoxRect.x + killBoxRect.width + 60 &&
    nodeRect.y > killBoxRect.y - 60 &&
    nodeRect.y < killBoxRect.y + killBoxRect.height + 60
  ) {
    killBoxMessage.value = `Node ${node.id} Was Tasty!`
    deleteNode(node)
    setTimeout(() => {
      killBoxMessage.value = 'Delete Node'
    }, 2000)
  }
}

const deleteNode = (node: Node) => {
  removeMiniNodesByNodeLeave()
  const index = nodes.value.findIndex((n) => n.id === node.id)
  edges.value = edges.value.filter((e) => e.from !== node.id && e.to !== node.id)
  nodes.value.splice(index, 1)
  deleteFromEdgeAngleMap(node.id)
}

const simState = ref({
  running: false,
  ready: false,
  step: 0,
  probVector: [] as number[],
  paused: false,
})

const nodeClicked = (node: Node) => {
  removeMiniNodesByNodeLeave()
  if (simState.value.ready && !simState.value.running) {
    simState.value.running = true
    simState.value.step = 0
    simState.value.ready = false
    const nodeIndex = nodes.value.findIndex((n) => n.id === node.id)
    simState.value.probVector = new Array(nodes.value.length).fill(0).map((_, i) => i === nodeIndex ? 1 : 0)
    runSimulation()
  }
}

let sim: number;
const runSimulation = () => {
  sim = setInterval(() => {
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

const toggleSimulationPause = () => {
  simState.value.paused = !simState.value.paused
  if (simState.value.paused) {
    clearInterval(sim)
  } else {
    runSimulation()
  }
}

// const edgeAngleMap = ref(new Map < number, {
//   edgeId: number,
//   angle: number,
// }[]>())


// const addToEdgeAngleMap = (nodeId: number, edgeId: number, angle: number): void => {
//   // check if node in map
//   // if no, add it
//   // if yes check if edge id in  list
//   // if yes, update
//   // if no, add it

//   const currentNode = edgeAngleMap.value.get(nodeId) || []

//   if (currentNode.find(edge => edge.edgeId === edgeId) === undefined) {
//     edgeAngleMap.value.set(nodeId, [...currentNode, {
//       edgeId: edgeId,
//       angle: angle
//     }])
//   } else {
//     const index = currentNode.findIndex(edge => edge.edgeId === edgeId);
//     if (index !== -1) currentNode[index].angle = angle
//   }
// }

// const deleteFromEdgeAngleMap = (nodeId: number) => {
//   edgeAngleMap.value.delete(nodeId);
// }

// const getOpenSpace = (angles: {
//   edgeId: number,
//   angle: number,
// }[]): number => {
//   // does not work for more than 2 edges

//   // all in degrees
//   if (angles.length === 0) return 0
//   if (angles.length === 1) return angles[0].angle + 90

//   let maxDifference = -Infinity
//   let maxDifferenceIndex = 0

//   for (let i = 0; i < angles.length; i++) {
//     for (let j = i + 1; j < angles.length; j++) {
//       const currentAngle = angles[i].angle
//       const nextAngle = angles[j].angle
//       const difference = (nextAngle - currentAngle + 360) % 360 // Circular difference

//       if (difference > maxDifference) {
//         maxDifference = difference
//         maxDifferenceIndex = i
//       }
//     }
//   }

//   // Calculate the circular average angle between the two angles
//   const averageAngle = angles[maxDifferenceIndex].angle + maxDifference / 2
//   return (averageAngle + 90) % 360 + 180
// }
</script>