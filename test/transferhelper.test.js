const BigNumber = require('bignumber.js');
const chai = require("chai");
const expect = chai.expect;

describe("TransferHelper", () => {
    before(async function () {
        await deployments.fixture(["TransferHelper"]);
        const {deployer} = await ethers.getNamedSigners();
        const {receiver} = await getNamedAccounts();
        this.deployer = deployer;
        this.receiver = receiver;
        this.addresses = [];
        this.amounts = [];
        for (let i = 0; i < 301; i ++) {
            this.addresses.push('0x97bE3C989Fdc7B281cE39F621e48Aa8b9dF53293');
            this.amounts.push('10000000000000000000000');
        }
        this.transferHelper = await ethers.getContract('TransferHelper');
        this.mockUSDT = await ethers.getContract('MockUSDT');

        let signers = await ethers.getSigners();
        this.from = signers[2];
        this.totalAmount = new BigNumber('0');
        for (amount in this.amounts) {
            amount = this.amounts[amount];
            this.totalAmount = this.totalAmount.plus(new BigNumber(amount));
        }
        await this.mockUSDT.mint(this.from.address, this.totalAmount.toFixed(0));
    });

    beforeEach(async function () {
    });

    it("BatchTransfer", async function() {
        let totalNum = this.addresses.length;
        let maxNum = 300;
        let loopNum = Math.floor(totalNum / maxNum) + (totalNum % maxNum == 0 ? 0 : 1);
        let gasPrice = new BigNumber((await ethers.provider.getGasPrice()).toString());
        let feePercent = new BigNumber((await this.transferHelper.feePercent()).toString());
        let balance = new BigNumber((await ethers.provider.getBalance(this.deployer.address)).toString());
        let nonce = await ethers.provider.getTransactionCount(this.deployer.address);
        let addressArrays = [];
        let amountArrays = [];
        for (let loop = 0; loop < loopNum; loop ++) {
            let startIndex = loop * maxNum;
            let endIndex = (loop + 1) * maxNum;
            addressArrays.push(this.addresses.slice(startIndex, endIndex));
            amountArrays.push(this.amounts.slice(startIndex, endIndex));
        }
        let feeUsedArray = [];
        let gasCostArray = [];
        await this.mockUSDT.connect(this.from).approve(this.transferHelper.address, this.totalAmount.toFixed(0));
        for (let i = 0; i < addressArrays.length; i ++) {
            let addresses = addressArrays[i];
            let amounts = amountArrays[i];
            let gasUsed = new BigNumber((await this.transferHelper.connect(this.deployer).estimateGas.batchTransfer(this.mockUSDT.address, this.from.address, addresses, amounts, false, {value:balance.toFixed(0)})).toString());
            let gasCost = gasUsed.multipliedBy(gasPrice);
            let feeUsed = gasUsed.multipliedBy(gasPrice).multipliedBy(feePercent).dividedBy('1000000000000000000');
            feeUsedArray.push(feeUsed);
            gasCostArray.push(gasCost);
        }
        let totalFeeUsed = new BigNumber('0');
        for (feeUsed in feeUsedArray) {
            feeUsed = feeUsedArray[feeUsed];
            totalFeeUsed = totalFeeUsed.plus(feeUsed);
        }
        let totalGasCost = new BigNumber('0');
        for (gasCost in gasCostArray) {
            gasCost = gasCostArray[gasCost];
            totalGasCost = totalGasCost.plus(gasCost);
        }
        expect(totalGasCost.plus(totalFeeUsed).comparedTo(balance)).to.be.equal(-1);
        let transactions = []
        for (let i = 0; i < addressArrays.length; i ++) {
            let addresses = addressArrays[i];
            let amounts = amountArrays[i];
            let feeUsed = feeUsedArray[i];
            let transaction = await this.transferHelper.connect(this.deployer).populateTransaction.batchTransfer(this.mockUSDT.address, this.from.address, addresses, amounts, false, {value: feeUsed.toFixed(0), nonce: nonce++, gasPrice: gasPrice.toFixed(0)});
            transactions.push(transaction);
        }
        let txs = []
        for (let i = 0; i < transactions.length; i ++) {
            let transaction = transactions[i];
            let tx = await this.deployer.sendTransaction(transaction);
            txs.push(tx);
        }
        for (let i = 0; i < txs.length; i ++) {
            let tx = txs[i];
            tx = await tx.wait();
        }
        expect(await this.mockUSDT.balanceOf(this.from.address)).to.be.equal(0);
    });
});
