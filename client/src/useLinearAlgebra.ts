// @ts-ignore
import rref from 'rref';
// @ts-ignore
import linearAlgebra from 'linear-algebra';
import { computed, type Ref } from 'vue';

const { Matrix, Vector } = linearAlgebra();

const matrix = [
  [1, 2, -1, -4],
  [2, 3, -1, -11],
  [-2, 0, -3, 22],
];

export function useSteadyStateAnalysis(inputTransitionMatrix: Ref<number[][]>) {
  return computed(() => {

    const test = [
      [0.6, 0.3, 0.1],
      [0.4, 0.3, 0.3],
      [0.3, 0.3, 0.4],
    ]

    if (test.length < 2) {
      return {
        augmentedMatrix: [],
        matrixData: [],
        rrefMatrix: [],
      }
    }

    const transitionMatrix = new Matrix(test);
    const identityMatrix = Matrix.identity(test.length);

    // subtract identity matrix from transition matrix
    const subMatrix = transitionMatrix.minus(identityMatrix);

    const { data: augmentedMatrix } = subMatrix.trans();

    augmentedMatrix.forEach((row: number[]) => row.push(0))

    // add a row of ones to the bottom of the augmented matrix
    const newArray = new Array(augmentedMatrix[0].length).fill(1);
    augmentedMatrix.push(newArray);

    // get rref of augmented matrix
    // const rrefMatrix = getRREF(augmentedMatrix);

    // console.log(rrefMatrix);

    // steady state vector
    return {
      augmentedMatrix,
      matrixData: test,
      rrefMatrix: [],
    };
  })
}

// takes augmented matrix and returns reduced row echelon form
const getRREF = (matrix: number[][]): number[][] => {
  const newMatrix = JSON.parse(JSON.stringify(matrix));
  const reduced = rref(newMatrix);
  console.log(reduced);
  return reduced;
}