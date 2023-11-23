// finds strongly coupled components given an adjacency map

// node id -> list of child node ids
type AdjacencyMap = Map<number, number[]>;

// node data contains the data associated with a node representing a strongly coupled component

type ComponentNode = {
  id: number;
  nodesInComponent: Set<number>;
}

// once we figure out which nodes belong to which strongly coupled component, we will assign edges between strongly coupled components. By iterating over each node in nodesInComponent and looking them up in the adjacency map, we add an edge between the strongly coupled component and the strongly coupled component that the node belongs to as long as the strongly coupled component is not the same as the strongly coupled component that the node belongs to.

// the resulting adjacency map will be a crunched down version of the original adjacency map, in which no cycles exist because all strongly coupled components have been collapsed into a single node.

export function findStronglyCoupledComponents(adjacencyMap: AdjacencyMap): AdjacencyMap {
    const stronglyCoupledComponents: AdjacencyMap = new Map();
    const visited: Set<number> = new Set();

    return stronglyCoupledComponents;
}

const dfs = (): void => {

}