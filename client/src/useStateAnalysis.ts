// @ts-ignore
import scc from 'strongly-connected-components';
import { computed, type Ref } from 'vue';

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

const getPeriod = (component: number[], adjacencyMap: AdjacencyMap): number => {
  const nodePeriods = component.map((node) => getPeriodBFS(node, adjacencyMap));
  console.log(nodePeriods);
  // return the greatest common divisor of all the node periods
  return nodePeriods.reduce((acc, curr) => {
    return greatestCommonDivisor(acc, curr);
  }, nodePeriods[0]);
}

// bfs until we reach the node we started at
const getPeriodBFS = (startNode: number, adjacencyMap: AdjacencyMap): number => {

  console.log('starting at node', startNode)

  if (adjacencyMap.get(startNode)?.includes(startNode)) {
    return 1;
  }

  const queue = [...adjacencyMap.get(startNode)?.map((n) => [n, 1]) ?? []];
  const visited = new Set<number>();

  while (queue.length > 0) {
    // console.log(queue);
    const [node, steps] = queue.shift()!;

    console.log('new level at node', node)

    if (visited.has(node)) {
      continue;
    }

    if (node === startNode) {
      return steps;
    }

    visited.add(node);

    for (const child of adjacencyMap.get(node) ?? []) {
      queue.push([child, steps + 1]);
    }
  }

  return 1;
}

const greatestCommonDivisor = (a: number, b: number): number => {
  if (b === 0) {
    return a;
  }
  return greatestCommonDivisor(b, a % b);
}


export function useStateAnalysis(adjacencyMap: Ref<AdjacencyMap>) {
  return computed(() => {
    const {
      stronglyCoupledComponents,
      adjacencyMap: componentAdjacencyMap,
      nodeToComponentMap,
    } = findStronglyCoupledComponents(adjacencyMap.value)

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
      return getPeriod(component, adjacencyMap.value);
    })

    return {
      transientStates: transientStates.flat(),
      recurrentClasses,
      nodeToComponentMap,
      componentPeriodMap,
    }
  })
}
