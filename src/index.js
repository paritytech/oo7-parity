import {Bond, TimeBond, TransformBond} from 'oo7';
import BigNumber from 'bignumber.js';

var api = null;

// TODO: Use more generic means to check on number, ideally push notification.
export class SubscriptionBond extends Bond {
	constructor(rpc) {
		super();
		api.subscribe(rpc, (e, n) => {
//			console.log(`Subscription ${rpc} firing ${+n}`)
			this.trigger(n);
		}).then(id => this.subscription = id);
	}
	drop () {
		api.unsubscribe(this.subscription);
	}
}

export class Transaction extends Bond {
	constructor(tx) {
		super();
		var p = api.parity.postTransaction(tx)
			.then(signerRequestId => {
//		    	console.log('trackRequest', `posted to signer with requestId ${signerRequestId}`);
				this.trigger({requested: signerRequestId});
		    	return api.pollMethod('parity_checkRequest', signerRequestId);
		    })
		    .then(transactionHash => {
//				console.log('trackRequest', `received transaction hash ${transactionHash}`);
				this.trigger({signed: transactionHash});
				return api.pollMethod('eth_getTransactionReceipt', transactionHash, (receipt) => receipt && receipt.blockNumber && !receipt.blockNumber.eq(0));
			})
			.then(receipt => {
//				console.log('trackRequest', `received transaction receipt ${JSON.stringify(receipt)}`);
				this.trigger({confirmed: receipt});
			})
			.catch(error => {
//				console.log('trackRequest', `transaction failed ${JSON.stringify(error)}`);
				this.trigger({failed: error});
			});
	}
}

function overlay(base, top) {
	for (k in Object.keys(top))
		base[k] = top[k];
	return base;
}

function call(addr, method, args, options) {
	let data = parity.api.util.abiEncode(method.name, method.inputs.map(f => f.type), args);
	let decode = d => parity.api.util.abiDecode(method.outputs.map(f => f.type), d);
	return parity.api.eth.call(overlay({to: addr, data: data}, options)).then(decode);
};

function post(addr, method, args, options) {
	let data = parity.api.util.abiEncode(method.name, method.inputs.map(f => f.type), args);
	return new Transaction(overlay({to: addr, data: data}, options));
};

export function setupBonds(_api) {
	api = _api;

	var bonds = {};

    bonds.time = new TimeBond;
	bonds.blockNumber = new SubscriptionBond('eth_blockNumber');
	bonds.blockByNumber = n => new TransformBond(api.eth.getBlockByNumber, [n]);	// TODO: subscribe to chain reorgs that involve block 'n'.
	bonds.block = bonds.blockByNumber(bonds.blockNumber);
	bonds.accountsInfo = new TransformBond(api.parity.accountsInfo, [], [bonds.time]); //new SubscriptionBond('parity_accountsInfo');
    bonds.netChain = new TransformBond(api.parity.netChain, [], [bonds.time]);
    bonds.peerCount = new TransformBond(api.net.peerCount, [], [bonds.time]);
	bonds.coinbase = new TransformBond(api.eth.coinbase, [], [bonds.time]);

	bonds.makeContract = function(address, abi, extras = []) {
		var r = { address: address };
		let unwrapIfOne = a => a.length == 1 ? a[0] : a;
		abi.forEach(i => {
			if (i.type == 'function' && i.constant) {
				r[i.name] = function (...args) {
					var options = args.length === i.inputs.length + 1 ? args.unshift() : {};
					if (args.length != i.inputs.length)
						throw `Invalid number of arguments to ${i.name}. Expected ${i.inputs.length}, got ${args.length}.`;
					let f = (addr, ...fargs) => call(addr, i, fargs, options).then(unwrapIfOne);
					return new TransformBond(f, [address, ...args], [bonds.blockNumber]);	// TODO: should be subscription on contract events
				};
			}
		});
		extras.forEach(i => {
			r[i.name] = function (...args) {
				let expectedInputs = (i.numInputs || i.args.length);
				var options = args.length === expectedInputs + 1 ? args.unshift() : {};
				if (args.length != expectedInputs)
					throw `Invalid number of arguments to ${i.name}. Expected ${expectedInputs}, got ${args.length}.`;
				let c = abi.find(j => j.name == i.method);
				let f = (addr, ...fargs) => {
					let args = i.args.map((v, index) => v === null ? fargs[index] : typeof(v) === 'function' ? v(fargs[index]) : v);
					return call(addr, c, args, options).then(unwrapIfOne);
				};
				return new TransformBond(f, [address, ...args], [bonds.blockNumber]);	// TODO: should be subscription on contract events
			};
		});
		abi.forEach(i => {
			if (i.type == 'function' && !i.constant) {
				r[i.name] = function (...args) {
					var options = args.length === i.inputs.length + 1 ? args.unshift() : {};
					if (args.length !== i.inputs.length)
						throw `Invalid number of arguments to ${i.name}. Expected ${i.inputs.length}, got ${args.length}.`;
					return Promise.all([addr, ...fargs]).then(addrArgs => post(addrArgs[0], i, addrArgs.slice(1), options));
				};
			}
		});
		return r;
	};

	bonds.registry = bonds.makeContract(new TransformBond(api.parity.registryAddress, [], [bonds.time]), api.abi.registry, api.abi.registryExtras);	// TODO should be subscription.
	bonds.githubhint = bonds.makeContract(bonds.registry.lookupAddress('githubhint', 'A'), api.abi.githubhint);
	bonds.operations = bonds.makeContract(bonds.registry.lookupAddress('operations', 'A'), api.abi.operations);

    Function.__proto__.bond = function(...args) { return new TransformBond(this, args); };
    Function.__proto__.timeBond = function(...args) { return new TransformBond(this, args, [parity.bonds.time]); };
    Function.__proto__.blockBond = function(...args) { return new TransformBond(this, args, [parity.bonds.blockNumber]); };

	return bonds;
}

////
// Parity Utilities

// TODO: move to parity.js, repackage or repot.

export function capitalizeFirstLetter(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function singleton(f) {
    var instance = null;
    return function() {
        if (instance === null)
            instance = f();
        return instance;
    }
}

export const denominations = [ "wei", "Kwei", "Mwei", "Gwei", "szabo", "finney", "ether", "grand", "Mether", "Gether", "Tether", "Pether", "Eether", "Zether", "Yether", "Nether", "Dether", "Vether", "Uether" ];

export function denominationMultiplier(s) {
    let i = denominations.indexOf(s);
    if (i < 0)
        throw "Invalid denomination";
    return (new BigNumber(1000)).pow(i);
}

export function interpretQuantity(s) {
    try {
        let m = s.toLowerCase().match('([0-9,.]+) *([a-zA-Z]+)?');
        let d = denominationMultiplier(m[2] || 'ether');
        let n = +m[1].replace(',', '');
        while (n !== Math.round(n)) {
            n *= 10;
            d = d.div(10);
        }
        return new BigNumber(n).mul(d);
    }
    catch (e) {
        return null;
    }
}

export function splitValue(a) {
	var i = 0;
	var a = new BigNumber('' + a);
	if (a.gte(new BigNumber("10000000000000000")) && a.lt(new BigNumber("100000000000000000000000")) || a.eq(0))
		i = 6;
	else
		for (var aa = a; aa.gte(1000) && i < denominations.length - 1; aa = aa.div(1000))
			i++;

	for (var j = 0; j < i; ++j)
		a = a.div(1000);

	return {base: a, denom: i};
}

export function formatBlockNumber(n) {
    return '#' + ('' + n).replace(/(\d)(?=(\d{3})+$)/g, "$1,");
}
