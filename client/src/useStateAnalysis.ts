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
