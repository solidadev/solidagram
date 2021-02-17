const Solidagram = artifacts.require("Solidagram");

module.exports = function(deployer) {
  deployer.deploy(Solidagram);
};