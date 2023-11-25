// @ts-ignore
import scc from 'strongly-connected-components';
import { computed, type Ref } from 'vue';
import { useSteadyStateAnalysis } from './useLinearAlgebra';

type Node = {
  id: number
  style: any
  children: number[]
}

type Edge = {
  id: number
  from: number
  to: number
  weight: number
  isEditing: boolean
}

// node id -> list of child node ids
type AdjacencyMap = Map<number, number[]>;

const makeAdjacencyList = (adjacencyMap: AdjacencyMap): { list: number[][], map: Map<number, number> } => {
  const map = Array.from(adjacencyMap.keys()).reduce((acc, curr, i) => {
    return acc.set(curr, i);
  }, new Map())

  const inverseMap = Array.from(map.entries()).reduce((acc, [key, value]) => {
    return acc.set(value, key);
  }, new Map())

  return {
    list: Array.from(adjacencyMap).reduce((acc, [key, value]) => {
      const index = map.get(key);
      acc[index] = value.map((id) => map.get(id));
      return acc;
    }, [] as number[][]),
    map: inverseMap,
  }
}

const findStronglyCoupledComponents = (adjacencyMap: AdjacencyMap): {
  stronglyCoupledComponents: number[][],
  adjacencyMap: AdjacencyMap,
  nodeToComponentMap: Map<number, number>,
} => {

  const { list, map } = makeAdjacencyList(adjacencyMap);
  const { components } = scc(list);

  const stronglyCoupledComponents = components.map((component: number[]) => {
    return component.map((id: number) => map.get(id));
  })

  const {
    adjacencyMap: outputAdjacencyMap,
    nodeToComponentMap,
  } = createAdjacencyMapSCC(stronglyCoupledComponents, adjacencyMap);

  return {
    stronglyCoupledComponents,
    adjacencyMap: outputAdjacencyMap,
    nodeToComponentMap,
  };
}

const createAdjacencyMapSCC = (stronglyCoupledComponents: number[][], inputAdjacencyMap: AdjacencyMap) => {
  const adjacencyMap = new Map<number, number[]>();
  const nodeToComponentMap = new Map<number, number>();

  stronglyCoupledComponents.forEach((component, componentIndex) => {
    component.forEach((node) => {
      nodeToComponentMap.set(node, componentIndex);
    })
  })

  stronglyCoupledComponents.forEach((component, componentIndex) => {
    const componentChildren = component.map((node) => inputAdjacencyMap.get(node) ?? []).flat().filter((node) => {
      return nodeToComponentMap.get(node) !== componentIndex;
    })
    const componentChildrenToStrong = componentChildren.map((node) => nodeToComponentMap.get(node) ?? -1);
    const componentChildrenSet = new Set(componentChildrenToStrong);
    adjacencyMap.set(componentIndex, [...componentChildrenSet]);
  })

  return {
    adjacencyMap,
    nodeToComponentMap
  }
}

const lowestInPrimeFactorization = (num: number) => {
  if (num === 1) {
    return 1;
  }
  let divisor = 2;

  while (num >= 2) {
    if (num % divisor === 0) {
      return divisor
    }
    divisor++;
  }

  return 1
}

const getPeriod = (component: number[], adjacencyMap: AdjacencyMap): number => {
  const periods = getPeriodBFS(component[0], adjacencyMap);

  // return the greatest common divisor of all the node periods
  const componentPeriod = periods.reduce((acc, curr) => {
    return greatestCommonDivisor(acc, curr);
  }, periods[0]);

  return lowestInPrimeFactorization(componentPeriod);
}

// bfs until we reach the node we started at
const getPeriodBFS = (startNode: number, adjacencyMap: AdjacencyMap): number[] => {

  // 100 is a hard cap no matter what
  const maxVisitations = Math.min(100, adjacencyMap.size^2)

  const queue = [...adjacencyMap.get(startNode)?.map((n) => [n, 1]) ?? []];
  const visited = new Map<number, number>();

  const stepsToStart = []

  while (queue.length > 0) {
    const [node, steps] = queue.shift()!;

    if (visited.get(node) === maxVisitations) {
      continue;
    }

    if (node === startNode) {
      stepsToStart.push(steps);
      continue;
    }

    const visitedEntry = visited.get(node);
    visited.set(node, visitedEntry ? visitedEntry + 1 : 1)

    for (const child of adjacencyMap.get(node) ?? []) {
      queue.push([child, steps + 1]);
    }
  }

  return stepsToStart;
}

const greatestCommonDivisor = (a: number, b: number): number => {
  if (b === 0) {
    return a;
  }
  return greatestCommonDivisor(b, a % b);
}

const getAdjacencyMap = (nodes: Node[], edges: Edge[]) => nodes.reduce((acc, curr) => acc.set(
  curr.id,
  edges
    .filter((edge) => edge.from === curr.id)
    .map((edge) => edge.to)
), new Map() as Map<number, number[]>)

const getTransitionMatrix = (adjMap: AdjacencyMap, nodes: Node[]) => Array.from(adjMap).reduce((acc, [node, children]) => {
  // replace uniform weight with adjustable weights
  const uniformWeight = 1 / children.length
  const noChildMap = (n: Node) => n.id === node ? 1 : 0
  const childMap = (n: Node) => children.includes(n.id) ? uniformWeight : 0
  const row = children.length === 0
    ? nodes.map(noChildMap)
    : nodes.map(childMap)
  acc.push(row)
  return acc
}, [] as number[][])

export function useStateAnalysis(nodes: Ref<Node[]>, edges: Ref<Edge[]>) {
  return computed(() => {

    const adjacencyMap = getAdjacencyMap(nodes.value, edges.value)
    const transitionMatrix = getTransitionMatrix(adjacencyMap, nodes.value)

    const {
      stronglyCoupledComponents,
      adjacencyMap: componentAdjacencyMap,
      nodeToComponentMap,
    } = findStronglyCoupledComponents(adjacencyMap)

    const transientStates = []
    const recurrentClasses = []

    for (const [node, children] of componentAdjacencyMap) {
      if (children.length === 0) {
        recurrentClasses.push(stronglyCoupledComponents[node])
      } else {
        transientStates.push(stronglyCoupledComponents[node])
      }
    }

    const componentPeriodMap = recurrentClasses.map((component) => {
      return getPeriod(component, adjacencyMap);
    })

    return {
      transientStates: transientStates.flat(),
      recurrentClasses,
      nodeToComponentMap,
      componentPeriodMap,
      transitionMatrix,
      adjacencyMap,
    }
  })
}
