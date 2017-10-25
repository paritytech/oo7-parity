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

import { TransformBond as oo7TransformBond } from 'oo7';

class TransformBond extends oo7TransformBond {
  constructor (f: Function, a?: Array<any> = [], d?: Array<any> = [], outResolveDepth?: number = 0, resolveDepth?: number = 1, latched?: bool = true, mayBeNull?: bool = true, context?: Object, api?: Function) {
    // super(f, a, d, outResolveDepth, resolveDepth, latched, mayBeNull, api());
    super(f, a, d, outResolveDepth, resolveDepth, latched, mayBeNull, api());
  }
  map (f: Function, outResolveDepth: number = 0, resolveDepth: number = 1) {
        return new TransformBond(f, [this], [], outResolveDepth, resolveDepth);
    }
  sub (name: string, outResolveDepth: number = 0, resolveDepth: number = 1) {
    return new TransformBond((r, n) => r[n], [this, name], [], outResolveDepth, resolveDepth);
  }
  static all(list) {
    return new TransformBond((...args) => args, list);
  }
}

export default TransformBond;
