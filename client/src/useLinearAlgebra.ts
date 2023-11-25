// @ts-ignore
import linearAlgebra from 'linear-algebra';
import { computed, type Ref } from 'vue';

import BigNumber from 'bignumber.js';

const { Matrix } = linearAlgebra();

function findRREF(matrix: number[][]) {

  const numRows = matrix.length;
  const numCols = matrix[0].length;

  let lead = 0;
  for (let r = 0; r < numRows; r++) {
    if (numCols <= lead) {
      return;
    }
    let i = r;
    while (matrix[i][lead] == 0) {
      i++;
      if (numRows == i) {
        i = r;
        lead++;
        if (numCols == lead) {
          return;
        }
      }
    }

    let tmp = matrix[i];
    matrix[i] = matrix[r];
    matrix[r] = tmp;

    let val = matrix[r][lead];
    for (let j = 0; j < numCols; j++) {
      matrix[r][j] /= val;
    }

    for (let i = 0; i < numRows; i++) {
      if (i == r) {
        continue;
      }
      val = matrix[i][lead];
      for (let j = 0; j < numCols; j++) {
        matrix[i][j] -= val * matrix[r][j];
      }
    }
    lead++;
  }
}

export function useSteadyStateAnalysis(inputTransitionMatrix: Ref<number[][]>) {
  return computed(() => {

    // correct: 0.47 0.3 0.23 works on BigNumber, breaks on Number
    // const test = [
    //   [0.6, 0.4, 0.3],
    //   [0.3, 0.3, 0.3],
    //   [0.1, 0.3, 0.4],
    // ]

    // correct: 0.08 0.92 works on Number, breaks on BigNumber
    const test = [
      [0.09, 0.08],
      [0.91, 0.92],
    ]

    // correct: 0.375 0.29 0.335 works on BigNumber and Number
    // const test = [
    //   [0.5, 0.3, 0.3],
    //   [0.2, 0.4, 0.3],
    //   [0.3, 0.3, 0.4],
    // ]

    // correct: 0.25 0.25 0.25 0.25 works on BigNumber and Number
    // const test = [
    //   [0.5, 0.2, 0.2, 0.1],
    //   [0.35, 0.4, 0.3, 0],
    //   [0.25, 0.3, 0.4, 0],
    //   [0.1, 0, 0, 0.9],
    // ]

    // correct: 0.67 0.34 works on BigNumber and Number
    // const test = [
    //   [0.6, 0.8],
    //   [0.4, 0.2],
    // ]

    // correct: 0.5 0.5 breaks on BigNumber works on Number
    // const test = [
    //   [0.15, 0.5],
    //   [0.85, 0.5],
    // ]

    const numRows = test.length;
    const identityMatrix = Array.from({ length: numRows }, (_, i) =>
      Array.from({ length: numRows }, (_, j) => (i === j ? 1 : 0))
    );

    const augmentedMatrix = test.map((row: number[], i: number) =>
      row.map((entry: number, j: number) => entry - identityMatrix[i][j])
    );

    // Augment with Zeros and Ones
    augmentedMatrix.forEach((row: number[]) => row.push(0));
    augmentedMatrix.push(Array(numRows + 1).fill(1));

    // Round the entries in the augmented matrix to 4 decimal places
    const decimalPlaces = 4;
    let roundedMatrix = augmentedMatrix.map((row: number[]) =>
      row.map((entry: number) => parseFloat(entry.toFixed(decimalPlaces)))
    );

    console.log(JSON.stringify(roundedMatrix, null, 2));

    // findRREF(roundedMatrix);
    roundedMatrix = runBigNumberRREF(roundedMatrix);

    console.log(JSON.stringify(roundedMatrix, null, 2));

    return new Matrix(roundedMatrix).trans().data.at(-1).slice(0, -1)
  })
}



// TODO: FOR BIG NUMBER VERSION, USE THIS

const findRREFBN = (matrix: BigNumber[][]) => {

  const numRows = matrix.length;
  const numCols = matrix[0].length;

  let lead = 0;

  for (let row = 0; row < numRows; row++) {
    if (numCols <= lead) {
      return matrix;
    }

    let i = row;

    const tolerance = new BigNumber("1e-10");

    while (matrix[i][lead].abs().isLessThanOrEqualTo(tolerance)) {
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

const runBigNumberRREF = (matrix: number[][]) => {
  const bigNumberMatrix = matrix.map((row) => row.map((entry) => new BigNumber(entry)));
  console.log('bn', JSON.stringify(bigNumberMatrix, null, 2));
  const rrefMatrix = findRREFBN(bigNumberMatrix);
  return rrefMatrix.map((row) => row.map((entry) => entry.toNumber()));
}