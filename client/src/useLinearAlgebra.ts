// @ts-ignore
import linearAlgebra from 'linear-algebra';
import BigNumber from 'bignumber.js';
import { matrix, multiply } from 'mathjs';

const { Matrix } = linearAlgebra();

export function getStateAfterNSteps(transitionMatrix: number[][], initialState: number[], n: number) {
  let vector = matrix(initialState);
  const transMatrix = matrix(transitionMatrix);

  for (let i = 0; i < n; i++) {
    vector = multiply(vector, transMatrix);
  }

  return vector.toArray().map((entry) => parseFloat(Number(entry).toFixed(4)));
}

export function getSteadyStateVector(transitionMatrix: number[][], precision: number) {
  const numRows = transitionMatrix.length;
  const inputMatrix = new Matrix(transitionMatrix).trans();
  const identity = Matrix.identity(numRows)

  const { data: augmentedMatrix } = identity.minus(inputMatrix) as { data: number[][] }

  augmentedMatrix.forEach((row) => row.push(0));
  augmentedMatrix.push(Array(numRows + 1).fill(1));

  const solvedMatrix = runBigNumberRREF(augmentedMatrix, precision);

  return new Matrix(solvedMatrix).trans().data.at(-1).slice(0, -1);
}

const findRREFBN = (matrix: BigNumber[][]) => {

  const numRows = matrix.length;
  const numCols = matrix[0].length;

  let lead = 0;

  for (let row = 0; row < numRows; row++) {
    if (numCols <= lead) {
      return matrix;
    }

    let i = row;

    // TODO: add adjustable tolerance parameter to narrow in on the most accurate solution
    const tolerance = new BigNumber("1e-1");

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

const runBigNumberRREF = (matrix: number[][], precision: number) => {
  const bigNumberMatrix = matrix.map((row) => row.map((entry) => new BigNumber(entry)));
  const rrefMatrix = findRREFBN(bigNumberMatrix);
  return rrefMatrix.map((row) => row.map((entry) => parseFloat(entry.toNumber().toFixed(precision))));
}

/* Test Matrices

// correct: 0.47 0.3 0.23 works on BigNumber, breaks on Number
const test = [
  [0.6, 0.4, 0.3],
  [0.3, 0.3, 0.3],
  [0.1, 0.3, 0.4],
]

// correct: 0.08 0.92 works on Number, breaks on BigNumber
const test = [
  [0.09, 0.08],
  [0.91, 0.92],
]

// correct: 0.375 0.29 0.335 works on BigNumber and Number
const test = [
  [0.5, 0.3, 0.3],
  [0.2, 0.4, 0.3],
  [0.3, 0.3, 0.4],
]

// correct: 0.25 0.25 0.25 0.25 works on BigNumber and Number
const test = [
  [0.5, 0.2, 0.2, 0.1],
  [0.35, 0.4, 0.3, 0],
  [0.25, 0.3, 0.4, 0],
  [0.1, 0, 0, 0.9],
]

// correct: 0.67 0.34 works on BigNumber and Number
const test = [
  [0.6, 0.8],
  [0.4, 0.2],
]

// correct: 0.5 0.5 breaks on BigNumber works on Number
const test = [
  [0.15, 0.5],
  [0.85, 0.5],
]

*/