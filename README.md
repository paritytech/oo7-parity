oo7-parity
=========

A library to provide [`Bond`](https://github.com/ethcore/oo7#oo7)-related functionality for the Parity Ethereum
implementation and other compatible systems.

See the [oo7-parity reference](https://github.com/paritytech/parity/wiki/oo7-Parity-Reference)
for more information on usage.

## Installation

```sh
# yarn
yarn add oo7-parity
# npm
npm install oo7-parity --save
```

## Usage

```javascript
// ES6
import oo7parity, { bonds, formatBlockNumber } from 'oo7-parity';
// ES5 and below
const oo7parity         = require('oo7-parity').default,
      bonds             = oo7parity.bonds,
      formatBlockNumber = oo7parity.formatBlockNumber;

// Prints a nicely formatted block number each time there's a new block.
bonds.blockNumber.map(formatBlockNumber).tie(console.log);
```

## Tests

```sh
# yarn
yarn test
# npm
npm test
```

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.

## Release History

* 0.1.2 Add contract reading bonds
* 0.1.1 Initial release
