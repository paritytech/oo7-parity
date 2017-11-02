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

/* global parity */
/* eslint-disable no-return-assign */
/* eslint-disable no-proto */

const BigNumber = require('bignumber.js');
const oo7 = require('oo7');

const ParityApi = require('@parity/api');

const { abiPolyfill, RegistryABI, RegistryExtras, GitHubHintABI, OperationsABI,
	BadgeRegABI, TokenRegABI, BadgeABI, TokenABI } = require('./abis');

function defaultProvider () {
	// Injected by Parity or some other new-standard Provider.
	if (typeof window !== 'undefined' && window.ethereum) {
		console.log('Found nu-skool "ethereum" provider.');
		let provider = window.ethereum;
		return provider;
	}

	// Injected by Metamask/Mist.
	if (typeof window !== 'undefined' && window.web3 && window.web3.currentProvider) {
		console.log('Found old-skool "web3" provider. Will adapt...');
		let provider = window.web3.currentProvider;
		provider.on = (...args) => {
			console.warn('Ignoring `on` function called with ', args);
		};
/*
		// Workaround for broken @parity/api.
		let sa = provider.sendAsync.bind(provider);
		provider.sendAsync = (methodParams, callback) => sa(
			methodParams, (error, reply) => {
				console.log("JSONRPC:", methodParams, reply.result);
				return callback(error, reply.result);
			}
		);
		// And for other send-compat.
		provider.send = (method, params, callback) => sa(
			{ method, params },
			(error, reply) => {
				console.log("JSONRPC:", method, params, reply.result);
				return callback(error, reply.result);
			}
		);*/
		return provider;
	}

	// TODO: figure this out from the environment.

	let useWS = true;

	// Assume standard local connection.
	let provider;
	if (useWS) {
		console.log('Defaulting to Parity WS provider.');
		provider = new ParityApi.Provider.Ws('ws://localhost:8546');
	} else {
		console.log('Defaulting to Parity HTTP provider.');
		provider = new ParityApi.Provider.Http('http://localhost:8545');
	}
	let old = provider.send;
	provider.send = (method, params, callback) => old(method, params, (error, result) => {
		console.log("JSONRPC:", method, params, result);
		return callback(error, result);
	});
	return provider;
}

function Bonds (provider = defaultProvider()) {
	return createBonds({ api: new ParityApi(provider) });
}

const DEFAULT_PREFIX = 'io.parity/oo7-parity/';
const DEFAULT_PRIVATE_PREFIX = 'io.parity/private-oo7-parity/';

function detectExtensions (api) {
	if (!api._provider || !api._provider.provider) {
		// No provider in this API at all.
		return {};
	}

	if (api._provider.provider.isParity) {
		// Nu-skool Parity.
		return { 'io.parity/post': true, 'io.parity/defaultAccount': true, 'io.parity/rest': true };
	}

	if (api._provider.provider.isMetaMask) {
		// Nu-skool MetaMask.
		return { 'io.parity/post': true, 'io.parity/defaultAccount': true };
	}

	if (api._provider.provider._currentProvider) {
		let p = api._provider.provider._currentProvider;
		if (p.isMetaMask) {
			// Old-skool MetaMask.
			return {};
			//return { 'io.parity/post': true, 'io.parity/defaultAccount': true };
		}
		if (p.isMist) {
			// Old-skool Mist.
			return {};
		}

		console.warn('Unknown Old-skool provider.');
		return {};
	}

	console.warn('Unknown Nu-skool provider.');
	return {};
}

