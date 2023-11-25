// @ts-ignore
import linearAlgebra from 'linear-algebra';
import { computed, type Ref } from 'vue';

import BigNumber from 'bignumber.js';

const { Matrix } = linearAlgebra();

// reduces augmented matrix to reduced row echelon form in place
const findRREF = (matrix: BigNumber[][]) => {

  const numRows = matrix.length;
  const numCols = matrix[0].length;

  let lead = 0;

  for (let row = 0; row < numRows; row++) {
    if (numCols <= lead) {
      return matrix;
    }

    let i = row;

    while (matrix[i][lead].eq(0)) {
      i++;
      if (numRows === i) {
        i = row;
        lead++;
        if (numCols === lead) {
          return matrix;
        }
      }
    }

    // Swap rows
    let temp = matrix[i];
    matrix[i] = matrix[row];
    matrix[row] = temp;

    // Scale the pivot row
    let val = matrix[row][lead];
    for (let j = 0; j < numCols; j++) {
      matrix[row][j] = matrix[row][j].div(val);
    }

    // Eliminate other rows
    for (let i = 0; i < numRows; i++) {
      if (i !== row) {
        val = matrix[i][lead];
        for (let j = 0; j < numCols; j++) {
          matrix[i][j] = matrix[i][j].minus(val.times(matrix[row][j]));
        }
      }
    }

    lead++;
  }

  return matrix;
}

export function useSteadyStateAnalysis(inputTransitionMatrix: Ref<number[][]>) {
  return computed(() => {

    const test = [
      [0.6, 0.3, 0.1],
      [0.4, 0.3, 0.3],
      [0.3, 0.3, 0.4],
    ]

    // const test = [
    //   [0.01, 0.99],
    //   [0.01, 0.98]
    // ]

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

    // map over everything in augmented matrix and convert toFixed(2)

    const matrixData = augmentedMatrix.map((row: number[]) => {
      return row.map((value: number) => {
        return Number(value.toFixed(2));
      })
    })

    const bigNumberMatrix = matrixData.map((row: number[]) => {
      return row.map((value: number) => {
        return new BigNumber(value);
      })
    });

    // find rref of augmented matrix
    const sol = findRREF(bigNumberMatrix);

    // convert solution back into numbers
    sol.map((row: BigNumber[]) => {
      return row.map((value: BigNumber) => {
        return value.toNumber();
      })
    });

    return new Matrix(sol).trans().data.at(-1);
  })
}