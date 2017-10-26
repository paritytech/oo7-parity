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

import { ReactivePro as oo7ReactivePromise } from 'oo7';

type Sig = {
  failed?:    string,
  signed?:    string,
  confirmed?: string
}

export default (api: Function) => class Transaction extends oo7ReactivePromise {
  constructor(tx) {
    super([tx], [], ([tx]) => {
      let progress = this.trigger.bind(this);
      this.transactionPromise(api, tx, progress, _ => _);
    }, false);
    this.then(_ => null);
  }
  isDone(signature: Sig) {
    return !!(signature.failed || signature.confirmed);
  }
}

function transactionPromise(api: Function, tx: Object, progress: Function, f: Function) {
  progress({initialising: null});
  let condition = tx.condition || null;
  Promise.all([api().eth.accounts(), api().eth.gasPrice()])
    .then(([a, p]) => {
      progress({estimating: null});
      tx.from = tx.from || a[0];
      tx.gasPrice = tx.gasPrice || p;
      return tx.gas || api().eth.estimateGas(tx);
    })
    .then(g => {
      progress({estimated: g});
      tx.gas = tx.gas || g;
      return api().parity.postTransaction(tx);
    })
    .then(signerRequestId => {
      progress({requested: signerRequestId});
      return api().pollMethod('parity_checkRequest', signerRequestId);
    })
    .then(transactionHash => {
      if (condition) {
        progress(f({signed: transactionHash, scheduled: condition}));
        return {signed: transactionHash, scheduled: condition};
      } else {
        progress({signed: transactionHash});
        return api()
          .pollMethod('eth_getTransactionReceipt', transactionHash, (receipt) => receipt && receipt.blockNumber && !receipt.blockNumber.eq(0))
          .then(receipt => {
            progress(f({confirmed: receipt}));
            return receipt;
          });
      }
    })
    .catch(error => {
      progress({failed: error});
    });
}
