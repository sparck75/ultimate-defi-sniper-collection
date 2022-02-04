const env = require("dotenv");
const result = env.config();
if (result.error) {
  throw result.error;
}
const ethers = require("ethers");
const pcsAbi = new ethers.utils.Interface(require("./abi.json"));
const TOKEN_DECIMALS = process.env.TOKEN_DECIMALS;
const amountIn = ethers.utils.parseUnits(process.env.PURCHASE_AMOUNT, "ether");
const amountOutMin = ethers.utils.parseUnits(process.env.SLIPPAGE, "ether");
const gasPrice = ethers.utils.parseUnits(process.env.GAS_PRICE, "gwei");
const gasLimit = process.env.GAS_LIMIT;
const txNumberForAntibot = process.env.TRANSACTIONS_NUM;
const BSC_NODE_WSS = process.env.BSC_NODE_WSS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const { monitorRugPull, isLiqudityInRange, getWBNBTokenBalance, getTokenBalance, } = require('./lib');
const chalk = require("chalk");
const { honeyPotIS2 } = require('./honeypotCheck')
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const pcsRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const provider = new ethers.providers.WebSocketProvider(BSC_NODE_WSS);
const wallet = new ethers.Wallet(PRIVATE_KEY);
const myAddress = wallet.address;
const account = wallet.connect(provider);
const router = new ethers.Contract(pcsRouter, pcsAbi, account);
const EXPECTED_PONG_BACK = 15000;
const KEEP_ALIVE_CHECK_INTERVAL = 7500;
let passed = 0

