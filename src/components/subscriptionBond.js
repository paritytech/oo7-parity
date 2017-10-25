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

import { Bond as oo7Bond } from 'oo7';
import TransformBond from './';

class SubscriptionBond extends oo7Bond {
  constructor(module: string, rpcName: string, options: Array<any> = [], api: Function) {
    super();
    this.module = module;
    this.rpcName = rpcName;
    this.options = [(_,n) => this.trigger(n), ...options];
  }
  initialise () {
    // promise instead of id because if a dependency triggers finalise() before id's promise is resolved the unsubscribing would call with undefined
    this.subscription = api().pubsub[this.module][this.rpcName](...this.options);
  }
  finalise () {
    this.subscription.then(id => api().pubsub.unsubscribe([id]));
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

export default SubscriptionBond;
