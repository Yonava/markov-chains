// @ts-ignore
import rref from 'rref';
// @ts-ignore
import linearAlgebra from 'linear-algebra';
import { computed, type Ref } from 'vue';

const matrix = [
  [1, 2, -1, -4],
  [2, 3, -1, -11],
  [-2, 0, -3, 22],
];

export function useSteadyStateAnalysis(transitionMatrix: Ref<number[][]>) {
  return computed(() => {
    // steady state vector
    return [1, 2, 3];
  })
}

// takes augmented matrix and returns reduced row echelon form
const getRREF = (matrix: number[][]): number[][] => {
  return rref(matrix);
}

console.log(getRREF(matrix));