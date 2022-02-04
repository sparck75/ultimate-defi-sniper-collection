"use strict";
const retry = require("async-retry");
const { approveToken } = require('./approve');

const buySettings = {
    buyDelay: 1,
    buyRetries: 3,
    retryMinTimeout: 250,
    retryMaxTimeout: 3000,
    deadline: 60,
};

async function buyToken (token, purchaseAmount, gasLimit, gasPrice, myAddress, router) {
    const buyPair = {
        pair: [
            "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
            token.toString()
        ]
    }
    const tx = await retry(
        async () => {
            console.log(`Buying ${token}`)
            const amountOutMin = 0;
            let buyConfirmation = await router.swapExactETHForTokens(
                amountOutMin,
                buyPair.pair,
                myAddress,
                Date.now() + 1000 * buySettings.deadline,
                {
                    value: purchaseAmount,
                    gasLimit: gasLimit,
                    gasPrice: gasPrice,
                }
            );
            return buyConfirmation;
        },
        {
            retries: buySettings.buyRetries,
            minTimeout: buySettings.retryMinTimeout,
            maxTimeout: buySettings.retryMaxTimeout,
            onRetry: (err, number) => {
                console.log("Buy Failed - Retrying", number);
                console.log("Error", err.reason);
                if (number === buySettings.buyRetries) {
                    console.log("Sniping has failed...");
                    console.log("")
                }
            },
        }
    );
    console.log(`Bought ${token}!`);
    console.log("  Transaction receipt: https://www.bscscan.com/tx/" + tx.hash);
    console.log("  Poocoin chart: https://poocoin.app/tokens/" + token);

    console.log("")
    await approveToken(token);
};

module.exports = {
    buyToken,
};
