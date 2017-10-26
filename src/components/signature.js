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

import { ReactivePromise as oo7ReactivePromise } from 'oo7';
import { asciiToHex }                            from '@parity/api/util';

type Sig = {
  failed?:    string,
  signed?:    string,
  confirmed?: string
}

export default (api: Function) => class Signature extends oo7ReactivePromise {
  trigger: Function;
  constructor(message: string, from: string) {
    super([message, from], [], ([message, from]) => {
      api().parity.postSign(from, asciiToHex(message))
        .then(signerRequestId => {
          this.trigger({requested: signerRequestId});
            return api().pollMethod('parity_checkRequest', signerRequestId);
          })
          .then(signature => {
          this.trigger({
            signed: splitSignature(signature)
          });
        })
        .catch(error => {
          console.error(error);
          this.trigger({failed: error});
        });
    }, false);
    this.then(_ => null);
  }
  isDone(signature: Sig) {
    return !!signature.failed || !!signature.signed;
  }
}
