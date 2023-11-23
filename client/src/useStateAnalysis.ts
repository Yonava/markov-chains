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
} => {

  const { list, map } = makeAdjacencyList(adjacencyMap);
  const { components } = scc(list);

  const stronglyCoupledComponents = components.map((component: number[]) => {
    return component.map((id: number) => map.get(id));
  })

  return {
    stronglyCoupledComponents,
    adjacencyMap: createAdjacencyMapSCC(stronglyCoupledComponents, adjacencyMap),
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

  return adjacencyMap;
}

export function useStateAnalysis(adjacencyMap: Ref<AdjacencyMap>) {
  return computed(() => {
    const {
      stronglyCoupledComponents,
      adjacencyMap: componentAdjacencyMap
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

    return {
      transientStates: transientStates.flat(),
      recurrentClasses,
    }
  })
}
