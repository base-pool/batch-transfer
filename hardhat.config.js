require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("hardhat-spdx-license-identifier");
require('hardhat-deploy');
require ('hardhat-abi-exporter');
require("@nomiclabs/hardhat-ethers");
require("dotenv/config")

let accounts = [];
var fs = require("fs");
var read = require('read');
var util = require('util');
const keythereum = require("keythereum");
const prompt = require('prompt-sync')();
(async function() {
    try {
        const root = '.keystore';
        var pa = fs.readdirSync(root);
        for (let index = 0; index < pa.length; index ++) {
            let ele = pa[index];
            let fullPath = root + '/' + ele;
		    var info = fs.statSync(fullPath);
            //console.dir(ele);
		    if(!info.isDirectory() && ele.endsWith(".keystore")){
                const content = fs.readFileSync(fullPath, 'utf8');
                const json = JSON.parse(content);
                const password = prompt('Input password for 0x' + json.address + ': ', {echo: '*'});
                //console.dir(password);
                const privatekey = keythereum.recover(password, json).toString('hex');
                //console.dir(privatekey);
                accounts.push('0x' + privatekey);
                //console.dir(keystore);
		    }
	    }
    } catch (ex) {
    }
    try {
        const file = '.secret';
        var info = fs.statSync(file);
        if (!info.isDirectory()) {
            const content = fs.readFileSync(file, 'utf8');
            let lines = content.split('\n');
            for (let index = 0; index < lines.length; index ++) {
                let line = lines[index];
                if (line == undefined || line == '') {
                    continue;
                }
                if (!line.startsWith('0x') || !line.startsWith('0x')) {
                    line = '0x' + line;
                }
                accounts.push(line);
            }
        }
    } catch (ex) {
    }
})();

module.exports = {
    defaultNetwork: "hardhat",
    abiExporter: {
        path: "./abi",
        clear: false,
        flat: true,
    },
    namedAccounts: {
        deployer: {
            default: 0,
            97: '0x92Ac13DfFf2e421e53dFD2873Ea295EdC9504764',
            56: '0x156F75C8c00532ca3d21443b69d625E1AB90C2eD',
        },
        receiver: {
            default: '0x92Ac13DfFf2e421e53dFD2873Ea295EdC9504764',
            97: '0x92Ac13DfFf2e421e53dFD2873Ea295EdC9504764',
            56: '0x156F75C8c00532ca3d21443b69d625E1AB90C2eD',
        },
    },
    networks: {
        bscmain: {
            url: `https://bsc-dataseed1.defibit.io/`,
            accounts: accounts,
            //gasPrice: 1.3 * 1000000000,
            chainId: 56,
            gasMultiplier: 1.5,
        },
        bsctest: {
            url: `https://data-seed-prebsc-1-s1.binance.org:8545`,
            accounts: accounts,
            //gasPrice: 1.3 * 1000000000,
            chainId: 97,
            tags: ["test"],
        },
        hardhat: {
            forking: {
                enabled: false,
                url: `https://bsc-dataseed1.defibit.io/`
                //url: `https://bsc-dataseed1.ninicoin.io/`,
                //url: `https://bsc-dataseed3.binance.org/`
                //url: `https://data-seed-prebsc-1-s1.binance.org:8545`
            },
            live: true,
            saveDeployments: true,
            tags: ["test", "local"],
            timeout: 2000000,
        }
    },
    solidity: {
        compilers: [
            {
                version: "0.7.4",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    spdxLicenseIdentifier: {
        overwrite: true,
        runOnCompile: true,
    },
    mocha: {
        timeout: 2000000,
    },
    etherscan: {
     apiKey: process.env.BSC_API_KEY,
   }
};
