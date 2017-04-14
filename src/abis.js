
export function abiPolyfill(api = parity.api) {
	const RegistryABI = [{"constant":true,"inputs":[{"name":"_data","type":"address"}],"name":"canReverse","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_new","type":"address"}],"name":"setOwner","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_name","type":"bytes32"},{"name":"_key","type":"string"},{"name":"_value","type":"bytes32"}],"name":"setData","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_name","type":"string"}],"name":"confirmReverse","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_name","type":"bytes32"}],"name":"reserve","outputs":[{"name":"success","type":"bool"}],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"_name","type":"bytes32"}],"name":"drop","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_name","type":"bytes32"},{"name":"_key","type":"string"}],"name":"getAddress","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_amount","type":"uint256"}],"name":"setFee","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_name","type":"bytes32"},{"name":"_to","type":"address"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_name","type":"bytes32"},{"name":"_key","type":"string"}],"name":"getData","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_name","type":"bytes32"}],"name":"reserved","outputs":[{"name":"reserved","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"drain","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_name","type":"string"},{"name":"_who","type":"address"}],"name":"proposeReverse","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_name","type":"bytes32"}],"name":"hasReverse","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_name","type":"bytes32"},{"name":"_key","type":"string"}],"name":"getUint","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"fee","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_name","type":"bytes32"}],"name":"getOwner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_name","type":"bytes32"}],"name":"getReverse","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_data","type":"address"}],"name":"reverse","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_name","type":"bytes32"},{"name":"_key","type":"string"},{"name":"_value","type":"uint256"}],"name":"setUint","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_name","type":"string"},{"name":"_who","type":"address"}],"name":"confirmReverseAs","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"removeReverse","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_name","type":"bytes32"},{"name":"_key","type":"string"},{"name":"_value","type":"address"}],"name":"setAddress","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Drained","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"FeeChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"name","type":"string"},{"indexed":true,"name":"reverse","type":"address"}],"name":"ReverseProposed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"name","type":"string"},{"indexed":true,"name":"reverse","type":"address"}],"name":"ReverseConfirmed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"name","type":"string"},{"indexed":true,"name":"reverse","type":"address"}],"name":"ReverseRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"name","type":"bytes32"},{"indexed":true,"name":"owner","type":"address"}],"name":"Reserved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"name","type":"bytes32"},{"indexed":true,"name":"oldOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"Transferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"name","type":"bytes32"},{"indexed":true,"name":"owner","type":"address"}],"name":"Dropped","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"name","type":"bytes32"},{"indexed":true,"name":"key","type":"string"},{"indexed":false,"name":"plainKey","type":"string"}],"name":"DataChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"old","type":"address"},{"indexed":true,"name":"current","type":"address"}],"name":"NewOwner","type":"event"}];
	const RegistryExtras = [
		{ name: 'lookupData', method: 'getData', args: [n => api.util.sha3(n.toLowerCase()), null] },
		{ name: 'lookupAddress', method: 'getAddress', args: [n => api.util.sha3(n.toLowerCase()), null] },
		{ name: 'lookupUint', method: 'getUint', args: [n => api.util.sha3(n.toLowerCase()), null] },
		{ name: 'lookupOwner', method: 'getOwner', args: [n => api.util.sha3(n.toLowerCase())] }
	];
	const GitHubHintABI = [{"constant":false,"inputs":[{"name":"_content","type":"bytes32"},{"name":"_url","type":"string"}],"name":"hintURL","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"_content","type":"bytes32"},{"name":"_accountSlashRepo","type":"string"},{"name":"_commit","type":"bytes20"}],"name":"hint","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"entries","outputs":[{"name":"accountSlashRepo","type":"string"},{"name":"commit","type":"bytes20"},{"name":"owner","type":"address"}],"type":"function"},{"constant":false,"inputs":[{"name":"_content","type":"bytes32"}],"name":"unhint","outputs":[],"type":"function"}];
	const OperationsABI = [{"constant":false,"inputs":[{"name":"_client","type":"bytes32"},{"name":"_newOwner","type":"address"}],"name":"resetClientOwner","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_client","type":"bytes32"},{"name":"_release","type":"bytes32"}],"name":"isLatest","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_txid","type":"bytes32"}],"name":"rejectTransaction","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"setOwner","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_number","type":"uint32"},{"name":"_name","type":"bytes32"},{"name":"_hard","type":"bool"},{"name":"_spec","type":"bytes32"}],"name":"proposeFork","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_client","type":"bytes32"}],"name":"removeClient","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_client","type":"bytes32"},{"name":"_release","type":"bytes32"}],"name":"release","outputs":[{"name":"o_forkBlock","type":"uint32"},{"name":"o_track","type":"uint8"},{"name":"o_semver","type":"uint24"},{"name":"o_critical","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_client","type":"bytes32"},{"name":"_checksum","type":"bytes32"}],"name":"build","outputs":[{"name":"o_release","type":"bytes32"},{"name":"o_platform","type":"bytes32"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"rejectFork","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"client","outputs":[{"name":"owner","type":"address"},{"name":"required","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"setClientOwner","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint32"}],"name":"fork","outputs":[{"name":"name","type":"bytes32"},{"name":"spec","type":"bytes32"},{"name":"hard","type":"bool"},{"name":"ratified","type":"bool"},{"name":"requiredCount","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_release","type":"bytes32"},{"name":"_platform","type":"bytes32"},{"name":"_checksum","type":"bytes32"}],"name":"addChecksum","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_txid","type":"bytes32"}],"name":"confirmTransaction","outputs":[{"name":"txSuccess","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"proxy","outputs":[{"name":"requiredCount","type":"uint256"},{"name":"to","type":"address"},{"name":"data","type":"bytes"},{"name":"value","type":"uint256"},{"name":"gas","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_client","type":"bytes32"},{"name":"_owner","type":"address"}],"name":"addClient","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"clientOwner","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_txid","type":"bytes32"},{"name":"_to","type":"address"},{"name":"_data","type":"bytes"},{"name":"_value","type":"uint256"},{"name":"_gas","type":"uint256"}],"name":"proposeTransaction","outputs":[{"name":"txSuccess","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"grandOwner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_release","type":"bytes32"},{"name":"_forkBlock","type":"uint32"},{"name":"_track","type":"uint8"},{"name":"_semver","type":"uint24"},{"name":"_critical","type":"bool"}],"name":"addRelease","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"acceptFork","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"clientsRequired","outputs":[{"name":"","type":"uint32"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_client","type":"bytes32"},{"name":"_release","type":"bytes32"}],"name":"track","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_client","type":"bytes32"},{"name":"_r","type":"bool"}],"name":"setClientRequired","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"latestFork","outputs":[{"name":"","type":"uint32"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_client","type":"bytes32"},{"name":"_track","type":"uint8"}],"name":"latestInTrack","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_client","type":"bytes32"},{"name":"_release","type":"bytes32"},{"name":"_platform","type":"bytes32"}],"name":"checksum","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"proposedFork","outputs":[{"name":"","type":"uint32"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"payable":true,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"data","type":"bytes"}],"name":"Received","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"client","type":"bytes32"},{"indexed":true,"name":"txid","type":"bytes32"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"data","type":"bytes"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"gas","type":"uint256"}],"name":"TransactionProposed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"client","type":"bytes32"},{"indexed":true,"name":"txid","type":"bytes32"}],"name":"TransactionConfirmed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"client","type":"bytes32"},{"indexed":true,"name":"txid","type":"bytes32"}],"name":"TransactionRejected","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"txid","type":"bytes32"},{"indexed":false,"name":"success","type":"bool"}],"name":"TransactionRelayed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"client","type":"bytes32"},{"indexed":true,"name":"number","type":"uint32"},{"indexed":true,"name":"name","type":"bytes32"},{"indexed":false,"name":"spec","type":"bytes32"},{"indexed":false,"name":"hard","type":"bool"}],"name":"ForkProposed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"client","type":"bytes32"},{"indexed":true,"name":"number","type":"uint32"}],"name":"ForkAcceptedBy","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"client","type":"bytes32"},{"indexed":true,"name":"number","type":"uint32"}],"name":"ForkRejectedBy","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"forkNumber","type":"uint32"}],"name":"ForkRejected","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"forkNumber","type":"uint32"}],"name":"ForkRatified","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"client","type":"bytes32"},{"indexed":true,"name":"forkBlock","type":"uint32"},{"indexed":false,"name":"release","type":"bytes32"},{"indexed":false,"name":"track","type":"uint8"},{"indexed":false,"name":"semver","type":"uint24"},{"indexed":true,"name":"critical","type":"bool"}],"name":"ReleaseAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"client","type":"bytes32"},{"indexed":true,"name":"release","type":"bytes32"},{"indexed":true,"name":"platform","type":"bytes32"},{"indexed":false,"name":"checksum","type":"bytes32"}],"name":"ChecksumAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"client","type":"bytes32"},{"indexed":false,"name":"owner","type":"address"}],"name":"ClientAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"client","type":"bytes32"}],"name":"ClientRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"client","type":"bytes32"},{"indexed":true,"name":"old","type":"address"},{"indexed":true,"name":"now","type":"address"}],"name":"ClientOwnerChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"client","type":"bytes32"},{"indexed":false,"name":"now","type":"bool"}],"name":"ClientRequiredChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"old","type":"address"},{"indexed":false,"name":"now","type":"address"}],"name":"OwnerChanged","type":"event"}];
	const BadgeRegABI = [{"constant":false,"inputs":[{"name":"_new","type":"address"}],"name":"setOwner","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_addr","type":"address"},{"name":"_name","type":"bytes32"}],"name":"register","outputs":[{"name":"","type":"bool"}],"payable":true,"type":"function"},{"constant":true,"inputs":[{"name":"_name","type":"bytes32"}],"name":"fromName","outputs":[{"name":"id","type":"uint256"},{"name":"addr","type":"address"},{"name":"owner","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"badgeCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_fee","type":"uint256"}],"name":"setFee","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_id","type":"uint256"},{"name":"_key","type":"bytes32"}],"name":"meta","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"drain","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"uint256"}],"name":"unregister","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"uint256"},{"name":"_newAddr","type":"address"}],"name":"setAddress","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_addr","type":"address"}],"name":"fromAddress","outputs":[{"name":"id","type":"uint256"},{"name":"name","type":"bytes32"},{"name":"owner","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_id","type":"uint256"}],"name":"badge","outputs":[{"name":"addr","type":"address"},{"name":"name","type":"bytes32"},{"name":"owner","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"uint256"},{"name":"_key","type":"bytes32"},{"name":"_value","type":"bytes32"}],"name":"setMeta","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_addr","type":"address"},{"name":"_name","type":"bytes32"},{"name":"_owner","type":"address"}],"name":"registerAs","outputs":[{"name":"","type":"bool"}],"payable":true,"type":"function"},{"constant":true,"inputs":[],"name":"fee","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"name","type":"bytes32"},{"indexed":true,"name":"id","type":"uint256"},{"indexed":false,"name":"addr","type":"address"}],"name":"Registered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"name","type":"bytes32"},{"indexed":true,"name":"id","type":"uint256"}],"name":"Unregistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"id","type":"uint256"},{"indexed":true,"name":"key","type":"bytes32"},{"indexed":false,"name":"value","type":"bytes32"}],"name":"MetaChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"id","type":"uint256"},{"indexed":false,"name":"addr","type":"address"}],"name":"AddressChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"old","type":"address"},{"indexed":true,"name":"current","type":"address"}],"name":"NewOwner","type":"event"}];
	const TokenRegABI = [{"constant":true,"inputs":[{"name":"_id","type":"uint256"}],"name":"token","outputs":[{"name":"addr","type":"address"},{"name":"tla","type":"string"},{"name":"base","type":"uint256"},{"name":"name","type":"string"},{"name":"owner","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_new","type":"address"}],"name":"setOwner","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_addr","type":"address"},{"name":"_tla","type":"string"},{"name":"_base","type":"uint256"},{"name":"_name","type":"string"}],"name":"register","outputs":[{"name":"","type":"bool"}],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"_fee","type":"uint256"}],"name":"setFee","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_id","type":"uint256"},{"name":"_key","type":"bytes32"}],"name":"meta","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_addr","type":"address"},{"name":"_tla","type":"string"},{"name":"_base","type":"uint256"},{"name":"_name","type":"string"},{"name":"_owner","type":"address"}],"name":"registerAs","outputs":[{"name":"","type":"bool"}],"payable":true,"type":"function"},{"constant":true,"inputs":[{"name":"_tla","type":"string"}],"name":"fromTLA","outputs":[{"name":"id","type":"uint256"},{"name":"addr","type":"address"},{"name":"base","type":"uint256"},{"name":"name","type":"string"},{"name":"owner","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"drain","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"tokenCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"uint256"}],"name":"unregister","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_addr","type":"address"}],"name":"fromAddress","outputs":[{"name":"id","type":"uint256"},{"name":"tla","type":"string"},{"name":"base","type":"uint256"},{"name":"name","type":"string"},{"name":"owner","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"uint256"},{"name":"_key","type":"bytes32"},{"name":"_value","type":"bytes32"}],"name":"setMeta","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"fee","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"tla","type":"string"},{"indexed":true,"name":"id","type":"uint256"},{"indexed":false,"name":"addr","type":"address"},{"indexed":false,"name":"name","type":"string"}],"name":"Registered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"tla","type":"string"},{"indexed":true,"name":"id","type":"uint256"}],"name":"Unregistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"id","type":"uint256"},{"indexed":true,"name":"key","type":"bytes32"},{"indexed":false,"name":"value","type":"bytes32"}],"name":"MetaChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"old","type":"address"},{"indexed":true,"name":"current","type":"address"}],"name":"NewOwner","type":"event"}];
	const BadgeABI = [{"constant":true,"inputs":[{"name":"_who","type":"address"},{"name":"_field","type":"string"}],"name":"getData","outputs":[{"name":"","type":"bytes32"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_who","type":"address"},{"name":"_field","type":"string"}],"name":"getAddress","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_who","type":"address"},{"name":"_field","type":"string"}],"name":"getUint","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_who","type":"address"}],"name":"certified","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"who","type":"address"}],"name":"Confirmed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"who","type":"address"}],"name":"Revoked","type":"event"}];
	const TokenABI = [{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"}];
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
