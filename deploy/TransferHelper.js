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

    let deployResult = await deploy('TransferHelper', {
        from: deployer.address,
        args: [receiver, '1000000000000000'],
        log: true,
    });
};

module.exports.tags = ['TransferHelper'];
module.exports.dependencies = ['MockUSDT'];
