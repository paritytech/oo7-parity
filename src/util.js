// @flow
// (C) Copyright 2016-2017 Parity Technologies (UK) Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//         http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const asciiToHex = ParityApi.util.asciiToHex;
const bytesToHex = ParityApi.util.bytesToHex;
const hexToAscii = ParityApi.util.hexToAscii;

const isAddressValid = h => oo7.Bond.instanceOf(h) ? h.map(ParityApi.util.isAddressValid) : ParityApi.util.isAddressValid(h);
const toChecksumAddress = h => oo7.Bond.instanceOf(h) ? h.map(ParityApi.util.toChecksumAddress) : ParityApi.util.toChecksumAddress(h);
const sha3 = h => oo7.Bond.instanceOf(h) ? h.map(ParityApi.util.sha3) : ParityApi.util.sha3(h);

const isOwned = addr => oo7.Bond.mapAll([addr, bonds.accounts], (a, as) => as.indexOf(a) !== -1);
const isNotOwned = addr => oo7.Bond.mapAll([addr, bonds.accounts], (a, as) => as.indexOf(a) === -1);

const capitalizeFirstLetter = s => s.charAt(0).toUpperCase() + s.slice(1);

function singleton(f) {
  let instance = null;
  return function() {
    if (instance === null)
      instance = f();
    return instance;
  }
}

function interpretRender(s, defaultDenom = 6) {
    try {
      let m = s.toLowerCase().match(/([0-9,]+)(\.([0-9]*))? *([a-zA-Z]+)?/);
			let di = m[4] ? denominations.indexOf(m[4]) : defaultDenom;
			if (di === -1)
				return null;
			let n = (m[1].replace(',', '').replace(/^0*/, '')) || '0';
			let d = (m[3] || '').replace(/0*$/, '');
			return { denom: di, units: n, decimals: d, origNum: m[1] + (m[2] || ''), origDenom: m[4] || '' };
    } catch (e) {
      return null;
    }
}
