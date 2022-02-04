"use strict";
const { Client } = require("tdl");
const { TDLib } = require("tdl-tdlib-addon");
const { parseMessage } = require("./parser");
const tdlib = new TDLib();
const chats = ['-1001519789792', '-1001618359068'];
const STARTUP_TIME = new Date().getTime() / 1000;
const ora = require('ora');
let whitelisted
let spinner

const env = require("dotenv");
const { processToken } = require("./processToken");
const result = env.config()
if (result.error) {
  throw result.error
}

if (!process.env.PRIVATE_KEY) {
  throw (
    "The private key was not found in .env. Enter the private key in .env."
  );
}

if (!process.env.RECIPIENT) {
  throw (
    "The public address (RECIPIENT) was not found in .env. Enter your public address in .env."
  );
}

function run() {
  let whitelistalways = process.env.WHITELIST_ALWAYS || "false"
  let whitelistonly = process.env.WHITELIST_ONLY || "false"
  let manualonly = process.env.MANUAL_ONLY || "false"
  let readonly = process.env.READ_ONLY || "false"
  let coinmarketcap = process.env.COINMARKETCAP || "false"
  let coingecko = process.env.COINGECKO || "false"

  console.log("")
  if (whitelistalways === "true") {
    console.log("Always buying whitelisted tokens.")
    console.log("")
  }
  if (readonly === "true" || whitelistalways === "false" && coinmarketcap === "false" && coingecko === "false") {
    console.log("Running in read-only mode.")
    console.log("")
    manualonly = "false"
    whitelistonly = "false"
  } else {
    if (manualonly === "true") {
      console.log("Running in manual buy mode.")
      console.log("")
      whitelistonly = "false"
    } else {
      if (whitelistonly === "true") {
        console.log("Running in whitelist only mode.")
        whitelisted = process.env.WHITELIST.split(',')
        console.log("Whitelisted tokens: " + whitelisted)
        console.log("")
      }
    }
  }
  main(readonly, whitelistonly, whitelistalways, manualonly);
}


const main = async (readonly, whitelistonly, whitelistalways, manualonly) => {
  let coinmarketcap = process.env.COINMARKETCAP || "false"
  let coinmarketcap_purchaseamount = process.env.COINMARKETCAP_PURCHASEAMOUNT || "0.001"
  let whitelist_purchaseamount = process.env.WHITELIST_PURCHASEAMOUNT || "0.001"
  let coingecko = process.env.COINGECKO || "false"
  let coingecko_purchaseamount = process.env.COINGECKO_PURCHASEAMOUNT || "0.001"
  let purchaseAmount

  console.log("Wallet:", process.env.RECIPIENT);
  console.log("Node:", process.env.BSC_NODE_WSS);
  //console.log("Purchase Amount:", process.env.PURCHASE_AMOUNT);
  console.log("Gas Limit:", process.env.GAS_LIMIT);
  console.log("Gas Price:", process.env.GAS_PRICE);
  console.log("")
  if (whitelistalways === "true" || whitelistonly === "true") {
    console.log("Whitelisted Purchase Amount:", process.env.WHITELIST_PURCHASEAMOUNT);
    whitelisted = process.env.WHITELIST.split(',');
  }
  if (coinmarketcap === "true") {
    console.log("CoinMarketCap Purchase Amount:", process.env.COINMARKETCAP_PURCHASEAMOUNT);
  }
  if (coingecko === "true") {
    console.log("CoinGecko Purchase Amount:", process.env.COINGECKO_PURCHASEAMOUNT);
  }
  console.log("")
  try {
    const apiId = process.env.APP_ID || "1234"
    const apiHash = process.env.APP_HASH || "1234"
    const client = new Client(tdlib, {
      apiId: apiId,
      apiHash: apiHash,
      verbosityLevel: 0,
    });

    await client.connectAndLogin();
    spinner = ora('Waiting for new listings...').start();
    client.on("update", async (update) => {
      if (
        update._ === "updateNewMessage" &&
        update.message.content._ === "messageText" &&
        update.message.date >= STARTUP_TIME &&
        chats.includes(update.message.chat_id.toString())
      ) {
        //console.log(chats.includes(update.message.chat_id.toString()))
        const chatid = update.message.chat_id.toString()
        const { message } = update;
        //console.log(update)
        let token = await parseMessage(message);
        //console.log(token)
        if (token) {
          //cmc
          if ((chatid === '-1001519789792') && coinmarketcap === 'true') {
            spinner.info("New CoinMarketCap listing: " + token)
            purchaseAmount = coinmarketcap_purchaseamount
            if (whitelistalways === "true" && whitelisted.includes(token)) {
              purchaseAmount = whitelist_purchaseamount
              console.log("")
              console.log("Whitelisted. Buying with: " + purchaseAmount + " BNB")
            }
            await processToken(readonly, whitelistonly, manualonly, token, purchaseAmount, whitelisted);
          }
          //cg
          if ((chatid === '-1001618359068') && coingecko === 'true') {
            spinner.info("New CoinGecko listing: " + token)
            purchaseAmount = coingecko_purchaseamount
            if (whitelistalways === "true" && whitelisted.includes(token)) {
              purchaseAmount = whitelist_purchaseamount
              console.log("")
              console.log("Whitelisted. Buying with: " + purchaseAmount + " BNB")
            }
            await processToken(readonly, whitelistonly, manualonly, token, purchaseAmount, whitelisted);
          }
          // if (chatid === '') {
          //   spinner.info("New ChannelTester listing: " + token)
          //   purchaseAmount = coingecko_purchaseamount
          //   if (whitelistalways === "true" && whitelisted.includes(token)) {
          //     purchaseAmount = whitelist_purchaseamount
          //     console.log("")
          //     console.log("Whitelisted. Buying with: " + purchaseAmount + " BNB")
          //   }
          //   await processToken(readonly, whitelistonly, manualonly, token, purchaseAmount, whitelisted);
          //   console.log("")
          // }
          spinner = ora('Waiting for new listings...').start();
        }
      }
    });
  } catch (e) {
    console.log(e);
  }
};

run();
