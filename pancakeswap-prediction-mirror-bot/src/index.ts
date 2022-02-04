import env from "dotenv";
import * as ethers from "ethers";
import InputDataDecoder from "ethereum-input-data-decoder";
import {
  PancakePredictionV2,
  PancakePredictionV2__factory,
} from "./types/typechain";
import { getClaimableEpochs } from "./lib";
const ABI = require("./pancake-swap-abi.json");
const decoder = new InputDataDecoder(ABI);
const result = env.config();

if (result.error) {
  throw result.error;
}

const GLOBAL_CONFIG = {
  PPV2_ADDRESS: "0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA",
  AMOUNT_TO_BET: process.env.BET_AMOUNT || "0.1", // in BNB,
  PROVIDER: process.env.BSC_NODE_WSS, // You can provide any custom RPC
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  RECIPIENT: process.env.RECIPIENT,
  TRACK: process.env.WALLET_TO_TRACK,
};

let provider: ethers.ethers.providers.WebSocketProvider;
let wallet: ethers.ethers.Signer;
let account;
let predictionContract: PancakePredictionV2;

const EXPECTED_PONG_BACK = 15000;
const KEEP_ALIVE_CHECK_INTERVAL = 7500;

const startConnection = async () => {
  provider = new ethers.providers.WebSocketProvider(
    GLOBAL_CONFIG.PROVIDER as string
  );
  let pingTimeout: NodeJS.Timeout;
  let keepAliveInterval: NodeJS.Timer;

  provider._websocket.on("open", () => {

    keepAliveInterval = setInterval(() => {
      provider._websocket.ping();

      // Use `WebSocket#terminate()`, which immediately destroys the connection,
      // instead of `WebSocket#close()`, which waits for the close timer.
      // Delay should be equal to the interval at which your server
      // sends out pings plus a conservative assumption of the latency.
      pingTimeout = setTimeout(() => {
        provider._websocket.terminate();
      }, EXPECTED_PONG_BACK);
    }, KEEP_ALIVE_CHECK_INTERVAL);

    wallet = new ethers.Wallet(GLOBAL_CONFIG.PRIVATE_KEY as string);

    account = wallet.connect(provider);
  
    predictionContract = PancakePredictionV2__factory.connect(
      GLOBAL_CONFIG.PPV2_ADDRESS,
      account
    );
    console.log("Watching for new bets from " + GLOBAL_CONFIG.TRACK + "...");
    provider.on("pending", async (txHash) => {
      provider.getTransaction(txHash).then(async (tx) => {
        //console.log(txHash);
        if (tx && GLOBAL_CONFIG.TRACK === tx.from) {
          console.log("New transaction from " + tx.from);
          const result = decoder.decodeData(tx.data);
          if (result.method === "betBull" || result.method === "betBear") {
            let method = result.method.toString();
            let epochBet = result.inputs.toString();
            if (method === "betBear") {
              try {
                const tx = await predictionContract.betBear(epochBet, {
                  value: ethers.utils.parseUnits(
                    GLOBAL_CONFIG.AMOUNT_TO_BET,
                    "ether"
                  ),
                });

                console.log("Bear Betting Tx Started.");

                await tx.wait();

                console.log("Bear Betting Tx Success.");
              } catch {
                console.log("Bet failed.");
              }
            }
            if (method === "betBull") {
              try {
                const tx = await predictionContract.betBull(epochBet, {
                  value: ethers.utils.parseUnits(
                    GLOBAL_CONFIG.AMOUNT_TO_BET,
                    "ether"
                  ),
                });

                console.log("Bull Betting Tx Started.");

                await tx.wait();

                console.log("Bull Betting Tx Success.");
              } catch {
                console.log("Bet failed.");
              }
            }
          }
        }
      });
    });

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
  });
};

let checkClaims: () => Promise<void>;
checkClaims = async () => {
  predictionContract.on(
    "StartRound",
    async (epoch: ethers.ethers.BigNumber) => {
      const claimableEpochs = await getClaimableEpochs(
        predictionContract,
        epoch,
        GLOBAL_CONFIG.RECIPIENT as string
      );

      if (claimableEpochs.length) {
        try {
          const tx = await predictionContract.claim(claimableEpochs);
          console.log("Claim Tx Started");
          const receipt = await tx.wait();
          console.log("Claim Tx Success\n");
        } catch {
          console.log("Claim Tx Error\n");
        }
      }
    }
  );
};
startConnection();
