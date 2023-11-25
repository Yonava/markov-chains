# rref

solve systems of linear equations using gaussian elimination

[![testling badge](https://ci.testling.com/substack/rref.png)](https://ci.testling.com/substack/rref)

[![build status](https://secure.travis-ci.org/substack/rref.png)](http://travis-ci.org/substack/rref)

# example

``` js
var rref = require('rref');
console.log(rref([
    [ 2, 1, -1, 8 ],
    [ -3, -1, 2, -11 ],
    [ -2, 1, 2, -3 ]
]));
```

output:

```
[ [ 1, 0, 0, 2 ], [ 0, 1, 0, 3 ], [ 0, 0, 1, -1 ] ]
```

# methods

``` js
var rref = require('rref')
```

## rref(matrix)

Compute the reduced row echelon form for `matrix` in-place, returning and
modifying `matrix`.

`matrix` should be an array of arrays.

# install

With [npm](https://npmjs.org) do:

```
npm install rref
```

# license

MIT

# kudos

based on the [rosetta code rref javascript entry](rosettacode.org/wiki/Reduced_row_echelon_form#JavaScript)
