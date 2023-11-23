import scc from 'strongly-connected-components';

// finds strongly coupled components given an adjacency map

// node id -> list of child node ids
type InputAdjacencyMap = Map<number, number[]>;

// node data contains the data associated with a node representing a strongly coupled component

// edges maps a strongly coupled component id to another strongly coupled component id
type ComponentNode = {
  id: number;
  nodesInComponent: Set<number>;
  edges: Map<number, number>;
}

type AdjacencyMap = Map<number, ComponentNode>;


// once we figure out which nodes belong to which strongly coupled component, we will assign edges between strongly coupled components. By iterating over each node in nodesInComponent and looking them up in the adjacency map, we add an edge between the strongly coupled component and the strongly coupled component that the node belongs to as long as the strongly coupled component is not the same as the strongly coupled component that the node belongs to.

// the resulting adjacency map will be a crunched down version of the original adjacency map, in which no cycles exist because all strongly coupled components have been collapsed into a single node.

// the first order of business is iterating over each node in adjacencyMap and see if it leads back to itself. If it does, then we have found a strongly coupled component. If we come across a node already associated with a strongly coupled component, then we can skip it. We can keep track of which nodes have already been added to a strongly coupled component by using a set.

const makeAdjacencyList = (adjacencyMap: InputAdjacencyMap): { list: number[][], map: Map<number, number> } => {
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

export function findStronglyCoupledComponents(adjacencyMap: InputAdjacencyMap): AdjacencyMap | void {

  const { list, map } = makeAdjacencyList(adjacencyMap);
  const { components } = scc(list)

  return components.map((component: number[]) => {
    return component.map((id: number) => map.get(id));
  })
}