async function startSnipe(token) {
    let pingTimeout
    let keepAliveInterval

    provider._websocket.on("open", () => {
        //let bnbBalance = await getWBNBTokenBalance(WBNB, myAddress, provider);
        //console.log(chalk.green(`Total WBNB balance is ${chalk.yellow(parseFloat(ethers.utils.formatUnits(bnbBalance, 18)).toFixed(6))}\n`));

        keepAliveInterval = setInterval(() => {
            provider._websocket.ping();
            pingTimeout = setTimeout(() => {
                provider._websocket.terminate();
            }, EXPECTED_PONG_BACK);
        }, KEEP_ALIVE_CHECK_INTERVAL);

        console.log("Listening on mempool...");
        console.log("Waiting for liquidity to be added!");

        provider.on("pending", async (txHash) => {

            provider.getTransaction(txHash).then(async (tx) => {

                // Check for liquidity events
                if ((null != tx && tx.data.includes("0xe8e33700") && tx.data.includes(token) && 0 == passed) || (null != tx && tx.data.includes("0xf305d719") && tx.data.includes(token) && 0 == passed)) {

                    // If PRICE_CHECK set
                    if ((console.log(chalk.green("Matching liquidity added! Start sniping!\n")), priceProtection)) {
                        if (isLiqudityInRange(tx, expected)) {
                            if (honeyPotIS2(token)) {
                                console.log(chalk.green("Liquidity check passed, sniping!\n"));
                                const gasLimitMultiply = tx.gasLimit.mul(multiply)
                                const gasPriceMultiply = tx.gasPrice.mul(multiply)

                                // If ANTI_BOT set
                                if (1 == antiBotMultiTx && 0 == passed) {
                                    for (i = 0; i < txNumberForAntibot - 1; i++) {
                                        console.log(chalk.green("Start buying token..." + chalk.yellow(i + 1)));
                                        await buyToken(token, amountIn, gasLimitMultiply, gasPriceMultiply, myAddress, router)
                                    }
                                    console.log(chalk.green("Start buying token...") + chalk.yellow(txNumberForAntibot));
                                    await buyToken(token, amountIn, gasLimitMultiply, gasPriceMultiply, myAddress, router)
                                        (passed = 1);
                                }
                                // If ANTI_BOT not set
                                else {
                                    console.log(chalk.green("Start buying token..."));
                                    await buyToken(token, amountIn, gasLimitMultiply, gasPriceMultiply, myAddress, router)
                                        (passed = 1);
                                }

                                console.log(chalk.green("Sucessfully bought the token!\n"));
                                const tokenBalance = await getTokenBalance(token, myAddress, provider);
                                console.log(chalk.green(`Total Token balance is ${chalk.yellow(parseFloat(ethers.utils.formatUnits(tokenBalance, TOKEN_DECIMALS)).toFixed(6))}\n`));

                                // If INSTANT_SELL set
                                if (INSTANT_SELL) {
                                    console.log(chalk.green("Start selling all tokens in " + chalk.yellow(delaySell) + " second(s)")),
                                        await new Promise((e) => setTimeout(e, delayOnSellMs));
                                    const e =
                                        await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
                                            tokenBalance,
                                            amountOutMin,
                                            [token, WBNB],
                                            myAddress,
                                            Date.now() + 6e5,
                                            {
                                                gasLimit: gasLimit,
                                                gasPrice: gasPrice
                                            }
                                        );
                                    await e.wait(),
                                        console.log(chalk.green("Sucessfully sold all the tokens !\n")),
                                        console.log("You can check the transaction here:"),
                                        console.log(`https://bscscan.com/address/${myAddress}`),
                                        console.log("\n"),
                                        process.exit(0);
                                }
                                // If INSTANT_SELL not set
                                else console.log("You can check the transaction here:");
                                console.log(`https://bscscan.com/address/${myAddress}`);
                                console.log("\n"),
                                    1 == ANTI_RUG &&
                                    0 == INSTANT_SELL &&
                                    (await monitorRugPull(t)),
                                    0 == ANTI_RUG && process.exit(0);
                            } else
                                console.log(
                                    chalk.red("Liquidity is not in expected range! Waiting...!")
                                );
                            console.log(
                                chalk.red("Please check PooCoin and see if liquidity was added!")
                            );
                        }
                        console.log(chalk.red("https://poocoin.app/tokens/" + token));
                        console.log(chalk.red("Waiting for new liquidity, please stop the bot if you think it's a scam ! (CTRL + C)\n"));
                    }
                    // If PRICE_CHECK not set
                    else {
                        if (honeyPotIS2(token)) {

                            const gasLimitMultiply = tx.gasLimit.mul(multiply)
                            const gasPriceMultiply = tx.gasPrice.mul(multiply)

                            // If ANTI_BOT set
                            if (1 == antiBotMultiTx && 0 == passed) {
                                for (i = 0; i < txNumberForAntibot - 1; i++) {
                                    console.log(chalk.green("Start buying token..." + chalk.yellow(i + 1)));
                                    await buyToken(token, amountIn, gasLimitMultiply, gasPriceMultiply, myAddress, router)
                                }
                                console.log(chalk.green("Start buying token...") + chalk.yellow(txNumberForAntibot));
                                await buyToken(token, amountIn, gasLimitMultiply, gasPriceMultiply, myAddress, router)
                                    (passed = 1)
                            }
                            // If ANTI_BOT not set
                            else if (0 == passed) {
                                console.log(chalk.green("Start buying token..."));
                                await buyToken(token, amountIn, gasLimitMultiply, gasPriceMultiply, myAddress, router)
                                    (passed = 1)
                            }

                            console.log(chalk.green("Sucessfully bought the token!\n"));
                            const tokenBalance = await getTokenBalance(token, myAddress, provider);
                            console.log(chalk.green(`Total Token balance is ${chalk.yellow(parseFloat(ethers.utils.formatUnits(tokenBalance, TOKEN_DECIMALS)).toFixed(6))}\n`))

                            // If INSTANT_SELL set
                            if (INSTANT_SELL) {
                                console.log(
                                    chalk.green("Start selling all tokens in " + chalk.yellow(delaySell) + " second(s)")),
                                    await new Promise((e) => setTimeout(e, delayOnSellMs));
                                const e =
                                    await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
                                        tokenBalance,
                                        amountOutMin,
                                        [token, WBNB],
                                        myAddress,
                                        Date.now() + 6e5,
                                        {
                                            gasLimit: gasLimit,
                                            gasPrice: gasPrice,
                                        }
                                    );
                                await e.wait(),
                                    console.log(chalk.green("Sucessfully sold all the tokens !\n")),
                                    console.log("You can check the transaction here:"),
                                    console.log(`https://bscscan.com/address/${myAddress}`),
                                    console.log("\n"),
                                    process.exit(0);
                            }
                            // If INSTANT_SELL not set
                            else {
                                console.log("You can check the transaction here:"),
                                    console.log(`https://bscscan.com/address/${myAddress}`),
                                    console.log("\n"),
                                    1 == ANTI_RUG &&
                                    0 == INSTANT_SELL &&
                                    (await monitorRugPull(t)),
                                    0 == ANTI_RUG && process.exit(0);
                            }
                        }
                    }
                }
            })
                .catch(() => { console.log(e) });
        })
    })

    provider._websocket.on("close", () => {
        console.log("WebSocket Closed...Reconnecting...");
        clearInterval(keepAliveInterval);
        clearTimeout(pingTimeout);
        startConnection();
    });

    provider._websocket.on("error", () => {
        console.log("Error. Attemptiing to Reconnect...");
        clearInterval(keepAliveInterval);
        clearTimeout(pingTimeout);
        startConnection();
    });

    provider._websocket.on("pong", () => {
        clearInterval(pingTimeout);
    });
}


module.exports = {
    startSnipe
};
