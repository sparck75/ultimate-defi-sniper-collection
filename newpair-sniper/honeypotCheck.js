var Web3 = require('web3'); 
let web3 = null;
let tokenName = '';
let tokenSymbol = '';
let tokenDecimals = 0;
let maxSell = 0;
let maxTXAmount = 0;
let bnbIN = 1000000000000000000;
let maxTxBNB = null;


const HttpApi = process.env.BscHttpApi || 'https://bsc-dataseed1.binance.org:443';
web3 = new Web3(HttpApi);

function encodeBasicFunction(web3, funcName) {
    return web3.eth.abi.encodeFunctionCall({
        name: funcName,
        type: 'function',
        inputs: []
    }, []);
}

async function updateTokenInformation(web3, tokenAddress) {
    console.log("updateTokenInformation")
    web3.eth.call({
        to: tokenAddress,
        value: 0,
        gas: 150000,
        data: encodeBasicFunction(web3, 'name'),
    })
        .then(value => {
            tokenName = web3.eth.abi.decodeParameter('string', value);
        });

    web3.eth.call({
        to: tokenAddress,
        value: 0,
        gas: 150000,
        data: encodeBasicFunction(web3, 'symbol'),
    })
        .then(value => {
            tokenSymbol = web3.eth.abi.decodeParameter('string', value);
        });
}

async function honeyPotIS2(address) {
    x = updateTokenInformation(web3, address);
    await getMaxes(address);
    if (maxTXAmount != 0 || maxSell != 0) {
        await getDecimals(address);
        await getBNBIn(address);
    }
    await honeypotIs(address);
    await x;
    //console.log(honeypotCheck.result)
}

async function getDecimals(address) {
    console.log("getDecimals")
    let sig = encodeBasicFunction(web3, 'decimals');
    d = {
        to: address,
        from: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
        value: 0,
        gas: 15000000,
        data: sig,
    };
    try {
        let val = await web3.eth.call(d);
        tokenDecimals = web3.utils.hexToNumber(val);
    } catch (e) {
        console.log('decimals', e);
    }
}

async function getBNBIn(address) {
    console.log("getBNBIn")

    let amountIn = maxTXAmount;
    if (maxSell != 0) {
        amountIn = maxSell;
    }
    let WETH = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
    let path = [address, WETH];
    let sig = web3.eth.abi.encodeFunctionCall({
        name: 'getAmountsOut',
        type: 'function',
        inputs: [
            { type: 'uint256', name: 'amountIn' },
            { type: 'address[]', name: 'path' },
        ],
        outputs: [
            { type: 'uint256[]', name: 'amounts' },
        ],
    }, [amountIn, path]);

    d = {
        to: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
        from: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
        value: 0,
        gas: 15000000,
        data: sig,
    };
    try {
        let val = await web3.eth.call(d);
        let decoded = web3.eth.abi.decodeParameter('uint256[]', val);
        bnbIN = web3.utils.toBN(decoded[1]);
        maxTxBNB = bnbIN;
    } catch (e) {
        console.log(e);
    }
}

