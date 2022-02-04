"use strict";
const ethers = require("ethers");
const retry = require("async-retry");
const pcsAbi = new ethers.utils.Interface(require("./abi.json"));
const env = require("dotenv");
const result = env.config()
const { approveToken } = require('./approve');
const ora = require('ora');

if (result.error) {
    throw result.error
}

let provider;
let wallet;
let account;
let router;
let spinner;

const buySettings = {
    router: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    buyDelay: 1,
    buyRetries: 3,
    retryMinTimeout: 250,
    retryMaxTimeout: 3000,
    deadline: 60,
};

const buyToken = async (token, purchaseAmount) => {
    provider = new ethers.providers.WebSocketProvider(process.env.BSC_NODE_WSS);
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    account = wallet.connect(provider);
    router = new ethers.Contract(buySettings.router, pcsAbi, account);
    const parsedPurchaseAmount = ethers.utils.parseUnits(purchaseAmount, "ether");
    const buyPair = {
        pair: [
            "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
            token.toString()
        ]
    }
    const tx = await retry(
        async () => {
            spinner = ora(`Buying ${token}`).start();
            const amountOutMin = 0;
            let buyConfirmation = await router.swapExactETHForTokens(
                amountOutMin,
                buyPair.pair,
                process.env.RECIPIENT,
                Date.now() + 1000 * buySettings.deadline,
                {
                    value: parsedPurchaseAmount,
                    gasLimit: process.env.GAS_LIMIT,
                    gasPrice: ethers.utils.parseUnits(process.env.GAS_PRICE, "gwei"),
                }
            );
            return buyConfirmation;
        },
        {
            retries: buySettings.buyRetries,
            minTimeout: buySettings.retryMinTimeout,
            maxTimeout: buySettings.retryMaxTimeout,
            onRetry: (err, number) => {
                spinner.warn("Buy Failed - Retrying", number);
                console.log("Error", err.reason);
                if (number === buySettings.buyRetries) {
                    spinner.fail("Sniping has failed...");
                    console.log("")
                }
            },
        }
    );
    spinner.succeed(`Bought ${token}!`);
    console.log("  Transaction receipt: https://www.bscscan.com/tx/" + tx.hash);
    console.log("  Poocoin chart: https://poocoin.app/tokens/" + token);

    console.log("")
    await approveToken(token);
};

module.exports = {
    buyToken,
};