function createBonds(options) {
	var bonds = {};

	// We only ever use api() at call-time of this function; this allows the
	// options (particularly the transport option) to be changed dynamically
	// and the datastructure to be reused.
	const api = () => options.api;
	const util = ParityApi.util;
	const apiExtensions = detectExtensions(options.api);

	class TransformBond extends oo7.TransformBond {
		constructor (f, a = [], d = [], outResolveDepth = 0, resolveDepth = 1, cache = undefined, latched = true, mayBeNull = true) {
			super(f, a, d, outResolveDepth, resolveDepth, cache, latched, mayBeNull, api());
		}
		map (f, outResolveDepth = 0, cache = undefined) {
	        return new TransformBond(f, [this], [], outResolveDepth, 1, cache);
	    }
		sub (name, outResolveDepth = 0, cache = undefined) {
			return new TransformBond((r, n) => r[n], [this, name], [], outResolveDepth, 1, cache);
		}
		static all(list, cache = undefined) {
			return new TransformBond((...args) => args, list, [], 0, 1, cache);
		}
	}

	class SubscriptionBond extends oo7.Bond {
		constructor (module, rpcName, args = [], cache = { id: null, stringify: JSON.stringify, parse: JSON.parse }, xform = null, mayBeNull) {
			super(mayBeNull, cache);

			this.module = module;
			this.rpcName = rpcName;
			this.args = [
				xform
					? (_, n) => this.trigger(xform(n))
					: (_, n) => this.trigger(n),
				...args
			];
		}
		initialise () {
			// promise instead of id because if a dependency triggers finalise() before id's promise is resolved the unsubscribing would call with undefined
			this.subscription = api().pubsub[this.module][this.rpcName](...this.args);
		}
		finalise () {
			this.subscription.then(id => api().pubsub.unsubscribe([id]));
		}
		map (f, outResolveDepth = 0, cache = undefined) {
			return new TransformBond(f, [this], [], outResolveDepth, 1, cache);
		}
		sub (name, outResolveDepth = 0, cache = undefined) {
			return new TransformBond((r, n) => r[n], [this, name], [], outResolveDepth, 1, cache);
		}
		static all(list, cache = undefined) {
			return new TransformBond((...args) => args, list, [], 0, 1, cache);
		}
	}

	// TODO: api().pollMethod should be renamed and do this itself.
	function whenReady(module, rpc, args, condition = undefined) {
		console.log('whenReady', args);
		if (useSubs && false) {	// subscriptions don't work for this currently.
			condition = condition || (_ => _ !== null);	// WRONG. TODO: figure out what is right.
			return new Promise((resolve, reject) => {
				let subscription;
				subscription = api().pubsub[module][rpc]((error, value) => {
					if (condition(value)) {
						subscription.then(id => api().pubsub.unsubscribe([id]));
						resolve(value);
						return;
					}
					if (error) {
						reject(error);
						return;
					}
				}, ...args);
			});
		} else {
			if (args.length !== 1) {
				throw new Error('pollMethod only supports a single RPC argument.');
			}
			return api().pollMethod(module + '_' + rpc, ...args, condition);
		}
	}

	class Signature extends oo7.ReactivePromise {
		constructor(message, from, usePost) {
			super([message, from], [], ([message, from]) => {
				(usePost
					? (api().parity.postSign(from, asciiToHex(message))
						.then(signerRequestId => {
							this.trigger({ requested: signerRequestId });
							return whenReady('parity', 'checkRequest', [signerRequestId]);
					    }))
					: api().eth.sign(from, asciiToHex(message))
				).then(signature => {
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
		isDone(s) {
			return !!s.failed || !!s.signed;
		}
	}

	function transactionPromise(tx, progress, f, usePost) {
		progress({ initialising: null });
		let condition = tx.condition || null;
		Promise.all([api().eth.accounts(), api().eth.gasPrice()])
			.then(([a, p]) => {
				progress({ estimating: null });
				tx.from = tx.from || a[0];
				tx.gasPrice = tx.gasPrice || p;
				return tx.gas || api().eth.estimateGas(tx);
			})
			.then(g => {
				progress({ estimated: g });
				tx.gas = tx.gas || g;
				return usePost
					? api().parity.postTransaction(tx).then(signerRequestId => {
						progress({ requested: signerRequestId });
//						return api().pollMethod('parity_checkRequest', signerRequestId);
						return whenReady('parity', 'checkRequest', [signerRequestId]);
					})
					: api().parity.sendTransaction(tx);
			})
			.then(transactionHash => {
				if (condition) {
					progress(f({ signed: transactionHash, scheduled: condition }));
					return { signed: transactionHash, scheduled: condition };
				} else {
					progress({ signed: transactionHash });
/*					return api().pollMethod(
						'eth_getTransactionReceipt',
						transactionHash,
*/					return whenReady(
						'eth', 'getTransactionReceipt',
						[transactionHash],
						receipt => receipt && receipt.blockNumber && !receipt.blockNumber.eq(0)
					).then(receipt => {
						progress(f({ confirmed: receipt }));
						return receipt;
					});
				}
			})
			.catch(error => {
				progress({ failed: error });
			});
	}

	class Transaction extends oo7.ReactivePromise {
		constructor(tx, usePost) {
			super([tx], [], ([tx]) => {
				let progress = this.trigger.bind(this);
				transactionPromise(tx, progress, _ => _, usePost);
			}, false);
			this.then(_ => null);
		}
		isDone(s) {
			return !!(s.failed || s.confirmed);
		}
	}

	function overlay(base, top) {
		Object.keys(top).forEach(k => {
			base[k] = top[k];
		});
		return base;
	}

	function memoized(f) {
		var memo;
		return function() {
			if (memo === undefined)
				memo = f();
			return memo;
		};
	}

	function call(addr, method, args, options) {
		let data = util.abiEncode(method.name, method.inputs.map(f => f.type), args);
		let decode = d => util.abiDecode(method.outputs.map(f => f.type), d);
		return api().eth.call(overlay({to: addr, data: data}, options)).then(decode);
	};

	function post(addr, method, args, options) {
		let toOptions = (addr, method, options, ...args) => {
			return overlay({to: addr, data: util.abiEncode(method.name, method.inputs.map(f => f.type), args)}, options);
		};
		// inResolveDepth is 2 to allow for Bonded `condition`values which are
		// object values in `options`.
		return new Transaction(new TransformBond(toOptions, [addr, method, options, ...args], [], 0, 2), apiExtensions['io.parity/post']);
	};

	function presub (f) {
		return new Proxy(f, {
			get (receiver, name) {
				if (typeof(name) === 'string' || typeof(name) === 'number') {
					return typeof(receiver[name]) !== 'undefined' ? receiver[name] : receiver(name);
				} else if (typeof(name) === 'symbol' && oo7.Bond.knowSymbol(name)) {
					return receiver(oo7.Bond.fromSymbol(name));
				} else {
					throw new Error(`Weird value type to be subscripted by: ${typeof(name)}: ${JSON.stringify(name)}`);
				}
			}
		});
	};

	function isNumber(n) { return typeof(n) === 'number' || (typeof(n) === 'string' && n.match(/^[0-9]+$/)); }

	// Move over particular string elements to BigNumber.
	function bignumify(value, heuristic) {
		if (typeof heuristic === 'undefined') {
			// simple heuristic
			if (typeof value === 'string') {
				let m = value.match(/^"([0-9]+)"$/);
				if (m) {
					return new BigNumber(m[1]);
				}
			}
			if (typeof value === 'object' && value !== null) {
				if (value.constructor.name === 'Array') {
					value.forEach((item, index) => value[index] = bignumify(item, heuristic));
				} else {
					Object.keys(value).forEach(key => value[key] = bignumify(value[key], heuristic));
				}
			}
		}
		return value;
	}

	function bignumifyJSONparse (jsonString) {
		return bignumify(JSON.parse(jsonString));
	}

	function caching (id, type = true) {
		if (!type)
			return null;
		return {
			id: ((type === true ? options.prefix : options.privatePrefix) || '???') + id,
			stringify: JSON.stringify,
			parse: bignumifyJSONparse
		};
	}

	let useSubs = typeof options.pubsub === 'boolean' ? options.pubsub : (() => {
		try {
			options.api.pubsub
			return true;
		}
		catch (e) {
			return false;
		}
	})();

	let paramTypes = {};

	function uuidify (type, value) {
		return '' + value;
	}

	/*
	Typical type codes we use:
	- b: JS boolean
	- n: JS number;
	- N: BigNumber object;
	- s: JS string (nothing special in its content);
	- data: some number of bytes, as a `0x`-prefixed, even-length hex string;
	- hash: like data but 32 bytes (i.e. string of length 66);
	- address: like data but 20 bytes and with capitalisation varying according to the checksum;
	- TYPE[]: an array (Javascript array) of some other type TYPE;
	- KEY{VALUE}: a JS object that maps things of type KEY to VALUE;
	- tx: a transaction JS object;
	- accountInfo: an account info JS object;
	- block: a block JS object;
	- receipt: a receipt JS object;
	- chainStatus: JS object with information on the status of the chain;
	- gasPriceHistogram: JS object with a gas-price histogram;
	- versionInfo: JS object with information on a client version;
	- upgradeInfo: JS object with information on an client upgrade;
	*/

	function deuuidify (type, string) {
		if (type === 'N') {
			// convert from BigNumber
			return new BigNumber(string);
		} else if (type === 'hash' || type === 'data') {
			// a hash/data - nothing to do.
			return string;
		} else {
			// automatic.
			return !string.startsWith('0x') && Number.isFinite(Number.parseInt(string)) ? new BigNumber(string) : string;
		}
	}

	function prettifyValueFromRpcTransform(type) {
		if (type === 'n') {
			// Comes in as a BigNumber - but it's only small - convert
			return v => +v;
		}
		else if (type === 'address') {
			return util.toChecksumAddress;
		}
		else if (typeof type === 'string' && type.endsWith('[]')) {
			let f = prettifyValueFromRpcTransform(type.substr(0, type.length - 2));
			return f ? v => v.map(f) : null;
		} else if (typeof type === 'string' && type.endsWith('}')) {
			let g = prettifyValueFromRpcTransform(type.substr(0, type.indexOf('{')));
			let f = prettifyValueFromRpcTransform(type.slice(type.indexOf('{') + 1, type.length - 1));
			return f || g
				? o => {
					let r = {};
					Object.keys(o).forEach(k => r[g ? g(k) : k] = f ? f(o[k]) : o[k]);
					return r;
				}
				: null;
		}
		return null;
	}

	function subsFromValue(type) {
		if (type === 'address' || type === 'hash' || type === 'data') {
			return 0;
		} else if (type === 'gasPriceHistogram') {
			return 2;
		} else if (typeof type === 'string' && type.endsWith('[]')) {
			return subsFromValue(type.substr(0, type.length - 2)) + 1;
		} else if (typeof type === 'string' && type.endsWith('}')) {
			return subsFromValue(type.slice(type.indexOf('{') + 1, type.length - 1)) + 1;
		} else if (typeof type === 'string') {
			// Some type that we're not famililar with - assume it's a
			// single-depth structure unless it's a single-letter (simple)
			return type.length === 1 ? 0 : 1;
		}
		return 0;
	}

	function bondifiedDeps(descriptor) {
		return (
			descriptor === 'time' ? [bonds.time]
			: descriptor === 'state' || descriptor === 'head' ? [bonds.height]
			: descriptor === 'chainid' ? [bonds.chainId]
			: descriptor ? (() => { console.warn('bondifiedDeps: Unknown descriptor', descriptor); return [bonds.time]; })()
			: []
		);
	}

	function deduceTypes(values, choices) {
		return choices.map((choice, i) => {
			if (i < values.length) {
				let v = values[i];
				for (let c in choice) {
					// Just identify hash and number for now
					if (choice[c] === 'hash' && typeof v === 'string' && v.startsWith('0x') && v.length % 2 === 0) {
						return 'hash';
					}
					if (choice[c] === 'n' && (typeof v === 'number' || (typeof v === 'object' && v.constructor.name === 'BigNumber'))) {
						return 'n';
					}
				}
			}
			return '';
		}).join('_');
	}

	function moduleRpcName (r) {
		return [
			typeof r === 'string' ? 'eth' : r[0],
			typeof r === 'string' ? r : r[1]
		];
	}

	function declarePolling(name, rpc = name, args = [], params = [], deps = [], subs = 0, xform = null, cache = true) {
		let makeRpc = ([module, rpc]) => xform ? () => api()[module][rpc]().then(xform) : api()[module][rpc];
		let complex = (typeof rpc === 'object' && rpc.constructor !== Array);

		paramTypes[name] = params;
		bonds[name] = params.length === 0
			? new TransformBond(
				makeRpc(moduleRpcName(rpc)),
				[], deps, undefined, undefined,
				caching(name)
			).subscriptable(subs)
			: (...bonded) => new TransformBond((...resolved) =>	// Outer transform to resolve the param
				new TransformBond(	// Inner to cache based on resolved param
					makeRpc(moduleRpcName(complex ? rpc[deduceTypes([...args, ...resolved], params)] : rpc)),
					[...args, ...resolved], deps, undefined, undefined,
					// Base the cache UUID on the resolved value
					caching(`${name}(${resolved.map((v, i) => uuidify(params[i], v)).join(',')})`, cache)
				), bonded, [], 1			// 1 here to ensure it resolves the inner bond
			).subscriptable(subs);
	}

	function declarePubsub(name, rpc = name, args = [], params = [], deps = [], subs = 0, xform = null, cache = true) {
		let complex = (typeof rpc === 'object' && rpc.constructor !== Array);

		paramTypes[name] = params;
		bonds[name] = params.length === 0
			? new SubscriptionBond(
				...moduleRpcName(rpc), args, caching(name), xform, true
			).subscriptable(subs)
			: (...bonded) => new TransformBond(	// Outer transform to resolve the param
				(...resolved) => new SubscriptionBond(	// Inner to cache based on resolved param
					...moduleRpcName(complex ? rpc[deduceTypes([...args, ...resolved], params)] : rpc),
					[...args, ...resolved],
					// Base the cache UUID on the resolved value
					caching(`${name}(${resolved.map((v, i) => uuidify(params[i], v)).join(',')})`, cache),
					xform,
					true
				), bonded, [], 1			// 1 here to ensure it resolves the inner bond
			).subscriptable(subs);
	}

	let declare = (pubsub, ...args) => useSubs && pubsub
		? declarePubsub(...args)
		: declarePolling(...args);

	// order is important for the first one.
	let standardApis = [
		// web3_
		{ name: 'clientVersion', rpc: ['web3', 'clientVersion'], out: 's'},
		//{ name: 'currentProvider', rpc: ['web3', 'currentProvider'] },

		// net_
		{ name: 'peerCount', rpc: ['net', 'peerCount'], deps: 'peers', out: 'n' },
		{ name: 'listening', rpc: ['net', 'listening'], deps: 'listening', out: 'b' },
		{ name: 'chainId', rpc: ['net', 'version'], out: 'n', pubsub: false },

		{ name: 'height', rpc: 'blockNumber', deps: 'time', out: 'n' },
		{ name: 'blockByNumber', rpc: 'getBlockByNumber', params: ['n'], deps: 'state', out: 'block' },// TODO: chain reorg that includes number
		{ name: 'blockByHash', rpc: 'getBlockByHash', params: ['hash'], deps: 'state', out: 'block' },
		{ name: 'head', rpc: 'getBlockByNumber', args: ['latest'], deps: 'head', out: 'block' },// TODO: chain reorgs
		{ name: 'author', rpc: 'coinbase', deps: 'accounts', out: 'address' },
		{ name: 'accounts', deps: 'accounts', out: 'address[]', cache: 'private' },
		{ name: 'receipt', rpc: 'getTransactionReceipt', params: ['hash'], deps: 'state', out: 'receipt' },

		{ name: 'block', rpc: { n: 'getBlockByNumber', hash: 'getBlockByHash' }, params: [['n', 'hash']], out: 'block' },
		{ name: 'blockTransactionCount', rpc: { n: 'getBlockTransactionCountByNumber', hash: 'getBlockTransactionCountByHash' }, params: [['n', 'hash']], out: 'n' },
		{ name: 'uncleCount', rpc: { n: 'getUncleCountByBlockNumber', hash: 'getUncleCountByBlockHash' }, params: [['n', 'hash']], out: 'n' },
		{ name: 'uncle', rpc: { n: 'getUncleByBlockNumber', hash: 'getUncleByBlockHash' }, params: [['n', 'hash'], 'n'], out: 'block' },
		{ name: 'transaction', rpc: { n_n: 'getTransactionByBlockNumberAndIndex', hash_n: 'getTransactionByBlockHashAndIndex', hash_: 'getTransactionByHash' }, params: [['n', 'hash'], ['n', null]], out: 'tx' },

		{ name: 'balance', rpc: 'getBalance', params: ['address'], deps: 'state', out: 'N' },
		{ name: 'code', rpc: 'getCode', params: ['address'], deps: 'state', out: 'data' },
		{ name: 'nonce', rpc: 'getTransactionCount', params: ['address'], deps: 'state', out: 'n' },
		{ name: 'storageAt', rpc: 'getStorageAt', params: ['address', 'hash'], deps: 'state', out: 'N' },

		{ name: 'syncing', deps: 'syncing', out: 'b' },
		{ name: 'hashrate', deps: 'authoring', out: 'n' },
		{ name: 'authoring', rpc: 'mining', deps: 'authoring', out: 'b' },
		{ name: 'ethProtocolVersion', rpc: 'protocolVersion', out: 'n' },
		{ name: 'gasPrice', deps: 'head', out: 'N' },
		{ name: 'estimateGas', deps: 'head', params: ['tx'], cache: false, out: 'N' }
	];

	let defaultAccountApis = [
		{ name: 'defaultAccount', rpc: ['parity', 'defaultAccount'], deps: 'accounts', out: 'address', cache: 'private' }
	];

	let parityApis = [
		// parity_
		{ name: 'accountsInfo', rpc: ['parity', 'accountsInfo'], deps: 'accounts', out: 'address{accountInfo}' },

		{ name: 'hashContent', rpc: ['parity', 'hashContent'], params: ['url'], out: 'hash' },
		{ name: 'allAccountsInfo', rpc: ['parity', 'allAccountsInfo'], deps: 'accounts', out: 'address{accountInfo}' },
		{ name: 'hardwareAccountsInfo', rpc: ['parity', 'hardwareAccountsInfo'], deps: 'hardwareAccounts', out: 'address{accountInfo}' },
		{ name: 'mode', rpc: ['parity', 'mode'], deps: 'mode', out: 's' },
		{ name: 'gasPriceHistogram', rpc: ['parity', 'gasPriceHistogram'], deps: 'head', out: 'gasPriceHistogram' },

		// ...authoring
		{ name: 'defaultExtraData', rpc: ['parity', 'defaultExtraData'], deps: 'authoring', out: 'data' },
		{ name: 'extraData', rpc: ['parity', 'extraData'], deps: 'authoring', out: 'data' },
		{ name: 'gasCeilTarget', rpc: ['parity', 'gasCeilTarget'], deps: 'authoring', out: 'N' },
		{ name: 'gasFloorTarget', rpc: ['parity', 'gasFloorTarget'], deps: 'authoring', out: 'N' },
		{ name: 'minGasPrice', rpc: ['parity', 'minGasPrice'], deps: 'authoring', out: 'N' },
		{ name: 'transactionsLimit', rpc: ['parity', 'transactionsLimit'], deps: 'authoring', out: 'n' },

		// ...chain info
		{ name: 'chainName', rpc: ['parity', 'netChain'], out: 's' },
		{ name: 'chainStatus', rpc: ['parity', 'chainStatus'], deps: 'syncing', out: 'chainStatus' },
		{ name: 'registryAddress', rpc: ['parity', 'registryAddress'], out: 'address' },

		// ...networking
		{ name: 'peers', rpc: ['parity', 'netPeers'], deps: 'peers', out: 'peer[]' },
		{ name: 'enode', rpc: ['parity', 'enode'], out: 's' },
		{ name: 'nodePort', rpc: ['parity', 'netPort'], out: 'n' },
		{ name: 'nodeName', rpc: ['parity', 'nodeName'], out: 's' },
		{ name: 'signerPort', rpc: ['parity', 'signerPort'], out: 'n' },
		{ name: 'dappsPort', rpc: ['parity', 'dappsPort'], out: 'n' },
		{ name: 'dappsInterface', rpc: ['parity', 'dappsInterface'], out: 's' },

		// ...transaction queue
		{ name: 'nextNonce', rpc: ['parity', 'nextNonce'], params: ['address'], deps: 'pending', out: 'n' },
		{ name: 'pending', rpc: ['parity', 'pendingTransactions'], deps: 'pending', out: 'tx[]' },
		{ name: 'local', rpc: ['parity', 'localTransactions'], deps: 'pending', out: '{{tx}}' },
		{ name: 'future', rpc: ['parity', 'futureTransactions'], deps: 'pending', out: '{tx}' },
		{ name: 'pendingStats', rpc: ['parity', 'pendingTransactionsStats'], deps: 'pending', out: 'hash{stats}' },
		{ name: 'unsignedCount', rpc: ['parity', 'unsignedTransactionsCount'], params: [], deps: 'unsigned', out: 'n' },

		// ...auto-update
		{ name: 'releasesInfo', rpc: ['parity', 'releasesInfo'], deps: 'state', out: '{versionInfo}' },	// TODO: should be releasesInfo object because it has 'fork' key
		{ name: 'versionInfo', rpc: ['parity', 'versionInfo'], deps: 'state', out: 'versionInfo' },
		{ name: 'consensusCapability', rpc: ['parity', 'consensusCapability'], deps: 'state', out: 's' },
		{ name: 'upgradeReady', rpc: ['parity', 'upgradeReady'], deps: 'state', out: 'upgradeInfo' }
	];

	bonds.time = new oo7.TimeBond;

	function declareApi (api) {
		declare(typeof api.pubsub === 'boolean' ? api.pubsub : true,
			api.name, api.rpc, api.args, api.params,
			bondifiedDeps(api.deps), subsFromValue(api.out),
			prettifyValueFromRpcTransform(api.out),
			typeof api.cache !== 'undefined' ? api.cache : true
		);
	}

	console.log(`Found API extensions:`, Object.keys(apiExtensions));

	// The regular ones.
	standardApis.forEach(declareApi);

	// Extensions: io.parity/post.
	let havePost = apiExtensions['io.parity/post'];
	bonds.post = tx => new Transaction(tx, havePost);
	bonds.sign = (message, from = bonds.me) => new Signature(message, from, havePost);

	// Extensions: io.parity/defaultAccount.
	if (apiExtensions['io.parity/defaultAccount']) {
		defaultAccountApis.forEach(declareApi);
	} else {
		bonds.defaultAccount = bonds.accounts[0];
	}

	// All the other parity API extensions.
	if (apiExtensions['io.parity/rest']) {
		console.log('Parity provider detected.');
		parityApis.forEach(declareApi);
	} else {
		console.log('Parity provider not detected; Polyfilling Parity APIs...');

		// polyfill the essential bits.
		bonds.accountsInfo = bonds.accounts.map(addresses => {
			let r = {};
			addresses.forEach((a, i) => r[a] = { name: `Anonymous ${i + 1}` });
			return r;
		});
		bonds.registryAddress = bonds.chainId.map(id =>
			id === 42
				? '0xfAb104398BBefbd47752E7702D9fE23047E1Bca3'
			: id === 1
				? '0xe3389675d0338462dC76C6f9A3e432550c36A142'
			: '');
	}

	// Synonyms.
	bonds.blockNumber = bonds.height;						// a synonym.
	bonds.findBlock = bonds.block;							// a synonym.
	bonds.me = bonds.defaultAccount;						// a synonym.

	bonds.fromUuid = function (uuid) {
		if (uuid.startsWith(options.prefix)) {
			let name = uuid.substr(21);
			if (oo7.Bond.instanceOf(bonds[name])) {
				return bonds[name];
			}
			let matched = name.match(/^(.*)\((.*)\)$/);
			if (matched) {
				let name = matched[1];
				let args = matched[2].split(',');

				let types = paramTypes[name];
				if (types.length != args.length) {
					console.warn(`Registered param types for ${name} differ in number to args passed`, types, args);
					return null;
				}
				args = args.map((a, i) => deuuidify(types[i], a));
				// TODO: PROBABLY NOT SAFE. USE A WHITELIST.
				if (typeof bonds[name] === 'function') {
					let b = bonds[name].apply(bonds, args);
					if (oo7.Bond.instanceOf(b)) {
						return b;
					} else {
						console.warn(`bond.${name}() is not a Bond`);
					}
				} else {
					console.warn(`${name} is not a function`);
				}
			} else {
				console.warn('Unknown UUID', name);
			}
		}
		return null;
	}

	// trace TODO: Implement contract object with new trace_many feature
	bonds.replayTx = ((x, whatTrace) => new TransformBond((x, whatTrace) => api().trace.replayTransaction(x, whatTrace), [x, whatTrace], []).subscriptable());
	bonds.callTx = ((x, whatTrace, blockNumber) => new TransformBond((x, whatTrace, blockNumber) => api().trace.call(x, whatTrace, blockNumber), [x, whatTrace, blockNumber], []).subscriptable());

	function traceCall (addr, method, args, options) {
		let data = util.abiEncode(method.name, method.inputs.map(f => f.type), args);
		let decode = d => util.abiDecode(method.outputs.map(f => f.type), d);
		let traceMode = options.traceMode;
		delete options.traceMode;
		return api().trace.call(overlay({to: addr, data: data}, options), traceMode, 'latest');
	};

	class DeployContract extends oo7.ReactivePromise {
		constructor(initBond, abiBond, optionsBond) {
			super([initBond, abiBond, optionsBond, bonds.registry], [], ([init, abi, options, registry]) => {
				options.data = init;
				delete options.to;
				let progress = this.trigger.bind(this);
				transactionPromise(options, progress, status => {
					if (status.confirmed) {
						status.deployed = bonds.makeContract(status.confirmed.contractAddress, abi, options.extras || []);
					}
					return status;
				});
				// TODO: consider allowing registry of the contract here.
			}, false);
			this.then(_ => null);
		}
		isDone(s) {
			return !!(s.failed || s.confirmed);
		}
	}

	bonds.deployContract = function(init, abi, options = {}) {
		return new DeployContract(init, abi, options);
	}

	// TODO: optional caching here.
	bonds.makeContract = function(address, abi, extras = [], debug = false) {
		var r = { address: address };
		let unwrapIfOne = a => a.length == 1 ? a[0] : a;
		abi.forEach(i => {
			if (i.type == 'function' && i.constant) {
				let f = function (...args) {
					var options = args.length === i.inputs.length + 1 ? args.pop() : {};
					if (args.length != i.inputs.length)
						throw new Error(`Invalid number of arguments to ${i.name}. Expected ${i.inputs.length}, got ${args.length}.`);
					let f = (addr, ...fargs) => debug
						? traceCall(address, i, args, options)
						: call(addr, i, fargs, options)
						.then(rets => rets.map((r, o) => cleanup(r, i.outputs[o].type, api)))
						.then(unwrapIfOne);
					return new TransformBond(f, [address, ...args], [bonds.height]).subscriptable();	// TODO: should be subscription on contract events
				};
				r[i.name] = (i.inputs.length === 0) ? memoized(f) : (i.inputs.length === 1) ? presub(f) : f;
				r[i.name].args = i.inputs;
			}
		});
		extras.forEach(i => {
			let f = function (...args) {
				let expectedInputs = (i.numInputs || i.args.length);
				var options = args.length === expectedInputs + 1 ? args.pop() : {};
				if (args.length != expectedInputs)
					throw new Error(`Invalid number of arguments to ${i.name}. Expected ${expectedInputs}, got ${args.length}. ${args}`);
				let c = abi.find(j => j.name == i.method);
				let f = (addr, ...fargs) => {
					let args = i.args.map((v, index) => v === null ? fargs[index] : typeof(v) === 'function' ? v(fargs[index]) : v);
					return debug
									? traceCall(address, i, args, options)
									: call(addr, c, args, options).then(unwrapIfOne);
				};
				return new TransformBond(f, [address, ...args], [bonds.height]).subscriptable();	// TODO: should be subscription on contract events
			};
			r[i.name] = (i.args.length === 1) ? presub(f) : f;
			r[i.name].args = i.args;
		});
		abi.forEach(i => {
			if (i.type == 'function' && !i.constant) {
				r[i.name] = function (...args) {
					var options = args.length === i.inputs.length + 1 ? args.pop() : {};
					if (args.length !== i.inputs.length)
						throw new Error(`Invalid number of arguments to ${i.name}. Expected ${i.inputs.length}, got ${args.length}. ${args}`);
					return debug
									? traceCall(address, i, args, options)
									: post(address, i, args, options).subscriptable();
				};
				r[i.name].args = i.inputs;
			}
		});
		var eventLookup = {};
		abi.filter(i => i.type == 'event').forEach(i => {
			eventLookup[util.abiSignature(i.name, i.inputs.map(f => f.type))] = i.name;
		});

		function prepareIndexEncode(v, t, top = true) {
			if (v instanceof Array) {
				if (top) {
					return v.map(x => prepareIndexEncode(x, t, false));
				} else {
					throw new Error('Invalid type');
				}
			}
			var val;
			if (t == 'string' || t == 'bytes') {
				val = util.sha3(v);
			} else {
				val = util.abiEncode(null, [t], [v]);
			}
			if (val.length != 66) {
				throw new Error('Invalid length');
			}
			return val;
		}

		abi.forEach(i => {
			if (i.type == 'event') {
				r[i.name] = function (indexed = {}, params = {}) {
					return new TransformBond((addr, indexed) => {
						var topics = [util.abiSignature(i.name, i.inputs.map(f => f.type))];
						i.inputs.filter(f => f.indexed).forEach(f => {
							try {
								topics.push(indexed[f.name] ? prepareIndexEncode(indexed[f.name], f.type) : null);
							}
							catch (e) {
								throw new Error(`Couldn't encode indexed parameter ${f.name} of type ${f.type} with value ${indexed[f.name]}`);
							}
						});
						return api().eth.getLogs({
							address: addr,
							fromBlock: params.fromBlock || 0,
							toBlock: params.toBlock || 'pending',
							limit: params.limit || 10,
							topics: topics
						}).then(logs => logs.map(l => {
							l.blockNumber = +l.blockNumber;
							l.transactionIndex = +l.transactionIndex;
							l.logIndex = +l.logIndex;
							l.transactionLogIndex = +l.transactionLogIndex;
							var e = {};
							let unins = i.inputs.filter(f => !f.indexed);
							util.abiDecode(unins.map(f => f.type), l.data).forEach((v, j) => {
								let f = unins[j];
								if (v instanceof Array && !f.type.endsWith(']')) {
									v = util.bytesToHex(v);
								}
								if (f.type.substr(0, 4) == 'uint' && +f.type.substr(4) <= 48) {
									v = +v;
								}
								e[f.name] = v;
							});
							i.inputs.filter(f => f.indexed).forEach((f, j) => {
								if (f.type == 'string' || f.type == 'bytes') {
									e[f.name] = l.topics[1 + j];
								} else {
									var v = util.abiDecode([f.type], l.topics[1 + j])[0];
									if (v instanceof Array) {
										v = util.bytesToHex(v);
									}
									if (f.type.substr(0, 4) == 'uint' && +f.type.substr(4) <= 48) {
										v = +v;
									}
									e[f.name] = v;
								}
							});
							e.event = eventLookup[l.topics[0]];
							e.log = l;
							return e;
						}));
					}, [address, indexed], [bonds.height]).subscriptable();
				};
				r[i.name].args = i.inputs;
			}
		});
		return r;
	};

	bonds.registry = bonds.makeContract(bonds.registryAddress, RegistryABI, RegistryExtras);
	bonds.githubhint = bonds.makeContract(bonds.registry.lookupAddress('githubhint', 'A'), GitHubHintABI);
	bonds.operations = bonds.makeContract(bonds.registry.lookupAddress('operations', 'A'), OperationsABI);
	bonds.badgereg = bonds.makeContract(bonds.registry.lookupAddress('badgereg', 'A'), BadgeRegABI);
	bonds.tokenreg = bonds.makeContract(bonds.registry.lookupAddress('tokenreg', 'A'), TokenRegABI);

	bonds.badges = new TransformBond(n => {
		var ret = [];
		for (var i = 0; i < +n; ++i) {
			let id = i;
			ret.push(oo7.Bond.all([
					bonds.badgereg.badge(id),
					bonds.badgereg.meta(id, 'IMG'),
					bonds.badgereg.meta(id, 'CAPTION')
				]).map(([[addr, name, owner], img, caption]) => ({
					id,
					name,
					img,
					caption,
					addr
				}))
			);
		}
		return ret;
	}, [bonds.badgereg.badgeCount()], [], 1, undefined, caching('badges'));

	bonds.badgesOf = address => new TransformBond(
		(addr, bads) => bads.map(b => ({
			certified: bonds.makeContract(b.addr, BadgeABI).certified(addr),
			badge: b.badge,
			id: b.id,
			img: b.img,
			caption: b.caption,
			name: b.name
		})),
		[address, bonds.badges], [], 2
	).map(all => all.filter(_ => _.certified));

	bonds.tokens = new TransformBond(n => {
		var ret = [];
		for (var i = 0; i < +n; ++i) {
			let id = i;
			ret.push(oo7.Bond.all([
					bonds.tokenreg.token(id),
					bonds.tokenreg.meta(id, 'IMG'),
					bonds.tokenreg.meta(id, 'CAPTION')
				]).map(([[addr, tla, base, name, owner], img, caption]) => ({
					id,
					tla,
					base,
					name,
					img,
					caption,
					addr
				}))
			);
		}
		return ret;
	}, [bonds.tokenreg.tokenCount()], [], 1, undefined, caching('tokens'));

	bonds.tokensOf = address => new TransformBond(
		(addr, bads) => bads.map(b => ({
			balance: bonds.makeContract(b.addr, TokenABI).balanceOf(addr),
			token: b.token,
			id: b.id,
			name: b.name,
			tla: b.tla,
			base: b.base,
			img: b.img,
			caption: b.caption,
		})),
		[address, bonds.tokens], [], 2
	).map(all => all.filter(_ => _.balance.gt(0)));

	bonds.namesOf = address => new TransformBond((reg, addr, accs) => ({
		owned: accs[addr] ? accs[addr].name : null,
		registry: reg || null
	}), [bonds.registry.reverse(address), address, bonds.accountsInfo]);

	bonds.registry.names = oo7.Bond.mapAll([bonds.registry.ReverseConfirmed({}, {limit: 100}), bonds.accountsInfo],
		(reg, info) => {
			let r = {};
			Object.keys(info).forEach(k => r[k] = info[k].name);
			reg.forEach(a => r[a.reverse] = bonds.registry.reverse(a.reverse));
			return r;
		}, 1, undefined, caching('names'))

	bonds.createProxy = singleton(function () {
		return new oo7.BondProxy(options.prefix, bonds.fromUuid);
	});

	return bonds;
}

const t = defaultProvider();
var options = t ? { api: new ParityApi(t), prefix: DEFAULT_PREFIX, privatePrefix: DEFAULT_PRIVATE_PREFIX } : null;
const bonds = options ? createBonds(options) : null;

const asciiToHex = ParityApi.util.asciiToHex;
const bytesToHex = ParityApi.util.bytesToHex;
const hexToAscii = ParityApi.util.hexToAscii;
const isAddressValid = h => oo7.Bond.instanceOf(h) ? h.map(ParityApi.util.isAddressValid) : ParityApi.util.isAddressValid(h);
const toChecksumAddress = h => oo7.Bond.instanceOf(h) ? h.map(ParityApi.util.toChecksumAddress) : ParityApi.util.toChecksumAddress(h);
const sha3 = h => oo7.Bond.instanceOf(h) ? h.map(ParityApi.util.sha3) : ParityApi.util.sha3(h);

const isOwned = addr => oo7.Bond.mapAll([addr, bonds.accounts], (a, as) => as.indexOf(a) !== -1);
const isNotOwned = addr => oo7.Bond.mapAll([addr, bonds.accounts], (a, as) => as.indexOf(a) === -1);

////
// Parity Utilities

// TODO: move to parity.js, repackage or repot.

function capitalizeFirstLetter(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function singleton(f) {
    var instance = null;
    return function() {
        if (instance === null)
            instance = f();
        return instance;
    }
}

const denominations = [ 'wei', 'Kwei', 'Mwei', 'Gwei', 'szabo', 'finney', 'ether', 'grand', 'Mether', 'Gether', 'Tether', 'Pether', 'Eether', 'Zether', 'Yether', 'Nether', 'Dether', 'Vether', 'Uether' ];

function denominationMultiplier(s) {
    let i = denominations.indexOf(s);
    if (i < 0)
        throw new Error('Invalid denomination');
    return (new BigNumber(1000)).pow(i);
}

function interpretRender(s, defaultDenom = 6) {
    try {
        let m = s.toLowerCase().match(/([0-9,]+)(\.([0-9]*))? *([a-zA-Z]+)?/);
		let di = m[4] ? denominations.indexOf(m[4]) : defaultDenom;
		if (di === -1) {
			return null;
		}
		let n = (m[1].replace(',', '').replace(/^0*/, '')) || '0';
		let d = (m[3] || '').replace(/0*$/, '');
		return { denom: di, units: n, decimals: d, origNum: m[1] + (m[2] || ''), origDenom: m[4] || '' };
    }
    catch (e) {
        return null;
    }
}

function combineValue(v) {
	let d = (new BigNumber(1000)).pow(v.denom);
	let n = v.units;
	if (v.decimals) {
		n += v.decimals;
		d = d.div((new BigNumber(10)).pow(v.decimals.length));
	}
	return new BigNumber(n).mul(d);
}

function defDenom(v, d) {
	if (v.denom === null) {
		v.denom = d;
	}
	return v;
}

function formatValue(n) {
	return `${formatValueNoDenom(n)} ${denominations[n.denom]}`;
}

function formatValueNoDenom(n) {
	return `${n.units.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,')}${n.decimals ? '.' + n.decimals : ''}`;
}

function formatToExponential(v, n) {
	return new BigNumber(v).toExponential(4);
}

function interpretQuantity(s) {
    try {
        let m = s.toLowerCase().match(/([0-9,]+)(\.([0-9]*))? *([a-zA-Z]+)?/);
        let d = denominationMultiplier(m[4] || 'ether');
        let n = +m[1].replace(',', '');
		if (m[2]) {
			n += m[3];
			for (let i = 0; i < m[3].length; ++i) {
	            d = d.div(10);
	        }
		}
        return new BigNumber(n).mul(d);
    }
    catch (e) {
        return null;
    }
}

function splitValue(a) {
	var i = 0;
	var a = new BigNumber('' + a);
	if (a.gte(new BigNumber('10000000000000000')) && a.lt(new BigNumber('100000000000000000000000')) || a.eq(0))
		i = 6;
	else
		for (var aa = a; aa.gte(1000) && i < denominations.length - 1; aa = aa.div(1000))
			i++;

	for (var j = 0; j < i; ++j)
		a = a.div(1000);

	return {base: a, denom: i};
}

function formatBalance(n) {
	let a = splitValue(n);
//	let b = Math.floor(a.base * 1000) / 1000;
	return `${a.base} ${denominations[a.denom]}`;
}

function formatBlockNumber(n) {
    return '#' + ('' + n).replace(/(\d)(?=(\d{3})+$)/g, '$1,');
}

function isNullData(a) {
	return !a || typeof(a) !== 'string' || a.match(/^(0x)?0+$/) !== null;
}

function splitSignature (sig) {
	if ((sig.substr(2, 2) === '1b' || sig.substr(2, 2) === '1c') && (sig.substr(66, 2) !== '1b' && sig.substr(66, 2) !== '1c')) {
		// vrs
		return [sig.substr(0, 4), `0x${sig.substr(4, 64)}`, `0x${sig.substr(68, 64)}`];
	} else {
		// rsv
		return [`0x${sig.substr(130, 2)}`, `0x${sig.substr(2, 64)}`, `0x${sig.substr(66, 64)}`];
	}
};

function removeSigningPrefix (message) {
	if (!message.startsWith('\x19Ethereum Signed Message:\n')) {
		throw new Error('Invalid message - doesn\'t contain security prefix');
	}
	for (var i = 1; i < 6; ++i) {
		if (message.length == 26 + i + +message.substr(26, i)) {
			return message.substr(26 + i);
		}
	}
	throw new Error('Invalid message - invalid security prefix');
};

function cleanup (value, type = 'bytes32', api = parity.api) {
	// TODO: make work with arbitrary depth arrays
	if (value instanceof Array && type.match(/bytes[0-9]+/)) {
		// figure out if it's an ASCII string hiding in there:
		var ascii = '';
		for (var i = 0, ended = false; i < value.length && ascii !== null; ++i) {
			if (value[i] === 0) {
				ended = true;
			} else {
				ascii += String.fromCharCode(value[i]);
			}
			if ((ended && value[i] !== 0) || (!ended && (value[i] < 32 || value[i] >= 128))) {
				ascii = null;
			}
		}
		value = ascii === null ? '0x' + value.map(n => ('0' + n.toString(16)).slice(-2)).join('') : ascii;
	}
	if (type.substr(0, 4) == 'uint' && +type.substr(4) <= 48) {
		value = +value;
	}
	return value;
}

function extensions() {
	denominations.forEach((n, i) => {
		Object.defineProperty(Number.prototype, n, { get: function () { return new BigNumber(this).mul(new BigNumber(1000).pow(i)); } });
	});
}

module.exports = {
	// Bonds stuff
	abiPolyfill, options, bonds, Bonds, createBonds, ParityApi, extensions,

	// Util functions
	asciiToHex, bytesToHex, hexToAscii, isAddressValid, toChecksumAddress, sha3,
	isOwned, isNotOwned, capitalizeFirstLetter, singleton, denominations,
	denominationMultiplier, interpretRender, combineValue, defDenom,
	formatValue, formatValueNoDenom, formatToExponential, interpretQuantity,
	splitValue, formatBalance, formatBlockNumber, isNullData, splitSignature,
	removeSigningPrefix, cleanup,

	// ABIs
	RegistryABI, RegistryExtras, GitHubHintABI, OperationsABI,
	BadgeRegABI, TokenRegABI, BadgeABI, TokenABI
};