async function getMaxes(address) {
    console.log("getMaxes")

    let sig = web3.eth.abi.encodeFunctionSignature({ name: '_maxTxAmount', type: 'function', inputs: [] });
    d = {
        to: address,
        from: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
        value: 0,
        gas: 15000000,
        data: sig,
    };
    try {
        let val = await web3.eth.call(d);
        maxTXAmount = web3.utils.toBN(val);
    } catch (e) {
        sig = web3.eth.abi.encodeFunctionSignature({ name: 'maxSellTransactionAmount', type: 'function', inputs: [] });
        d = {
            to: address,
            from: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
            value: 0,
            gas: 15000000,
            data: sig,
        };
        try {
            let val2 = await web3.eth.call(d);
            maxSell = web3.utils.toBN(val2);
        } catch (e) {

        }
    }
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function honeypotIs(address) {
    console.log("honeypotIs")

    let addressToOutput = address;
    let encodedAddress = web3.eth.abi.encodeParameter('address', address);
    let contractFuncData = '0xd66383cb';
    let callData = contractFuncData + encodedAddress.substring(2);

    let blacklisted = {
        '0xa914f69aef900beb60ae57679c5d4bc316a2536a': 'SPAMMING SCAM',
        '0x105e62565a31c269439b29371df4588bf169cef5': 'SCAM',
        '0xbbd1d56b4ccab9302aecc3d9b18c0c1799fe7525': 'Error: TRANSACTION_FROM_FAILED'
    };
    let unableToCheck = {
        '0x54810d2e8d3a551c8a87390c4c18bb739c5b2063': 'Coin does not utilise PancakeSwap',
        '0x7e946ee89a58691f0d21320ec8f684e29b890037': 'Honeypot cant check this token right now',
        '0xaA7836830a58bC9A90Ed0b412B31c2B84F1eaCBE': 'Honeypot cant check this token right now due to anti-bot measures',
        '0xc0834ee3f6589934dc92c63a893b4c4c0081de06': 'Due to anti-bot, Honeypot is not able to check at the moment.'
    };

    if (blacklisted[address.toLowerCase()] !== undefined) {
        let reason = blacklisted[address.toLowerCase()];
        console.log("blacklisted")
        return;
    }
    if (unableToCheck[address.toLowerCase()] !== undefined) {
        let rreason = unableToCheck[address.toLowerCase()];
        console.log("blacklisted")
        return;
    }

    let val = 100000000000000000;
    if (bnbIN < val) {
        val = bnbIN - 1000;
    }
    web3.eth.call({
        to: '0x2bf75fd2fab5fc635a4c6073864c708dfc8396fc',
        from: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
        value: val,
        gas: 45000000,
        data: callData,
    })
        .then((val) => {
            let warnings = [];
            let decoded = web3.eth.abi.decodeParameters(['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'], val);
            let buyExpectedOut = web3.utils.toBN(decoded[0]);
            let buyActualOut = web3.utils.toBN(decoded[1]);
            let sellExpectedOut = web3.utils.toBN(decoded[2]);
            let sellActualOut = web3.utils.toBN(decoded[3]);
            let buyGasUsed = web3.utils.toBN(decoded[4]);
            let sellGasUsed = web3.utils.toBN(decoded[5]);
            buy_tax = Math.round((buyExpectedOut - buyActualOut) / buyExpectedOut * 100 * 10) / 10;
            sell_tax = Math.round((sellExpectedOut - sellActualOut) / sellExpectedOut * 100 * 10) / 10;
            if (buy_tax + sell_tax > 80) {
                warnings.push("Extremely high tax. Effectively a honeypot.")
            } else if (buy_tax + sell_tax > 40) {
                warnings.push("Really high tax.");
            }
            if (sellGasUsed > 1500000) {
                warnings.push("Selling costs a lot of gas.");
            }
            let maxdiv = '';
            if (maxTXAmount != 0 || maxSell != 0) {
                let n = 'Max TX';
                let x = maxTXAmount;
                if (maxSell != 0) {
                    n = 'Max Sell';
                    x = maxSell;
                }
                var bnbWorth = '?'
                if (maxTxBNB != null) {
                    bnbWorth = Math.round(maxTxBNB / 10 ** 15) / 10 ** 3;
                }
                var tokens = Math.round(x / 10 ** tokenDecimals);
                maxdiv = n + ': ' + tokens + ' ' + tokenSymbol + ' (~' + bnbWorth + ' BNB)';
            }
            let warningmsg = '';
            let warningMsgExtra = '';
            let uiType = 'success';
            let warningsEncountered = false;
            if (warnings.length > 0) {
                warningsEncountered = true;
                uiType = 'warning';
                warningmsg = 'WARNINGS';
                for (let i = 0; i < warnings.length; i++) {
                    warningmsg += warnings[i];
                }
                warningmsg += ' ';
            }
            const result = {
                honeypot: false,
                address: addressToOutput,
                name: tokenName,
                symbol: tokenSymbol,
                buyGasUsed: numberWithCommas(buyGasUsed),
                sellGasUsed:numberWithCommas(sellGasUsed),
                buytax: buy_tax,
                selltax: sell_tax,
                maxtx: tokens,
                maxbnb: bnbWorth,
                maxsell: maxSell,
                message: warningmsg
            }
            console.log(result)
            //startSnipe(address)
            return true
        })
        .catch(err => {
            const result = {
                honeypot: true,
                address: addressToOutput,
                name: tokenName,
                symbol: tokenSymbol,
                buyGasUsed: '',
                sellGasUsed:'',
                buytax: '',
                selltax: '',
                maxtx: '',
                maxbnb: '',
                maxsell: '',
                message: err
            }
            return false

        });
}


module.exports = {
    honeyPotIS2
};