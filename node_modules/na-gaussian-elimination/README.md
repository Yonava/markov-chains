# na-gaussian-elimination

[![npm version](http://img.shields.io/npm/v/na-gaussian-elimination.svg)](https://npmjs.org/package/na-gaussian-elimination)
[![bower version](https://img.shields.io/bower/v/na-gaussian-elimination.svg)](https://github.com/tfoxy/na-gaussian-elimination/releases)
[![build status](https://travis-ci.org/tfoxy/na-gaussian-elimination.svg)](https://travis-ci.org/tfoxy/na-gaussian-elimination)

Solves a [system of linear equations] ([matrix]), using the [Gaussian elimination] algorithm.

Works in [Node.js] and the browser.


## Example

[Live Demo](http://jsbin.com/nuquga/embed?js,output)

```js
// If not executing on node.js and want to listen to events,
// use an EventEmitter library, e.g., https://github.com/asyncly/EventEmitter2
GaussianElimination.setEventEmitter(EventEmitter2);

// Use bignumber.js to create numbers: https://github.com/MikeMcl/bignumber.js/
var zero = new BigNumber(0);
GaussianElimination.defaultOptions.zero = zero;

var gaussianElimination = new GaussianElimination();

var matrix = [
  [new BigNumber(1) , new BigNumber(2), new BigNumber(3)],
  [new BigNumber(4), new BigNumber(5), new BigNumber(6)],
  [new BigNumber(7), new BigNumber(8), new BigNumber(12)]
];
var result = [
  new BigNumber(4), new BigNumber(7), new BigNumber(10)
];

gaussianElimination.on('swapRows', function(ev) {
  console.log('swap rows ' + ev.i + ' and ' + ev.j);
});

var system = gaussianElimination.solve(matrix, result);

console.log('solution', system.solution); // [-2, 3, 0]
```


## Functions and properties of GaussianElimination

#### `.setEventEmitter(EventEmitter)`

If you want to use the events in the browser, you must set an [EventEmitter library]
using the `GaussianElimination.setEventEmitter(EventEmitter)` method.

#### `.defaultOptions`

Used when no other option is specified in the constructor.
See [Options section](#Options).

#### `.SolutionError`

Error emitted (or thrown) when there is an error while solving the system.

#### `.OptionsError`

Error thrown in the constructor when an option has an invalid value.

#### `#solve(matrix, result)`

Solves the system and returns an object with the `solution` property.

  * `matrix` can be rectangular.
  * The values of `matrix` and `result` must be objects with the following methods: 
    `minus`, `times`, `div`, `isZero`, `abs`, `comparedTo`.
    This methods are all present in the [bignumber.js library].
  * `matrix` and `result` are modified when solving the system.
  * It doesn't check the dimensions of `matrix` and `result`.

#### `#forwardElimination(matrix, result)`

Reduces the given system to row echelon form 
(without the condition that the leading coefficient must be 1).

#### `#backSubstitution(matrix, result)`

Finds a solution for the system.


## Options

  * `pivoting`: one of `none`, `avoid zero`, `partial`, `scaled` and `complete`.
    Default: `'partial'`.
  * `lu`: if it is truthy, then the matrix is transformed into an LU matrix.
    If not, then the lower triangle of the matrix is filled with zeroes.
    Default: `false`.
  * `zero`: the value used to represent a zero. Only used when `lu` is falsy.
    Default: `0`.


[system of linear equations]: https://en.wikipedia.org/wiki/System_of_linear_equations
[matrix]: https://en.wikipedia.org/wiki/Matrix_(mathematics)
[Gaussian elimination]: https://en.wikipedia.org/wiki/Gaussian_elimination
[Node.js]: https://nodejs.org
[EventEmitter library]: https://github.com/asyncly/EventEmitter2
[bignumber.js library]: https://github.com/MikeMcl/bignumber.js
