const Parity = require('@parity/parity.js');

const sha3 = Parity.Api.util.sha3;

const RegistryABI = require('./registry.json');
const RegistryExtras = [
	{ name: 'lookupData', method: 'getData', args: [n => sha3(n.toLowerCase()), null] },
	{ name: 'lookupAddress', method: 'getAddress', args: [n => sha3(n.toLowerCase()), null] },
	{ name: 'lookupUint', method: 'getUint', args: [n => sha3(n.toLowerCase()), null] },
	{ name: 'lookupOwner', method: 'getOwner', args: [n => sha3(n.toLowerCase())] }
];
const GitHubHintABI = require('./githubhint.json');
const OperationsABI = require('./operations.json');
const BadgeABI = require('./badge.json');
const BadgeRegABI = require('./badgereg.json');
const TokenRegABI = require('./tokenreg.json');
const TokenABI = require('./token.json');

// Deprecated.
function abiPolyfill () {
	return {
		registry: RegistryABI,
		registryExtras: RegistryExtras,
		githubhint: GitHubHintABI,
		operations: OperationsABI,
		badgereg: BadgeRegABI,
		tokenreg: TokenRegABI,
		badge: BadgeABI,
		erc20token: TokenABI
	};
}

module.exports = { abiPolyfill, RegistryABI, RegistryExtras, GitHubHintABI, OperationsABI, BadgeRegABI,
	TokenRegABI, BadgeABI, TokenABI};
