const BigNumber = require('bignumber.js');
module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    const {deployer} = await ethers.getNamedSigners();
    const {receiver} = await getNamedAccounts();

    let deployResult = await deploy('MockUSDT', {
        from: deployer.address,
        args: ["USDT", "USDT", 18],
        contract: 'MockToken',
        log: true,
    });
};

module.exports.tags = ['MockUSDT'];
module.exports.dependencies = [];
