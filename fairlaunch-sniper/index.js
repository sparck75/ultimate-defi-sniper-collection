const { monitorRugPull, isLiqudityInRange, getWBNBTokenBalance, getTokenBalance, } = require('./lib');
const ethers = require("ethers");
const env = require("dotenv");
const chalk = require("chalk");
const pcsAbi = new ethers.utils.Interface(require("./abi.json"));
const { buyToken } = require('./buyToken');
const result = env.config();
if (result.error) {
  throw result.error;
}
const TOKEN = process.env.TOKEN;
const TOKEN_DECIMALS = process.env.TOKEN_DECIMALS;
const amountIn = ethers.utils.parseUnits(process.env.PURCHASE_AMOUNT, "ether");
const amountOutMin = ethers.utils.parseUnits(process.env.SLIPPAGE, "ether");
const gasPrice = ethers.utils.parseUnits(process.env.GAS_PRICE, "gwei");
const gasLimit = process.env.GAS_LIMIT;
const txNumberForAntibot = process.env.TRANSACTIONS_NUM;
const BSC_NODE_WSS = process.env.BSC_NODE_WSS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

let expected = parseInt(process.env.LIQUIDITY_BNB).toFixed(0);

let passed = 0

let priceProtection = !1;
"true" == process.env.PRICE_CHECK && (priceProtection = !0);

let INSTANT_SELL = !1;
"true" == process.env.INSTANT_SELL && (INSTANT_SELL = !0);

let ANTI_RUG = !1;
"true" == process.env.ANTI_RUG && (ANTI_RUG = !0);

const delaySell = process.env.SELL_DELAY;
const multiply = parseInt(process.env.MULTIPLY_GAS);

let delayOnSellMs = 1e3 * delaySell;
let antiBotMultiTx = !1;

"true" == process.env.ANTI_BOT && (antiBotMultiTx = !0);

const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const pcsRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const token = TOKEN.toLowerCase().substring(2);
const tokenAddress = "0x" + token;
const provider = new ethers.providers.WebSocketProvider(BSC_NODE_WSS);
const wallet = new ethers.Wallet(PRIVATE_KEY);
const myAddress = wallet.address;
const account = wallet.connect(provider);
const router = new ethers.Contract(pcsRouter, pcsAbi, account);


console.log(chalk.black.bgGreen("Welcome to Dr Furr's Sniper Bot.") + "\n");
console.log(chalk.black.bgRed("Good luck. \n"));;
console.log(chalk.cyan("Join the community: https://t.me/drfurrbots. \n"));
console.log(chalk.green("Connected to blockchain... \n"));
console.log(chalk.magenta("Sniper started with current settings:"));
console.log(chalk.green("Buy token for " + chalk.yellow(amountIn / 1e18) + " WBNB using " + chalk.yellow(gasLimit) + " Gas and " + chalk.yellow(gasPrice / 1e9) + " Gwei"));
console.log("Gas Multiplication X " + chalk.yellow(multiply));
antiBotMultiTx
  ? (console.log("Antibot active: " + chalk.green("YES")),
    console.log("Multiple transactions set to: " + chalk.yellow(txNumberForAntibot)))
  : (console.log("Antibot active: " + chalk.red("NO")),
    console.log("Multiple transactions forced to: " + chalk.yellow("1")));
priceProtection
  ? (console.log("Price Protection active: " + chalk.green("YES")),
    console.log("Expected Liquidity : " + chalk.yellow(expected)))
  : console.log("Price Protection active: " + chalk.red("NO"));
1 == ANTI_RUG && 0 == INSTANT_SELL
  ? console.log("Rug Pull Protection active: " + chalk.green("YES"))
  : console.log("Rug Pull Protection active: " + chalk.red("NO"));
INSTANT_SELL
  ? (console.log("Instant Sell token: " + chalk.green("YES")),
    console.log("Selling will be done after " + chalk.yellow(delaySell) + " second(s) from buy confirmation!"))
  : console.log("Instant Sell token: " + chalk.red("NO"));
console.log(chalk.black.bgRed("Please press CTRL + C to stop the bot if the settings are incorrect! \n"));

const EXPECTED_PONG_BACK = 15000;
const KEEP_ALIVE_CHECK_INTERVAL = 7500;

const startConnection = () => {
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
              console.log(chalk.green("Liquidity check passed, sniping!\n"));
              const gasLimitMultiply = tx.gasLimit.mul(multiply)
              const gasPriceMultiply = tx.gasPrice.mul(multiply)

              // If ANTI_BOT set
              if (1 == antiBotMultiTx && 0 == passed) {
                for (i = 0; i < txNumberForAntibot - 1; i++) {
                  console.log(chalk.green("Start buying token..." + chalk.yellow(i + 1)));
                  await buyToken(tokenAddress, amountIn, gasLimitMultiply, gasPriceMultiply, myAddress, router)
                }
                console.log(chalk.green("Start buying token...") + chalk.yellow(txNumberForAntibot));
                await buyToken(tokenAddress, amountIn, gasLimitMultiply, gasPriceMultiply, myAddress, router)
                  (passed = 1);
              }
              // If ANTI_BOT not set
              else {
                console.log(chalk.green("Start buying token..."));
                await buyToken(tokenAddress, amountIn, gasLimitMultiply, gasPriceMultiply, myAddress, router)
                  (passed = 1);
              }

              console.log(chalk.green("Sucessfully bought the token!\n"));
              const tokenBalance = await getTokenBalance(tokenAddress, myAddress, provider);
              console.log(chalk.green(`Total Token balance is ${chalk.yellow(parseFloat(ethers.utils.formatUnits(tokenBalance, TOKEN_DECIMALS)).toFixed(6))}\n`));

              // If INSTANT_SELL set
              if (INSTANT_SELL) {
                console.log(chalk.green("Start selling all tokens in " + chalk.yellow(delaySell) + " second(s)")),
                  await new Promise((e) => setTimeout(e, delayOnSellMs));
                const e =
                  await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
                    tokenBalance,
                    amountOutMin,
                    [tokenAddress, WBNB],
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
            console.log(chalk.red("https://poocoin.app/tokens/" + TOKEN));
            console.log(chalk.red("Waiting for new liquidity, please stop the bot if you think it's a scam ! (CTRL + C)\n"));
          }
          // If PRICE_CHECK not set
          else {
            const gasLimitMultiply = tx.gasLimit.mul(multiply)
            const gasPriceMultiply = tx.gasPrice.mul(multiply)

            // If ANTI_BOT set
            if (1 == antiBotMultiTx && 0 == passed) {
              for (i = 0; i < txNumberForAntibot - 1; i++) {
                console.log(chalk.green("Start buying token..." + chalk.yellow(i + 1)));
                await buyToken(tokenAddress, amountIn, gasLimitMultiply, gasPriceMultiply, myAddress, router)
              }
              console.log(chalk.green("Start buying token...") + chalk.yellow(txNumberForAntibot));
              await buyToken(tokenAddress, amountIn, gasLimitMultiply, gasPriceMultiply, myAddress, router)
                (passed = 1)
            }
            // If ANTI_BOT not set
            else if (0 == passed) {
              console.log(chalk.green("Start buying token..."));
              await buyToken(tokenAddress, amountIn, gasLimitMultiply, gasPriceMultiply, myAddress, router)
                (passed = 1)
            }

            console.log(chalk.green("Sucessfully bought the token!\n"));
            const tokenBalance = await getTokenBalance(tokenAddress, myAddress, provider);
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
                  [tokenAddress, WBNB],
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
      })
        .catch((e) => { console.log(e) });
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
startConnection();


