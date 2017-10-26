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
