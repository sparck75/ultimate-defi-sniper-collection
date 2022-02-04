
const ethers = require("ethers");
const env = require("dotenv");
const chalk = require("chalk");
const pcsAbi = new ethers.utils.Interface(require("./abi.json"));
const result = env.config();
if (result.error) {
  throw result.error;
}
const { startSnipe } = require('./snipe');

const TOKEN = process.env.TOKEN;
const amountIn = ethers.utils.parseUnits(process.env.PURCHASE_AMOUNT, "ether");
const gasPrice = ethers.utils.parseUnits(process.env.GAS_PRICE, "gwei");
const gasLimit = process.env.GAS_LIMIT;
const txNumberForAntibot = process.env.TRANSACTIONS_NUM;
const BSC_NODE_WSS = process.env.BSC_NODE_WSS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

let expected = parseInt(process.env.LIQUIDITY_BNB).toFixed(0);

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

const factory = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const factory_ABI = new ethers.Contract(
  factory,
  ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
    "function symbol() returns (string)"],// Human ReadAble ABI
  account
);

factory_ABI.on("PairCreated", async (token0, token1, addressPair) => {
  console.log(`
  -----------------
  LP-Pair Detected
  -----------------
  token0: ${token0}
  token1: ${token1}
  addressPair: ${addressPair}
  `);
  let tokenIn, tokenOut;
  if (token0 === WBNB) {
    tokenIn = token0;
    tokenOut = token1;
  }

  if (token1 == WBNB) {
    tokenIn = token1;
    tokenOut = token0;
  }

  startSnipe(tokenOut);
})




