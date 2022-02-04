const ethers = require("ethers")
const env = require("dotenv");
const chalk = require('chalk');
const result = env.config()
if (result.error) {
  throw result.error
}

let choseMode = 1;

choseMode =
  "2" == process.env.Mode ? 2 : "3" == process.env.Mode ? 3 : process.env.Mode;

const TokenContract = process.env.TokenContract,
  tokenDecimals = process.env.tokenDecimals,
  amountIn = ethers.utils.parseUnits(process.env.WBNB_To_Use, "ether"),
  amountOutMin = ethers.utils.parseUnits(process.env.slippage, "ether"),
  gasPrice = ethers.utils.parseUnits(process.env.Gwei, "gwei"),
  gasLimit = process.env.Gas,
  txNumberForAntibot = process.env.TransactionsToDo,
  BSC_NODE_WSS = process.env.BSC_NODE_WSS,
  privateKey = process.env.privateKey;

let expected = parseInt(process.env.liquidityBNB).toFixed(0);

const transactionToDetect = parseInt(
  process.env.TransactionsToFrontRun
).toFixed(0),
  skipBlock = process.env.skipBlock,
  countDown = convertToSeconds(process.env.countDown);

let passed = 0,
  needApproval = !1;
"true" == process.env.ApproveToken && (needApproval = !0);

let priceProttection = !1;
"true" == process.env.PriceCheck && (priceProttection = !0);

let detectDxSale = !1;
"true" == process.env.detectDxSale && (detectDxSale = !0);

let detectFairLaunch = !1;
"true" == process.env.detectFairLaunch && (detectFairLaunch = !0);

let buyOnly = !1;
"true" == process.env.buyOnlyMode && (buyOnly = !0);

let snipeOnly = !1;
"true" == process.env.snipeOnlyMode && (snipeOnly = !0);

let approveBeforeOrAfter = 1;
"2" == process.env.approveBeforeOrAfter && (approveBeforeOrAfter = 2);

let instantSell = !1;
"true" == process.env.instantSell && (instantSell = !0);

let antiRug = !1;
"true" == process.env.antiRug && (antiRug = !0);

let honeypot = false;
if (process.env.HoneypotCheck == "true") {
  honeypot = true;
}

const delaySell = process.env.sellDelay,
  multiply = parseInt(process.env.MultiplyGas);

let delayOnSellMs = 1e3 * delaySell,
  currentNonce = 0,
  antiBotMultiTx = !1;

"true" == process.env.AntiBot && (antiBotMultiTx = !0);

const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  BUSD = "0xe9e7cea3dedca5984780bafc599bd69add087d56",
  pcsRouterV2Addr = "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  factoryRouter = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
  addLiquidityETH = "0xf305d719",
  addLiquidity = "0xe8e33700",
  addLiquidityDxsale = "0x267dd102",
  removeLiquidity = "0xbaa2abde",
  removeLiquidityETH = "0x02751cec",
  removeLiquidityETHSupportingFeeOnTransferTokens = "0xaf2979eb",
  removeLiquidityETHWithPermit = "0xded9382a",
  removeLiquidityETHWithPermitSupportingFeeOnTransferTokens = "0x5b0d5984",
  removeLiquidityWithPermit = "0x2195995c",
  token = TokenContract.toLowerCase().substring(2),
  tokenAddress = "0x" + token;

async function getNonce(e) {
  return await provider.getTransactionCount(e);
}

const isLiqudityInRange = function (e, o) {
  o = parseFloat(o);
  const n = parseInt(o).toString(),
    t = ethers.utils.parseUnits(n, "ether");
  return e.value.gte(t);
};

async function getTokenBalance(e, o, n) {
  const t = new ethers.Contract(
    e,
    [
      {
        name: "balanceOf",
        type: "function",
        inputs: [{ name: "_owner", type: "address" }],
        outputs: [{ name: "balance", type: "uint256" }],
        constant: !0,
        payable: !1,
      },
    ],
    n
  );
  return await t.balanceOf(o);
}

async function getWBNBTokenBalance(e, o, n) {
  const t = new ethers.Contract(
    e,
    [
      {
        name: "balanceOf",
        type: "function",
        inputs: [{ name: "_owner", type: "address" }],
        outputs: [{ name: "balance", type: "uint256" }],
        constant: !0,
        payable: !1,
      },
    ],
    n
  );
  return await t.balanceOf(o);
}

const provider = new ethers.providers.WebSocketProvider(BSC_NODE_WSS),
  wallet = new ethers.Wallet(privateKey),
  myAddress = wallet.address,
  account = wallet.connect(provider);

provider.removeAllListeners();

