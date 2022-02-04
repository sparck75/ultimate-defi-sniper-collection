import { BigNumber } from "@ethersproject/bignumber";
import { JsonRpcProvider } from "@ethersproject/providers";
import { formatEther, parseEther } from "@ethersproject/units";
import { Wallet } from "@ethersproject/wallet";
import { blue, green, red } from "chalk";
import { clear } from "console";
import * as dotenv from "dotenv";
import ora from "ora";

import { reduceWaitingTimeByTwoBlocks, sleep, getClaimableEpochs } from "./lib";

import {
  TradingViewScan,
  SCREENERS_ENUM,
  EXCHANGES_ENUM,
  INTERVALS_ENUM,
} from "trading-view-recommends-parser-nodejs";

import { PancakePredictionV2__factory } from "./types/typechain";

const result = dotenv.config();
if (result.error) {
  throw result.error;
}

// Global Config
const GLOBAL_CONFIG = {
  PPV2_ADDRESS: "0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA",
  AMOUNT_TO_BET: process.env.BET_AMOUNT || "0.02", // in BNB,
  BSC_RPC: process.env.BSC_RPC || "https://bsc-dataseed1.ninicoin.io/", // You can provide any custom RPC
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  WAITING_TIME: 275500, // Waiting for 275.5 Seconds
};

clear();
console.log(green("PancakeSwap Predictions Bot"));

if (!GLOBAL_CONFIG.PRIVATE_KEY) {
  throw "The private key was not found in .env. Enter the private key in .env.";
}

const signer = new Wallet(
  GLOBAL_CONFIG.PRIVATE_KEY as string,
  new JsonRpcProvider(GLOBAL_CONFIG.BSC_RPC)
);

const predictionContract = PancakePredictionV2__factory.connect(
  GLOBAL_CONFIG.PPV2_ADDRESS,
  signer
);

console.log(blue("Amount to Bet:", GLOBAL_CONFIG.AMOUNT_TO_BET, "BNB"));

const spinner = ora(
  "Waiting for the next round. It may take up to 5 minutes, please wait."
).start();

predictionContract.on("StartRound", async (epoch: BigNumber) => {
  spinner.stop();
  const epochspinner = ora().start();
  epochspinner.info("Started Epoch " + epoch.toString());
  const WAITING_TIME = GLOBAL_CONFIG.WAITING_TIME;
  const spinner2 = ora(
    "Now waiting for " + WAITING_TIME / 60000 + " min\n"
  ).start();
  const spinner3 = ora();
  const spinner4 = ora();
  const spinner5 = ora();

  await sleep(WAITING_TIME);

  const result = await new TradingViewScan(
    SCREENERS_ENUM["crypto"],
    EXCHANGES_ENUM["BINANCE"],
    "BNBUSDT",
    INTERVALS_ENUM["5m"]
  ).analyze();
  var obj = JSON.stringify(result.summary);
  var recommendation = JSON.parse(obj);

  const minresult = await new TradingViewScan(
    SCREENERS_ENUM["crypto"],
    EXCHANGES_ENUM["BINANCE"],
    "BNBUSDT",
    INTERVALS_ENUM["1m"]
  ).analyze();
  var minobj = JSON.stringify(minresult.summary);
  var minrecommendation = JSON.parse(minobj);
  spinner2.stop();
  console.log(
    "5m BNBUSDT Buy Signals:",
    recommendation.BUY,
    "|",
    "5m BNBUSDT Sell Signals:",
    recommendation.SELL
  );
  console.log(
    "1m BNBUSDT Buy Signals:",
    minrecommendation.BUY,
    "|",
    "1m BNBUSDT Sell Signals:",
    minrecommendation.SELL
  );
  console.log(" ");
  spinner5.start();
  if (
    recommendation.BUY -
      recommendation.SELL +
      (minrecommendation.BUY - minrecommendation.SELL) >=
    16
  ) {
    spinner5.info(green("Betting on Bull Bet."));
  } else if (
    recommendation.BUY -
      recommendation.SELL +
      (minrecommendation.BUY - minrecommendation.SELL) <=
    -16
  ) {
    spinner5.info(green("Betting on Bear Bet."));
  } else {
    spinner5.info(red("No bet this round."));
  }
  if (
    recommendation.BUY -
      recommendation.SELL +
      (minrecommendation.BUY - minrecommendation.SELL) <=
    -16
  ) {
    try {
      const tx = await predictionContract.betBear(epoch, {
        value: parseEther(GLOBAL_CONFIG.AMOUNT_TO_BET),
      });
      spinner3.start("Bear Betting Tx Started\n");

      await tx.wait();

      spinner3.succeed(blue("Bear Betting Tx Success\n"));
    } catch {
      spinner3.fail(red("Bear Betting Tx Error\n"));

      GLOBAL_CONFIG.WAITING_TIME = reduceWaitingTimeByTwoBlocks(
        GLOBAL_CONFIG.WAITING_TIME
      );
    }
  } else if (
    recommendation.BUY -
      recommendation.SELL +
      (minrecommendation.BUY - minrecommendation.SELL) >=
    16
  ) {
    try {
      const tx = await predictionContract.betBull(epoch, {
        value: parseEther(GLOBAL_CONFIG.AMOUNT_TO_BET),
      });
      spinner3.start("Bull Betting Tx Started");

      await tx.wait();
      spinner3.succeed(blue("Bull Betting Tx Success\n"));
    } catch {
      spinner3.fail(red("Bull Betting Tx Error\n"));

      GLOBAL_CONFIG.WAITING_TIME = reduceWaitingTimeByTwoBlocks(
        GLOBAL_CONFIG.WAITING_TIME
      );
    }
  } else {
    console.log(
      "Technical Analysis not definitive enough. Skipping round...\n"
    );
  }

  const claimableEpochs = await getClaimableEpochs(
    predictionContract,
    epoch,
    signer.address
  );

  if (claimableEpochs.length) {
    try {
      const tx = await predictionContract.claim(claimableEpochs);
      spinner4.start("Claim Tx Started");

      const receipt = await tx.wait();
      spinner4.succeed(green("Claim Tx Success\n"));
    } catch {
      spinner4.fail(red("Claim Tx Error\n"));
    }
  }
});
