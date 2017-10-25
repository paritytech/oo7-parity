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

import { Bond } from 'oo7';
import {
  // abiDecode,
  // abiEncode,
  // abiUnencode,
  // abiSignature,
  // cleanupValue,
  isAddressValid as ParityIsAddressValid,
  // isArray,
  // isFunction,
  // isHex,
  // isInstanceOf,
  // isString,
  bytesToHex as ParityBytesToHex,
  hexToAscii as ParityHexToAscii,
  // hexToBytes,
  asciiToHex as ParityAsciiToHex,
  // createIdentityImg,
  // decodeCallData,
  // decodeMethodInput,
  // encodeMethodCallAbi,
  // methodToAbi,
  // fromWei,
  toChecksumAddress as ParityToChecksumAddress,
  // toWei,
  sha3 as ParitySha3
} from '@parity/api/util';

export const asciiToHex = ParityAsciiToHex;
export const bytesToHex = ParityBytesToHex;
export const hexToAscii = ParityHexToAscii;

export const isAddressValid = (h: Bond | any) => Bond.instanceOf(h) ? h.map(ParityIsAddressValid) : ParityIsAddressValid(h);
export const toChecksumAddress = (h: Bond | any) => Bond.instanceOf(h) ? h.map(ParityToChecksumAddress) : ParityToChecksumAddress(h);
export const sha3 = (h: Bond | any) => Bond.instanceOf(h) ? h.map(ParitySha3) : ParitySha3(h);

export const isOwned = (addr: string) => Bond.mapAll([addr, bonds.accounts], (a, as) => as.indexOf(a) !== -1);
export const isNotOwned = (addr: string) => Bond.mapAll([addr, bonds.accounts], (a, as) => as.indexOf(a) === -1);

export const capitalizeFirstLetter = s => s.charAt(0).toUpperCase() + s.slice(1);

export function singleton(f: Function) {
  let instance = null;
  return function() {
    if (instance === null)
      instance = f();
    return instance;
  }
}