const pcsRouterV2B = new ethers.Contract(
  pcsRouterV2Addr,
  [
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  ],
  account
),
  pcsRouterV2 = new ethers.Contract(
    pcsRouterV2Addr,
    [
      "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
      "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    ],
    account
  ),
  tokenContract = new ethers.Contract(
    tokenAddress,
    [
      "function approve(address spender, uint256 amount) external returns (bool)",
    ],
    account
  );

const monitorRugPull = async function (e, o) {
  console.log(chalk.red("Monitoring for rug pull in progress ....\n")),
    provider.on("pending", async (n) => {
      const t = await provider.getTransaction(n);
      if (
        null != t &&
        t.data.includes(token) &&
        (t.data.includes("0xbaa2abde") ||
          t.data.includes("0x02751cec") ||
          t.data.includes("0xaf2979eb") ||
          t.data.includes("0xded9382a") ||
          t.data.includes("0x5b0d5984") ||
          t.data.includes("0x2195995c"))
      ) {
        console.log(chalk.red("Rug pull detected\n"));
        const n = t.gasLimit.mul(2),
          s = t.gasPrice.mul(2);
        console.log(chalk.red("Start selling all tokens"));
        const a =
          await pcsRouterV2.swapExactTokensForETHSupportingFeeOnTransferTokens(
            e,
            amountOutMin,
            [tokenAddress, WBNB],
            myAddress,
            Date.now() + 6e5,
            { gasLimit: n, gasPrice: s, nonce: o++ }
          );
        await a.wait(),
          console.log(
            chalk.green("Sucessfully sold all the tokens before rug pull !\n")
          ),
          console.log("You can check the transaction here:"),
          console.log(`https://bscscan.com/address/${myAddress}`),
          console.log("\n"),
          process.exit(0);
      }
    });
};

if (
  (console.log(
    chalk.black.bgGreen(
      "Welcome to Dr Furr's Sniper Bot."
    ) + "\n"
  ),
    console.log(
      chalk.black.bgRed(
        "Good luck. \n"
      )
    ),
    2 == choseMode)
)
  (detectDxSale && detectFairLaunch) || (!detectDxSale && !detectFairLaunch)
    ? (console.log(
      chalk.black.bgRed(
        "You must set up EITHER detectDxSale or detectFairLaunch to true in the setup file. Program shutting down. \n"
      )
    ),
      process.exit(0))
    : detectDxSale
      ? (async () => {
        const e = new ethers.Contract(
          factoryRouter,
          [
            "event PairCreated(address indexed token0, address indexed token1, address pair, uint)",
            "function getPair(address tokenA, address tokenB) external view returns (address pair)",
          ],
          account
        );
        currentNonce = await getNonce(myAddress);
        let o = await getWBNBTokenBalance(WBNB, myAddress, provider);
        if (
          (console.log(
            chalk.cyan(
              "Join the community: https://t.me/drfurrbots. \n"
            )
          ),
            ((!buyOnly && !snipeOnly) || (buyOnly && snipeOnly)) &&
            (console.log(
              chalk.black.bgRed(
                "You must set up EITHER buyOnlyMode or snipeOnlyMode to true in the setup file. Program shutting down. \n"
              )
            ),
              process.exit(0)),
            snipeOnly
              ? console.log(
                chalk.black.bgYellow(
                  "WARNING: This Sniper mode detects only listings with presale (DxSale). \n"
                )
              )
              : buyOnly &&
              console.log(
                chalk.black.bgYellow(
                  "WARNING: You are now using Buy Only Mode Token. \n"
                )
              ),
            console.log(chalk.green("Connected to blockchain... \n")),
            console.log(chalk.magenta("Sniper started with current settings:")),
            console.log(
              chalk.green(
                "Buy token for " +
                chalk.yellow(amountIn / 1e18) +
                " WBNB using " +
                chalk.yellow(gasLimit) +
                " Gas and " +
                chalk.yellow(gasPrice / 1e9) +
                " Gwei"
              )
            ),
            console.log(
              chalk.green(
                `Total WBNB balance is ${chalk.yellow(
                  parseFloat(ethers.utils.formatUnits(o, 18)).toFixed(6)
                )}\n`
              )
            ),
            needApproval
              ? console.log("Approve token: " + chalk.green("YES"))
              : console.log("Approve token: " + chalk.red("NO")),
            buyOnly
              ? console.log("Buy only mode token: " + chalk.green("YES"))
              : snipeOnly &&
              console.log(
                "Snipe only mode token: " +
                chalk.green("YES") +
                " // Listing from " +
                chalk.green("DxSale") +
                "\nSkip blocks: " +
                chalk.green(skipBlock)
              ),
            antiBotMultiTx
              ? (console.log("Antibot active: " + chalk.green("YES")),
                console.log(
                  "Multiple transactions set to: " +
                  chalk.green(txNumberForAntibot)
                ))
              : (console.log("Antibot active: " + chalk.red("NO")),
                console.log(
                  "Multiple transactions forced to: " + chalk.green("1")
                )),
            instantSell
              ? (console.log("Instant Sell token: " + chalk.green("YES")),
                console.log(
                  "Selling will be done after " +
                  chalk.yellow(delaySell) +
                  " second(s) from buy confirmation!"
                ))
              : console.log("Instant Sell token: " + chalk.red("NO")),
            console.log(
              `Your current nounce is: ${chalk.yellow(currentNonce)}\n`
            ),
            console.log(
              chalk.black.bgRed(
                "Please press CTRL + C to stop the bot if the settings are incorrect! \n"
              )
            ),
            needApproval && 1 == approveBeforeOrAfter)
        ) {
          console.log(chalk.green("Start approving token..."));
          try {
            const e = await tokenContract.approve(
              pcsRouterV2Addr,
              ethers.BigNumber.from(
                "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
              ),
              { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
            );
            await e.wait(),
              console.log(chalk.green("Token spending approved. \n"));
          } catch (e) {
            console.log(e),
              console.log(
                chalk.red(
                  "Unexpected error on approving, token is not approved !!! \n"
                )
              );
          }
        }
        if (buyOnly) {
          // if (honeypot) {
          //   console.log(chalk.black.bgCyan("Checking for Honeypot... \n"));
          // }
          if (1 == antiBotMultiTx && 0 == passed) {
            for (i = 0; i < txNumberForAntibot - 1; i++) {
              console.log(
                chalk.green("Start buying token..." + chalk.yellow(i + 1))
              );
              await pcsRouterV2B.swapExactTokensForTokens(
                amountIn,
                amountOutMin,
                [WBNB, tokenAddress],
                myAddress,
                Date.now() + 6e5,
                {
                  gasLimit: gasLimit,
                  gasPrice: gasPrice,
                  nonce: currentNonce++,
                }
              );
            }
            console.log(
              chalk.green("Start buying token...") +
              chalk.yellow(txNumberForAntibot)
            );
            const e = await pcsRouterV2B.swapExactTokensForTokens(
              amountIn,
              amountOutMin,
              [WBNB, tokenAddress],
              myAddress,
              Date.now() + 6e5,
              { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
            );
            (passed = 1), await e.wait();
          } else {
            console.log(chalk.green("Start buying token..."));
            const e = await pcsRouterV2B.swapExactTokensForTokens(
              amountIn,
              amountOutMin,
              [WBNB, tokenAddress],
              myAddress,
              Date.now() + 6e5,
              { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
            );
            (passed = 1), await e.wait();
          }
          console.log(chalk.green("Sucessfully bought the token!\n"));
          let e = await getTokenBalance(tokenAddress, myAddress, provider);
          if (
            (console.log(
              chalk.green(
                `Total Token balance is ${chalk.yellow(
                  parseFloat(
                    ethers.utils.formatUnits(e, tokenDecimals)
                  ).toFixed(6)
                )}\n`
              )
            ),
              needApproval && 2 == approveBeforeOrAfter)
          ) {
            console.log(chalk.green("Start approving token..."));
            try {
              const e = await tokenContract.approve(
                pcsRouterV2Addr,
                ethers.BigNumber.from(
                  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                ),
                {
                  gasLimit: gasLimit,
                  gasPrice: gasPrice,
                  nonce: currentNonce++,
                }
              );
              await e.wait(),
                console.log(chalk.green("Token spending approved. \n"));
            } catch (e) {
              console.log(e),
                console.log(
                  chalk.red(
                    "Unexpected error on approving, token is not approved !!! \n"
                  )
                );
            }
          }
          if (instantSell) {
            console.log(
              chalk.green(
                "Start selling all tokens in " +
                chalk.yellow(delaySell) +
                " second(s)"
              )
            ),
              await new Promise((e) => setTimeout(e, delayOnSellMs));
            const o =
              await pcsRouterV2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                e,
                amountOutMin,
                [tokenAddress, WBNB],
                myAddress,
                Date.now() + 6e5,
                {
                  gasLimit: gasLimit,
                  gasPrice: gasPrice,
                  nonce: currentNonce++,
                }
              );
            await o.wait(),
              console.log(chalk.green("Sucessfully sold all the tokens !\n")),
              console.log("You can check the transaction here:"),
              console.log(`https://bscscan.com/address/${myAddress}`),
              console.log("\n"),
              process.exit(0);
          } else
            console.log("You can check the transaction here:"),
              console.log(`https://bscscan.com/address/${myAddress}`),
              console.log("\n"),
              process.exit(0);
        } else {
          // if (honeypot) {
          //   console.log(chalk.black.bgCyan("Checking for Honeypot... \n"));
          // }
          (pairDetect = await e.getPair(WBNB, tokenAddress)),
            console.log("Scanning pair Address: " + chalk.yellow(pairDetect)),
            console.log(chalk.green("Waiting for liquidity to be added! ")),
            new ethers.Contract(
              pairDetect,
              [
                "event Mint(address indexed sender, uint amount0, uint amount1)",
              ],
              account
            ).on("Mint", async (e, o, n) => {
              if (
                (console.log(
                  chalk.green("Liquidity detected, starting snipe! ")
                ),
                  1 == antiBotMultiTx && 0 == passed)
              ) {
                for (i = 0; i < txNumberForAntibot - 1; i++) {
                  console.log(
                    chalk.green("Start buying token..." + chalk.yellow(i + 1))
                  );
                  await pcsRouterV2B.swapExactTokensForTokens(
                    amountIn,
                    amountOutMin,
                    [WBNB, tokenAddress],
                    myAddress,
                    Date.now() + 6e5,
                    {
                      gasLimit: gasLimit,
                      gasPrice: gasPrice,
                      nonce: currentNonce++,
                    }
                  );
                }
                console.log(
                  chalk.green(
                    "Start buying token..." + chalk.yellow(txNumberForAntibot)
                  )
                );
                const e = await pcsRouterV2B.swapExactTokensForTokens(
                  amountIn,
                  amountOutMin,
                  [WBNB, tokenAddress],
                  myAddress,
                  Date.now() + 6e5,
                  {
                    gasLimit: gasLimit,
                    gasPrice: gasPrice,
                    nonce: currentNonce++,
                  }
                );
                (passed = 1), await e.wait();
              } else {
                console.log(chalk.green("Start buying token..."));
                const e = await pcsRouterV2B.swapExactTokensForTokens(
                  amountIn,
                  amountOutMin,
                  [WBNB, tokenAddress],
                  myAddress,
                  Date.now() + 6e5,
                  {
                    gasLimit: gasLimit,
                    gasPrice: gasPrice,
                    nonce: currentNonce++,
                  }
                );
                (passed = 1), await e.wait();
              }
              console.log(chalk.green("Sucessfully bought the token!\n"));
              const t = await getTokenBalance(
                tokenAddress,
                myAddress,
                provider
              );
              if (
                (console.log(
                  chalk.green(
                    `Total Token balance is ${chalk.yellow(
                      parseFloat(
                        ethers.utils.formatUnits(t, tokenDecimals)
                      ).toFixed(6)
                    )}\n`
                  )
                ),
                  needApproval && 2 == approveBeforeOrAfter)
              ) {
                console.log(chalk.green("Start approving token..."));
                try {
                  const e = await tokenContract.approve(
                    pcsRouterV2Addr,
                    ethers.BigNumber.from(
                      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                    ),
                    {
                      gasLimit: gasLimit,
                      gasPrice: gasPrice,
                      nonce: currentNonce++,
                    }
                  );
                  await e.wait(),
                    console.log(chalk.green("Token spending approved. \n"));
                } catch (e) {
                  console.log(e),
                    console.log(
                      chalk.red(
                        "Unexpected error on approving, token is not approved !!! \n"
                      )
                    );
                }
              }
              if (instantSell) {
                console.log(
                  chalk.green(
                    "Start selling all tokens in " +
                    chalk.yellow(delaySell) +
                    " second(s)"
                  )
                ),
                  await new Promise((e) => setTimeout(e, delayOnSellMs));
                const e =
                  await pcsRouterV2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                    t,
                    amountOutMin,
                    [tokenAddress, WBNB],
                    myAddress,
                    Date.now() + 6e5,
                    {
                      gasLimit: gasLimit,
                      gasPrice: gasPrice,
                      nonce: currentNonce++,
                    }
                  );
                await e.wait(),
                  console.log(
                    chalk.green("Sucessfully sold all the tokens !\n")
                  ),
                  console.log("You can check the transaction here:"),
                  console.log(`https://bscscan.com/address/${myAddress}`),
                  console.log("\n"),
                  process.exit(0);
              } else
                console.log("You can check the transaction here:"),
                  console.log(`https://bscscan.com/address/${myAddress}`),
                  console.log("\n"),
                  process.exit(0);
            });
        }
      })()
      : detectFairLaunch &&
      (async () => {
        currentNonce = await getNonce(myAddress);
        let e = await getWBNBTokenBalance(WBNB, myAddress, provider);
        if (
          (console.log(
            chalk.cyan(
              "Join the community: https://t.me/drfurrbots. \n")
          ),
            ((!buyOnly && !snipeOnly) || (buyOnly && snipeOnly)) &&
            (console.log(
              chalk.black.bgRed(
                "You must set up EITHER buyOnlyMode or snipeOnlyMode to true in the setup file. Program shutting down. \n"
              )
            ),
              process.exit(0)),
            snipeOnly
              ? console.log(
                chalk.black.bgYellow(
                  "WARNING: This Sniper mode detects only Fair Launch. \n"
                )
              )
              : buyOnly &&
              console.log(
                chalk.black.bgYellow(
                  "WARNING: You are now using Buy Only Mode Token. \n"
                )
              ),
            console.log(chalk.green("Connected to blockchain... \n")),
            console.log(chalk.magenta("Sniper started with current settings:")),
            console.log(
              chalk.green(
                "Buy token for " +
                chalk.yellow(amountIn / 1e18) +
                " WBNB using " +
                chalk.yellow(gasLimit) +
                " Gas and " +
                chalk.yellow(gasPrice / 1e9) +
                " Gwei"
              )
            ),
            console.log(
              chalk.green(
                `Total WBNB balance is ${chalk.yellow(
                  parseFloat(ethers.utils.formatUnits(e, 18)).toFixed(6)
                )}\n`
              )
            ),
            needApproval
              ? console.log("Approve token: " + chalk.green("YES"))
              : console.log("Approve token: " + chalk.red("NO")),
            buyOnly
              ? console.log("Buy only mode token: " + chalk.green("YES"))
              : snipeOnly &&
              console.log(
                "Snipe only mode token: " +
                chalk.green("YES") +
                " // Fees Multiplication X " +
                chalk.yellow(multiply) +
                "\nSkip blocks: " +
                chalk.green(skipBlock)
              ),
            antiBotMultiTx
              ? (console.log("Antibot active: " + chalk.green("YES")),
                console.log(
                  "Multiple transactions set to: " +
                  chalk.yellow(txNumberForAntibot)
                ))
              : (console.log("Antibot active: " + chalk.red("NO")),
                console.log(
                  "Multiple transactions forced to: " + chalk.yellow("1")
                )),
            priceProttection
              ? (console.log("Price Protection active: " + chalk.green("YES")),
                console.log("Expected Liquidity : " + chalk.yellow(expected)))
              : console.log("Price Protection active: " + chalk.red("NO")),
            1 == antiRug && 0 == instantSell
              ? console.log("Rug Pull Protection active: " + chalk.green("YES"))
              : console.log("Rug Pull Protection active: " + chalk.red("NO")),
            instantSell
              ? (console.log("Instant Sell token: " + chalk.green("YES")),
                console.log(
                  "Selling will be done after " +
                  chalk.yellow(delaySell) +
                  " second(s) from buy confirmation!"
                ))
              : console.log("Instant Sell token: " + chalk.red("NO")),
            console.log(
              `Your current nounce is: ${chalk.yellow(currentNonce)}\n`
            ),
            console.log(
              chalk.black.bgRed(
                "Please press CTRL + C to stop the bot if the settings are incorrect! \n"
              )
            ),
            needApproval && 1 == approveBeforeOrAfter)
        ) {
          console.log(chalk.green("Start approving token..."));
          try {
            const e = await tokenContract.approve(
              pcsRouterV2Addr,
              ethers.BigNumber.from(
                "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
              ),
              { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
            );
            await e.wait(),
              console.log(chalk.green("Token spending approved. \n"));
          } catch (e) {
            console.log(e),
              console.log(
                chalk.red(
                  "Unexpected error on approving, token is not approved !!! \n"
                )
              );
          }
        }
        if (buyOnly) {
          // if (honeypot) {
          //   console.log(chalk.black.bgCyan("Checking for Honeypot... \n"));
          // }
          if (1 == antiBotMultiTx && 0 == passed) {
            for (i = 0; i < txNumberForAntibot - 1; i++) {
              console.log(
                chalk.green("Start buying token..." + chalk.yellow(i + 1))
              );
              await pcsRouterV2B.swapExactTokensForTokens(
                amountIn,
                amountOutMin,
                [WBNB, tokenAddress],
                myAddress,
                Date.now() + 6e5,
                {
                  gasLimit: gasLimit,
                  gasPrice: gasPrice,
                  nonce: currentNonce++,
                }
              );
            }
            console.log(
              chalk.green("Start buying token...") +
              chalk.yellow(txNumberForAntibot)
            );
            const e = await pcsRouterV2B.swapExactTokensForTokens(
              amountIn,
              amountOutMin,
              [WBNB, tokenAddress],
              myAddress,
              Date.now() + 6e5,
              { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
            );
            (passed = 1), await e.wait();
          } else {
            console.log(chalk.green("Start buying token..."));
            const e = await pcsRouterV2B.swapExactTokensForTokens(
              amountIn,
              amountOutMin,
              [WBNB, tokenAddress],
              myAddress,
              Date.now() + 6e5,
              { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
            );
            (passed = 1), await e.wait();
          }
          console.log(chalk.green("Sucessfully bought the token!\n"));
          let e = await getTokenBalance(tokenAddress, myAddress, provider);
          if (
            (console.log(
              chalk.green(
                `Total Token balance is ${chalk.yellow(
                  parseFloat(
                    ethers.utils.formatUnits(e, tokenDecimals)
                  ).toFixed(6)
                )}\n`
              )
            ),
              needApproval && 2 == approveBeforeOrAfter)
          ) {
            console.log(chalk.green("Start approving token..."));
            try {
              const e = await tokenContract.approve(
                pcsRouterV2Addr,
                ethers.BigNumber.from(
                  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                ),
                {
                  gasLimit: gasLimit,
                  gasPrice: gasPrice,
                  nonce: currentNonce++,
                }
              );
              await e.wait(),
                console.log(chalk.green("Token spending approved. \n"));
            } catch (e) {
              console.log(e),
                console.log(
                  chalk.red(
                    "Unexpected error on approving, token is not approved !!! \n"
                  )
                );
            }
          }
          if (instantSell) {
            console.log(
              chalk.green(
                "Start selling all tokens in " +
                chalk.yellow(delaySell) +
                " second(s)"
              )
            ),
              await new Promise((e) => setTimeout(e, delayOnSellMs));
            const o =
              await pcsRouterV2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                e,
                amountOutMin,
                [tokenAddress, WBNB],
                myAddress,
                Date.now() + 6e5,
                {
                  gasLimit: gasLimit,
                  gasPrice: gasPrice,
                  nonce: currentNonce++,
                }
              );
            await o.wait(),
              console.log(chalk.green("Sucessfully sold all the tokens !\n")),
              console.log("You can check the transaction here:"),
              console.log(`https://bscscan.com/address/${myAddress}`),
              console.log("\n"),
              process.exit(0);
          } else
            console.log("You can check the transaction here:"),
              console.log(`https://bscscan.com/address/${myAddress}`),
              console.log("\n"),
              1 == antiRug &&
              0 == instantSell &&
              (await monitorRugPull(e, currentNonce)),
              0 == antiRug && process.exit(0);
        } else
          honeypot
            ? console.log(chalk.black.bgCyan("Checking for Honeypot... \n"))
            : console.log("");

        console.log("Listening on mempool..."),
          console.log("Waiting for liquidity to be added!"),
          provider.on("pending", async (e) => {
            const o = await provider.getTransaction(e);
            if (
              (null != o &&
                o.data.includes("0xe8e33700") &&
                o.data.includes(token) &&
                0 == passed) ||
              (null != o &&
                o.data.includes("0xf305d719") &&
                o.data.includes(token) &&
                0 == passed)
            )
              if (
                (console.log(
                  chalk.green("Matching liquidity added! Start sniping!\n")
                ),
                  priceProttection)
              ) {
                if (isLiqudityInRange(o, expected)) {
                  console.log(
                    chalk.green("Liquidity check passed, sniping!\n")
                  );
                  const e = o.gasLimit.mul(multiply),
                    n = o.gasPrice.mul(multiply);
                  if (1 == antiBotMultiTx && 0 == passed) {
                    for (i = 0; i < txNumberForAntibot - 1; i++) {
                      console.log(
                        chalk.green(
                          "Start buying token..." + chalk.yellow(i + 1)
                        )
                      );
                      await pcsRouterV2B.swapExactTokensForTokens(
                        amountIn,
                        amountOutMin,
                        [WBNB, tokenAddress],
                        myAddress,
                        Date.now() + 6e5,
                        { gasLimit: e, gasPrice: n, nonce: currentNonce++ }
                      );
                    }
                    console.log(
                      chalk.green("Start buying token...") +
                      chalk.yellow(txNumberForAntibot)
                    );
                    const o = await pcsRouterV2B.swapExactTokensForTokens(
                      amountIn,
                      amountOutMin,
                      [WBNB, tokenAddress],
                      myAddress,
                      Date.now() + 6e5,
                      { gasLimit: e, gasPrice: n, nonce: currentNonce++ }
                    );
                    (passed = 1), await o.wait();
                  } else {
                    console.log(chalk.green("Start buying token..."));
                    const o = await pcsRouterV2B.swapExactTokensForTokens(
                      amountIn,
                      amountOutMin,
                      [WBNB, tokenAddress],
                      myAddress,
                      Date.now() + 6e5,
                      { gasLimit: e, gasPrice: n, nonce: currentNonce++ }
                    );
                    (passed = 1), await o.wait();
                  }
                  console.log(chalk.green("Sucessfully bought the token!\n"));
                  const t = await getTokenBalance(
                    tokenAddress,
                    myAddress,
                    provider
                  );
                  if (
                    (console.log(
                      chalk.green(
                        `Total Token balance is ${chalk.yellow(
                          parseFloat(
                            ethers.utils.formatUnits(t, tokenDecimals)
                          ).toFixed(6)
                        )}\n`
                      )
                    ),
                      needApproval && 2 == approveBeforeOrAfter)
                  ) {
                    console.log(chalk.green("Start approving token..."));
                    try {
                      const e = await tokenContract.approve(
                        pcsRouterV2Addr,
                        ethers.BigNumber.from(
                          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                        ),
                        {
                          gasLimit: gasLimit,
                          gasPrice: gasPrice,
                          nonce: currentNonce++,
                        }
                      );
                      await e.wait(),
                        console.log(chalk.green("Token spending approved. \n"));
                    } catch (e) {
                      console.log(e),
                        console.log(
                          chalk.red(
                            "Unexpected error on approving, token is not approved !!! \n"
                          )
                        );
                    }
                  }
                  if (instantSell) {
                    console.log(
                      chalk.green(
                        "Start selling all tokens in " +
                        chalk.yellow(delaySell) +
                        " second(s)"
                      )
                    ),
                      await new Promise((e) => setTimeout(e, delayOnSellMs));
                    const e =
                      await pcsRouterV2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                        t,
                        amountOutMin,
                        [tokenAddress, WBNB],
                        myAddress,
                        Date.now() + 6e5,
                        {
                          gasLimit: gasLimit,
                          gasPrice: gasPrice,
                          nonce: currentNonce++,
                        }
                      );
                    await e.wait(),
                      console.log(
                        chalk.green("Sucessfully sold all the tokens !\n")
                      ),
                      console.log("You can check the transaction here:"),
                      console.log(`https://bscscan.com/address/${myAddress}`),
                      console.log("\n"),
                      process.exit(0);
                  } else
                    console.log("You can check the transaction here:"),
                      console.log(`https://bscscan.com/address/${myAddress}`),
                      console.log("\n"),
                      1 == antiRug &&
                      0 == instantSell &&
                      (await monitorRugPull(t, currentNonce)),
                      0 == antiRug && process.exit(0);
                } else
                  console.log(
                    chalk.red("Liquidity is not in expected range! Waiting...!")
                  ),
                    console.log(
                      chalk.red(
                        "Please check PooCoin and see if liquidity was added!"
                      )
                    ),
                    console.log(
                      chalk.red("https://poocoin.app/tokens/" + TokenContract)
                    ),
                    console.log(
                      chalk.red(
                        "Waiting for new liquidity, please stop the bot if you think it's a scam ! (CTRL + C)\n"
                      )
                    );
              } else {
                const e = o.gasLimit.mul(multiply),
                  n = o.gasPrice.mul(multiply);
                if (1 == antiBotMultiTx && 0 == passed) {
                  for (i = 0; i < txNumberForAntibot - 1; i++) {
                    console.log(
                      chalk.green("Start buying token..." + chalk.yellow(i + 1))
                    );
                    await pcsRouterV2B.swapExactTokensForTokens(
                      amountIn,
                      amountOutMin,
                      [WBNB, tokenAddress],
                      myAddress,
                      Date.now() + 6e5,
                      { gasLimit: e, gasPrice: n, nonce: currentNonce++ }
                    );
                  }
                  console.log(
                    chalk.green("Start buying token...") +
                    chalk.yellow(txNumberForAntibot)
                  );
                  const o = await pcsRouterV2B.swapExactTokensForTokens(
                    amountIn,
                    amountOutMin,
                    [WBNB, tokenAddress],
                    myAddress,
                    Date.now() + 6e5,
                    { gasLimit: e, gasPrice: n, nonce: currentNonce++ }
                  );
                  (passed = 1), await o.wait();
                } else if (0 == passed) {
                  console.log(chalk.green("Start buying token..."));
                  const o = await pcsRouterV2B.swapExactTokensForTokens(
                    amountIn,
                    amountOutMin,
                    [WBNB, tokenAddress],
                    myAddress,
                    Date.now() + 6e5,
                    { gasLimit: e, gasPrice: n, nonce: currentNonce++ }
                  );
                  (passed = 1), await o.wait();
                }
                console.log(chalk.green("Sucessfully bought the token!\n"));
                const t = await getTokenBalance(
                  tokenAddress,
                  myAddress,
                  provider
                );
                if (
                  (console.log(
                    chalk.green(
                      `Total Token balance is ${chalk.yellow(
                        parseFloat(
                          ethers.utils.formatUnits(t, tokenDecimals)
                        ).toFixed(6)
                      )}\n`
                    )
                  ),
                    needApproval && 2 == approveBeforeOrAfter)
                ) {
                  console.log(chalk.green("Start approving token..."));
                  try {
                    const e = await tokenContract.approve(
                      pcsRouterV2Addr,
                      ethers.BigNumber.from(
                        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                      ),
                      {
                        gasLimit: gasLimit,
                        gasPrice: gasPrice,
                        nonce: currentNonce++,
                      }
                    );
                    await e.wait(),
                      console.log(chalk.green("Token spending approved. \n"));
                  } catch (e) {
                    console.log(e),
                      console.log(
                        chalk.red(
                          "Unexpected error on approving, token is not approved !!! \n"
                        )
                      );
                  }
                }
                if (instantSell) {
                  console.log(
                    chalk.green(
                      "Start selling all tokens in " +
                      chalk.yellow(delaySell) +
                      " second(s)"
                    )
                  ),
                    await new Promise((e) => setTimeout(e, delayOnSellMs));
                  const e =
                    await pcsRouterV2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                      t,
                      amountOutMin,
                      [tokenAddress, WBNB],
                      myAddress,
                      Date.now() + 6e5,
                      {
                        gasLimit: gasLimit,
                        gasPrice: gasPrice,
                        nonce: currentNonce++,
                      }
                    );
                  await e.wait(),
                    console.log(
                      chalk.green("Sucessfully sold all the tokens !\n")
                    ),
                    console.log("You can check the transaction here:"),
                    console.log(`https://bscscan.com/address/${myAddress}`),
                    console.log("\n"),
                    process.exit(0);
                } else
                  console.log("You can check the transaction here:"),
                    console.log(`https://bscscan.com/address/${myAddress}`),
                    console.log("\n"),
                    1 == antiRug &&
                    0 == instantSell &&
                    (await monitorRugPull(t, currentNonce)),
                    0 == antiRug && process.exit(0);
              }
          });
      })();
else if (1 == choseMode) {
  const e = process.env.DxSalePresaleAddress,
    o = ethers.utils.parseUnits(process.env.BNB_To_Use, "ether"),
    n = ethers.utils.parseUnits(process.env.SetGwei, "gwei"),
    t = ethers.BigNumber.from(process.env.SetGas);
  async function snipeDxSale() {
    provider.on("pending", async (s) => {
      const a = await provider.getTransaction(s);
      if (
        (process.stdout.write(
          chalk.yellow("Countdown reached 0... Scanning transactions..\r")
        ),
          (currentNonce = await getNonce(myAddress)),
          null != a && "0x" === a.data && a.to === e && "0x0" != a.value)
      ) {
        try {
          const s = await account.sendTransaction({
            from: myAddress,
            to: e,
            value: o,
            gasPrice: n,
            gasLimit: t,
            nonce: currentNonce,
          });
          await s.wait(),
            console.log(
              chalk.yellow(
                "Sniped, please check bscscan for transaction !!! \n"
              )
            ),
            process.exit(0);
        } catch (e) {
          console.log(
            chalk.yellow("Sniped, please check bscscan for transaction !!! \n")
          );
        }
        process.exit(0);
      }
    });
  }
  console.log(
    chalk.cyanBright(
      "Scanning.. Process started with " +
      process.env.countDown +
      " before countdown..\r"
    )
  ),
    setTimeout(function () {
      console.log("\r"), snipeDxSale();
    }, 1e3 * countDown - 500);
} else
  3 == choseMode
    ? (async () => {
      if (
        ((currentNonce = await getNonce(myAddress)),
          needApproval && 1 == approveBeforeOrAfter)
      ) {
        console.log(chalk.green("Start approving token..."));
        try {
          const e = await tokenContract.approve(
            pcsRouterV2Addr,
            ethers.BigNumber.from(
              "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            ),
            { gasLimit: gasLimit, gasPrice: gasPrice, nonce: currentNonce++ }
          );
          await e.wait(),
            console.log(chalk.green("Token spending approved. \n"));
        } catch (e) {
          console.log(e),
            console.log(
              chalk.red(
                "Unexpected error on approving, token is not approved !!! \n"
              )
            );
        }
      }
      console.log(
        chalk.yellow("Waiting for targeted transaction on mempool...")
      ),
        provider.on("pending", async (e) => {
          const o = await provider.getTransaction(e),
            n = 1 * Math.pow(10, 18);
          if (
            ((hexer = "0x".concat(n.toString(16))),
              (targetPrice = ethers.BigNumber.from(hexer)),
              null != o &&
              o.data.includes(token) &&
              0 == passed &&
              (o.data.includes("0x38ed1739") ||
                o.data.includes("0x18cbafe5") ||
                o.data.includes("0xfb3bdb41")) &&
              ((targetPriceDetected = targetPrice.lte(o.value)),
                targetPriceDetected))
          ) {
            const e = o.gasLimit.mul(2),
              n = o.gasPrice.mul(2);
            console.log(chalk.green("Start buying token..."));
            const t = await pcsRouterV2B.swapExactTokensForTokens(
              amountIn,
              amountOutMin,
              [WBNB, tokenAddress],
              myAddress,
              Date.now() + 6e5,
              { gasLimit: e, gasPrice: n, nonce: currentNonce++ }
            );
            (passed = 1),
              await t.wait(),
              console.log(chalk.green("Sucessfully bought the token!\n"));
            const s = await getTokenBalance(
              tokenAddress,
              myAddress,
              provider
            );
            if (
              (console.log(
                chalk.green(
                  `Total Token balance is ${chalk.yellow(
                    parseFloat(
                      ethers.utils.formatUnits(s, tokenDecimals)
                    ).toFixed(6)
                  )}\n`
                )
              ),
                needApproval && 2 == approveBeforeOrAfter)
            ) {
              console.log(chalk.green("Start approving token..."));
              try {
                const e = await tokenContract.approve(
                  pcsRouterV2Addr,
                  ethers.BigNumber.from(
                    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                  ),
                  {
                    gasLimit: gasLimit,
                    gasPrice: gasPrice,
                    nonce: currentNonce++,
                  }
                );
                await e.wait(),
                  console.log(chalk.green("Token spending approved. \n"));
              } catch (e) {
                console.log(e),
                  console.log(
                    chalk.red(
                      "Unexpected error on approving, token is not approved !!! \n"
                    )
                  );
              }
            }
            if (instantSell) {
              console.log(
                chalk.green(
                  "Start selling all tokens in " +
                  chalk.yellow(delaySell) +
                  " second(s)"
                )
              ),
                await new Promise((e) => setTimeout(e, delayOnSellMs));
              const e =
                await pcsRouterV2.swapExactTokensForETHSupportingFeeOnTransferTokens(
                  s,
                  amountOutMin,
                  [tokenAddress, WBNB],
                  myAddress,
                  Date.now() + 6e5,
                  {
                    gasLimit: gasLimit,
                    gasPrice: gasPrice,
                    nonce: currentNonce++,
                  }
                );
              await e.wait(),
                console.log(
                  chalk.green("Sucessfully sold all the tokens !\n")
                ),
                console.log("You can check the transaction here:"),
                console.log(`https://bscscan.com/address/${myAddress}`),
                console.log("\n"),
                process.exit(0);
            } else
              console.log("You can check the transaction here:"),
                console.log(`https://bscscan.com/address/${myAddress}`),
                console.log("\n"),
                process.exit(0);
          }
        });
    })()
    : (console.log(
      chalk.black.bgRed(
        "Please choose the correct mode in the setup file. Program shutting down. \n"
      )
    ),
      process.exit(0));
function convertToSeconds(e) {
  var o = e.split(":");
  return 60 * +o[0] * 60 + 60 * +o[1] + +o[2];
}
